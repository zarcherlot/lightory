import { validateRobotPlanLocally } from '../../robot/robotPlanSchema.js';
import type { RobotPlan, RobotPlanStep } from '../../robot/types.js';
import {
  MOVEMENT_ARTIFACT_SCHEMA_ID,
  SPEECH_ARTIFACT_SCHEMA_ID,
} from '../domain/artifactSchemas.js';
import type { AgentArtifact, AgentDelivery, BlueprintNode } from '../domain/types.js';
import { analyzeAgentWorkflow } from '../workflow/agentWorkflow.js';
import type {
  BlueprintCompileIssue,
  BlueprintCompileOptions,
  BlueprintCompileResult,
  ChildActionPreview,
} from './types.js';

const DEFAULT_LINEAR_SPEED_MPS = 0.05;
const MAX_LINEAR_SPEED_MPS = 0.5;
const DEFAULT_ANGULAR_SPEED_RADPS = (20 * Math.PI) / 180;
const MAX_ANGULAR_SPEED_RADPS = Math.PI / 4;
const MAX_DRIVE_DISTANCE_METERS = 200;
const MAX_DRIVE_DISTANCE_PER_STEP_METERS = 2;
const MAX_ROTATE_ANGLE_RAD = 40 * Math.PI;
const MAX_ROTATE_ANGLE_PER_STEP_RAD = 2 * Math.PI;

export function compileAcceptedBlueprint(
  options: BlueprintCompileOptions,
): BlueprintCompileResult {
  const analysis = analyzeAgentWorkflow(options.document);
  const errors: BlueprintCompileIssue[] = analysis.issues.map((message) => ({
    code: 'workflow_invalid',
    message,
  }));
  const warnings: BlueprintCompileIssue[] = [];
  const preview: ChildActionPreview[] = [];
  const steps: RobotPlanStep[] = [];
  const createId = options.createId ?? defaultCreateId;
  const labels = new Map(options.document.nodes.map((node) => [node.id, node]));
  const acceptedDeliveries = new Map(
    options.document.deliveries
      .filter((delivery) => delivery.status === 'accepted')
      .map((delivery) => [delivery.id, delivery]),
  );
  const terminalStepIds = new Map<string, string[]>();
  const startNodes = options.document.nodes.filter(({ kind }) => kind === 'start');
  const endNodes = options.document.nodes.filter(({ kind }) => kind === 'end');

  for (const start of startNodes) {
    if (options.document.edges.some(({ targetId }) => targetId === start.id)) {
      errors.push({ code: 'start_has_input', message: `开始模块“${start.label}”不能接收连线。`, nodeId: start.id });
    }
  }
  for (const end of endNodes) {
    if (options.document.edges.some(({ sourceId }) => sourceId === end.id)) {
      errors.push({ code: 'end_has_output', message: `结束模块“${end.label}”不能发出连线。`, nodeId: end.id });
    }
    if (!options.document.edges.some(({ targetId }) => targetId === end.id)) {
      errors.push({ code: 'end_has_no_input', message: `结束模块“${end.label}”还没有接到任务流程。`, nodeId: end.id });
    }
  }
  if (endNodes.length === 0) {
    warnings.push({ code: 'end_missing', message: '建议增加结束模块，明确任务怎样完成并安全停车。' });
  }

  for (const workflowNode of analysis.workflow.nodes) {
    if (workflowNode.status !== 'accepted') {
      errors.push({
        code: 'artifact_not_accepted',
        message: `模块“${readLabel(labels.get(workflowNode.nodeId), workflowNode.nodeId)}”还没有可用的已验收交付。`,
        nodeId: workflowNode.nodeId,
      });
    }
  }
  if (errors.length > 0) return { ok: false, preview, errors, warnings };

  for (const batch of analysis.workflow.batches) {
    for (const nodeId of batch) {
      const workflowNode = analysis.workflow.nodes.find((item) => item.nodeId === nodeId);
      const delivery = workflowNode?.acceptedDeliveryId
        ? acceptedDeliveries.get(workflowNode.acceptedDeliveryId)
        : undefined;
      if (!workflowNode || !delivery) continue;
      const dependencyStepIds = workflowNode.dependsOnNodeIds.flatMap(
        (dependencyId) => terminalStepIds.get(dependencyId) ?? [],
      );
      const terminals = compileArtifact({
        artifact: delivery.artifact,
        delivery,
        nodeId,
        nodeLabel: readLabel(labels.get(nodeId), nodeId),
        dependencyStepIds,
        dependsOnNodeIds: workflowNode.dependsOnNodeIds,
        createId,
        steps,
        preview,
        errors,
      });
      terminalStepIds.set(nodeId, terminals);
    }
  }

  for (const end of endNodes) {
    const upstreamNodeIds = findUpstreamExecutableNodeIds(
      end.id,
      options.document,
      new Set(analysis.workflow.nodes.map(({ nodeId }) => nodeId)),
    );
    const dependencies = upstreamNodeIds.flatMap((nodeId) => terminalStepIds.get(nodeId) ?? []);
    if (dependencies.length === 0) continue;
    const stopId = createId('step');
    steps.push({ id: stopId, tool: 'base.stop', args: {}, dependsOn: dependencies });
    preview.push({
      id: createId('preview'),
      nodeId: end.id,
      nodeLabel: readLabel(end, end.id),
      kind: 'stop',
      description: end.control?.completionCondition.trim()
        ? `完成“${end.control.completionCondition.trim()}”后安全停车`
        : '任务完成后安全停车',
      dependsOnNodeIds: upstreamNodeIds,
    });
  }

  if (errors.length > 0) return { ok: false, preview, errors, warnings };
  if (steps.length === 0) {
    errors.push({ code: 'no_actions', message: '蓝图没有可执行动作，请检查工程师交付。' });
    return { ok: false, preview, errors, warnings };
  }

  const now = options.now?.() ?? new Date();
  const hasMovement = steps.some((step) => step.tool.startsWith('base.'));
  const plan: RobotPlan = {
    schemaVersion: 'robot-plan/v1',
    planId: createId('blueprint-plan'),
    createdAt: now.toISOString(),
    createdBy: {
      padId: options.padId,
      sessionId: options.sessionId,
      agentRunId: `blueprint-${analysis.workflow.blueprintRevisionId || 'draft'}`,
    },
    intent: [
      ...startNodes.map(({ control }) => control?.inputInformation.trim()).filter(Boolean),
      `执行孩子设计的蓝图：${preview.map(({ description }) => description).join('；')}`,
    ].join('；'),
    risk: hasMovement ? 'high' : 'low',
    requiresUserConfirmation: hasMovement,
    assumptions: [
      '所有动作来自孩子已验收的结构化工程师制品。',
      ...(hasMovement ? ['移动仅允许在安全测试环境中模拟或经监护人确认后执行。'] : []),
    ],
    steps,
    constraints: {
      maxDurationMs: Math.max(5_000, steps.length * 16_000),
      maxSteps: steps.length,
      allowedTools: [...new Set(steps.map(({ tool }) => tool))],
    },
  };
  const validation = validateRobotPlanLocally(plan, options.robotTools);
  errors.push(...validation.errors.map((issue) => ({ ...issue, code: `plan_${issue.code}` })));
  warnings.push(...validation.warnings.map((issue) => ({ ...issue, code: `plan_${issue.code}` })));
  return {
    ok: errors.length === 0,
    preview,
    ...(errors.length === 0 ? { plan } : {}),
    errors,
    warnings,
  };
}

function findUpstreamExecutableNodeIds(
  targetId: string,
  document: BlueprintCompileOptions['document'],
  executableNodeIds: Set<string>,
): string[] {
  const incoming = new Map<string, string[]>();
  for (const edge of document.edges) incoming.set(edge.targetId, [...(incoming.get(edge.targetId) ?? []), edge.sourceId]);
  const result = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string): void => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const sourceId of incoming.get(nodeId) ?? []) {
      if (executableNodeIds.has(sourceId)) result.add(sourceId);
      else visit(sourceId);
    }
  };
  visit(targetId);
  return [...result].sort();
}

interface CompileArtifactContext {
  artifact: AgentArtifact;
  delivery: AgentDelivery;
  nodeId: string;
  nodeLabel: string;
  dependencyStepIds: string[];
  dependsOnNodeIds: string[];
  createId: (prefix: string) => string;
  steps: RobotPlanStep[];
  preview: ChildActionPreview[];
  errors: BlueprintCompileIssue[];
}

function compileArtifact(context: CompileArtifactContext): string[] {
  if (context.artifact.schemaId === MOVEMENT_ARTIFACT_SCHEMA_ID) {
    return compileMovementArtifact(context);
  }
  if (context.artifact.schemaId === SPEECH_ARTIFACT_SCHEMA_ID) {
    return compileSpeechArtifact(context);
  }
  context.errors.push({
    code: 'unsupported_artifact',
    message: `模块“${context.nodeLabel}”的交付格式暂时不能编译，请让工程师重新交付。`,
    nodeId: context.nodeId,
  });
  return [];
}

function compileMovementArtifact(context: CompileArtifactContext): string[] {
  const actions = context.artifact.payload.actions;
  if (!Array.isArray(actions) || actions.length === 0) {
    context.errors.push({
      code: 'movement_actions_missing',
      message: `模块“${context.nodeLabel}”没有明确的移动距离或转向角度。`,
      nodeId: context.nodeId,
    });
    return [];
  }
  let dependencies = context.dependencyStepIds;
  for (const rawAction of actions) {
    if (!isRecord(rawAction)) {
      addInvalidAction(context, '移动动作格式不正确。');
      continue;
    }
    if (rawAction.type === 'driveDistance') {
      const distance = readFiniteNumber(rawAction.distanceMeters);
      const speed = rawAction.maxSpeedMps === undefined
        ? DEFAULT_LINEAR_SPEED_MPS
        : readFiniteNumber(rawAction.maxSpeedMps);
      if (distance === undefined || distance === 0 || Math.abs(distance) > MAX_DRIVE_DISTANCE_METERS) {
        addInvalidAction(context, '移动距离必须是非零数值，且总距离不超过 200 米。');
        continue;
      }
      if (speed === undefined || speed <= 0 || speed > MAX_LINEAR_SPEED_MPS) {
        addInvalidAction(context, '移动速度必须大于 0 且不超过 0.5 米/秒。');
        continue;
      }
      const chunks = splitMagnitude(distance, MAX_DRIVE_DISTANCE_PER_STEP_METERS);
      for (const chunk of chunks) {
        dependencies = appendMovementStep(context, {
          tool: 'base.driveDistance',
          args: { distanceMeters: chunk, maxSpeedMps: speed },
          dependencies,
          safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: speed },
        });
      }
      context.preview.push({
        id: context.createId('preview'),
        nodeId: context.nodeId,
        nodeLabel: context.nodeLabel,
        kind: 'move',
        description: `${distance > 0 ? '前进' : '后退'} ${formatNumber(Math.abs(distance))} 米`,
        dependsOnNodeIds: context.dependsOnNodeIds,
      });
      continue;
    }
    if (rawAction.type === 'rotateAngle') {
      const angle = readFiniteNumber(rawAction.angleRad);
      const angularSpeed = rawAction.maxAngularRadps === undefined
        ? DEFAULT_ANGULAR_SPEED_RADPS
        : readFiniteNumber(rawAction.maxAngularRadps);
      if (angle === undefined || angle === 0 || Math.abs(angle) > MAX_ROTATE_ANGLE_RAD) {
        addInvalidAction(context, '旋转角度必须是非零数值，且不超过 20 圈。');
        continue;
      }
      if (angularSpeed === undefined || angularSpeed <= 0 || angularSpeed > MAX_ANGULAR_SPEED_RADPS) {
        addInvalidAction(context, '旋转速度必须大于 0 且不超过 45 度/秒。');
        continue;
      }
      const chunks = splitMagnitude(angle, MAX_ROTATE_ANGLE_PER_STEP_RAD);
      for (const chunk of chunks) {
        dependencies = appendMovementStep(context, {
          tool: 'base.rotateAngle',
          args: { angleRad: chunk, maxAngularRadps: angularSpeed },
          dependencies,
          safety: { requiresLease: 'base', stopOnObstacle: true },
        });
      }
      context.preview.push({
        id: context.createId('preview'),
        nodeId: context.nodeId,
        nodeLabel: context.nodeLabel,
        kind: 'turn',
        description: `${angle > 0 ? '左转' : '右转'} ${formatNumber(Math.abs((angle * 180) / Math.PI))} 度`,
        dependsOnNodeIds: context.dependsOnNodeIds,
      });
      continue;
    }
    addInvalidAction(context, '发现当前版本不支持的移动动作。');
  }
  return dependencies;
}

function appendMovementStep(
  context: CompileArtifactContext,
  input: Pick<RobotPlanStep, 'tool' | 'args' | 'safety'> & { dependencies: string[] },
): string[] {
  const actionId = context.createId('step');
  context.steps.push({
    id: actionId,
    tool: input.tool,
    args: input.args,
    ...(input.dependencies.length > 0 ? { dependsOn: input.dependencies } : {}),
    timeoutMs: 15_000,
    safety: input.safety,
  });
  const stopId = context.createId('step');
  context.steps.push({ id: stopId, tool: 'base.stop', args: {}, dependsOn: [actionId] });
  return [stopId];
}

function compileSpeechArtifact(context: CompileArtifactContext): string[] {
  const text = typeof context.artifact.payload.text === 'string'
    ? context.artifact.payload.text.trim()
    : '';
  const trigger = context.artifact.payload.trigger;
  if (!text) {
    context.errors.push({
      code: 'speech_text_missing',
      message: `模块“${context.nodeLabel}”没有明确要说的话。`,
      nodeId: context.nodeId,
    });
    return [];
  }
  if (trigger !== 'start' && trigger !== 'after-input') {
    context.errors.push({
      code: 'speech_trigger_invalid',
      message: `模块“${context.nodeLabel}”的播报时机不明确。`,
      nodeId: context.nodeId,
    });
    return [];
  }
  if (trigger === 'after-input' && context.dependencyStepIds.length === 0) {
    context.errors.push({
      code: 'speech_input_missing',
      message: `模块“${context.nodeLabel}”要在上游完成后播报，但蓝图没有连接上游模块。`,
      nodeId: context.nodeId,
    });
    return [];
  }
  const stepId = context.createId('step');
  const dependencies = trigger === 'after-input' ? context.dependencyStepIds : [];
  context.steps.push({
    id: stepId,
    tool: 'speech.say',
    args: { text },
    ...(dependencies.length > 0 ? { dependsOn: dependencies } : {}),
    timeoutMs: 5_000,
  });
  context.preview.push({
    id: context.createId('preview'),
    nodeId: context.nodeId,
    nodeLabel: context.nodeLabel,
    kind: 'speech',
    description: `播报“${text}”`,
    dependsOnNodeIds: trigger === 'after-input' ? context.dependsOnNodeIds : [],
  });
  return [stepId];
}

function addInvalidAction(context: CompileArtifactContext, message: string): void {
  context.errors.push({ code: 'movement_action_invalid', message, nodeId: context.nodeId });
}

function splitMagnitude(value: number, maxMagnitude: number): number[] {
  const result: number[] = [];
  let remaining = value;
  while (Math.abs(remaining) > maxMagnitude) {
    const chunk = Math.sign(remaining) * maxMagnitude;
    result.push(chunk);
    remaining -= chunk;
  }
  if (Math.abs(remaining) > Number.EPSILON) result.push(remaining);
  return result;
}

function readLabel(node: BlueprintNode | undefined, fallback: string): string {
  return node?.label.trim() || fallback;
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function defaultCreateId(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}
