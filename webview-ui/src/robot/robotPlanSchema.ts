import type {
  PlanValidationIssue,
  PlanValidationResult,
  RobotPlan,
  RobotRisk,
  RobotToolDefinition,
} from './types.js';

const riskRank: Record<RobotRisk, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function validateRobotPlanLocally(
  plan: RobotPlan,
  tools: RobotToolDefinition[],
): PlanValidationResult {
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  const errors: PlanValidationIssue[] = [];
  const warnings: PlanValidationIssue[] = [];

  if (plan.schemaVersion !== 'robot-plan/v1') {
    errors.push({ code: 'schema_version', message: 'Unsupported robot plan schema.' });
  }
  if (plan.steps.length > plan.constraints.maxSteps) {
    errors.push({ code: 'max_steps', message: 'Plan exceeds maxSteps.' });
  }
  if (plan.constraints.maxDurationMs <= 0) {
    errors.push({ code: 'max_duration', message: 'Plan maxDurationMs must be positive.' });
  }

  const stepIds = new Set<string>();
  for (const step of plan.steps) {
    if (stepIds.has(step.id)) {
      errors.push({
        code: 'duplicate_step',
        message: `Duplicate step ${step.id}.`,
        stepId: step.id,
      });
    }
    stepIds.add(step.id);

    const tool = toolMap.get(step.tool);
    if (!tool) {
      errors.push({
        code: 'missing_tool',
        message: `Robot tool ${step.tool} is unavailable.`,
        stepId: step.id,
      });
      continue;
    }
    if (!plan.constraints.allowedTools.includes(step.tool)) {
      errors.push({
        code: 'tool_not_allowed',
        message: `Tool ${step.tool} is not in allowedTools.`,
        stepId: step.id,
      });
    }
    if (plan.constraints.forbiddenTools?.includes(step.tool)) {
      errors.push({
        code: 'tool_forbidden',
        message: `Tool ${step.tool} is forbidden.`,
        stepId: step.id,
      });
    }
    if (!isAlwaysAllowedStopTool(step.tool) && riskRank[tool.risk] > riskRank[plan.risk]) {
      errors.push({
        code: 'risk_mismatch',
        message: `Tool ${step.tool} risk exceeds plan risk.`,
        stepId: step.id,
      });
    }
    if (
      !isAlwaysAllowedStopTool(step.tool) &&
      (tool.risk === 'high' || tool.risk === 'critical') &&
      !plan.requiresUserConfirmation
    ) {
      errors.push({
        code: 'confirmation_required',
        message: `Tool ${step.tool} requires user confirmation.`,
        stepId: step.id,
      });
    }
    if (tool.requiresLease && step.safety?.requiresLease !== tool.requiresLease) {
      errors.push({
        code: 'lease_required',
        message: `Tool ${step.tool} requires ${tool.requiresLease} lease.`,
        stepId: step.id,
      });
    }
    if (step.tool === 'reactive.run') {
      errors.push(...validateReactiveRunStep(step));
    }
  }

  for (const step of plan.steps) {
    for (const dependency of step.dependsOn ?? []) {
      if (!stepIds.has(dependency)) {
        errors.push({
          code: 'missing_dependency',
          message: `Missing dependency ${dependency}.`,
          stepId: step.id,
        });
      }
    }
  }

  if (hasCycle(plan)) {
    errors.push({ code: 'cycle', message: 'Plan dependencies contain a cycle.' });
  }

  if (!plan.steps.some((step) => step.tool === 'base.stop' || step.tool === 'watchdog.release')) {
    warnings.push({
      code: 'no_stop_fallback',
      message: 'Plan has no explicit stop or release fallback.',
    });
  }

  return {
    ok: errors.length === 0,
    planId: plan.planId,
    normalizedPlan: errors.length === 0 ? plan : undefined,
    errors,
    warnings,
  };
}

function validateReactiveRunStep(step: RobotPlan['steps'][number]): PlanValidationIssue[] {
  const errors: PlanValidationIssue[] = [];
  const args = step.args;
  const durationMs = asNumber(args.durationMs);
  if (durationMs === undefined || durationMs <= 0 || durationMs > 120_000) {
    errors.push({
      code: 'reactive_duration_limit',
      message: 'durationMs must be <= 120000ms.',
      stepId: step.id,
    });
  }

  const sourceIds = validateReactiveSources(args.sources, step.id, errors);
  const processorIds = validateReactiveProcessors(args.processors, sourceIds, step.id, errors);
  const outputTypes = validateReactiveOutputs(
    args.outputs,
    new Set([...sourceIds, ...processorIds]),
    step.id,
    errors,
  );

  const safety = isRecord(args.safety) ? args.safety : {};
  if (args.safety !== undefined && !isRecord(args.safety)) {
    errors.push({ code: 'reactive_safety', message: 'safety must be an object.', stepId: step.id });
  }
  const maxSpeedMps = asNumber(safety.maxSpeedMps ?? 0.2);
  const maxAngularRadps = asNumber(safety.maxAngularRadps ?? 0.349066);
  const stopOnSilenceMs = asNumber(safety.stopOnSilenceMs ?? 5000);
  if (maxSpeedMps === undefined || maxSpeedMps <= 0 || maxSpeedMps > 0.5) {
    errors.push({
      code: 'reactive_speed_limit',
      message: 'safety.maxSpeedMps must be <= 0.5.',
      stepId: step.id,
    });
  }
  if (maxAngularRadps === undefined || maxAngularRadps <= 0 || maxAngularRadps > 0.785398) {
    errors.push({
      code: 'reactive_angular_limit',
      message: 'safety.maxAngularRadps must be <= 0.785398.',
      stepId: step.id,
    });
  }
  if (stopOnSilenceMs === undefined || stopOnSilenceMs <= 0) {
    errors.push({
      code: 'reactive_silence_limit',
      message: 'safety.stopOnSilenceMs must be positive.',
      stepId: step.id,
    });
  }

  if (outputTypes.has('base.motionReactive')) {
    if (step.safety?.requiresLease !== 'base') {
      errors.push({
        code: 'lease_required',
        message: 'base.motionReactive requires base lease.',
        stepId: step.id,
      });
    }
    if (step.safety?.stopOnObstacle !== true) {
      errors.push({
        code: 'reactive_obstacle_stop',
        message: 'base.motionReactive requires stopOnObstacle.',
        stepId: step.id,
      });
    }
  }

  return errors;
}

function validateReactiveSources(
  raw: unknown,
  stepId: string,
  errors: PlanValidationIssue[],
): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push({
      code: 'reactive_sources_required',
      message: 'sources must be a non-empty array.',
      stepId,
    });
    return ids;
  }
  for (const item of raw) {
    if (!isRecord(item) || !validNodeId(item.id) || ids.has(item.id)) {
      errors.push({ code: 'reactive_source_id', message: 'source id is invalid.', stepId });
      continue;
    }
    if (item.type !== 'audio.microphone') {
      errors.push({ code: 'reactive_source_type', message: 'source type is unsupported.', stepId });
    }
    ids.add(item.id);
  }
  return ids;
}

function validateReactiveProcessors(
  raw: unknown,
  sourceIds: Set<string>,
  stepId: string,
  errors: PlanValidationIssue[],
): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push({
      code: 'reactive_processors_required',
      message: 'processors must be a non-empty array.',
      stepId,
    });
    return ids;
  }
  const knownIds = new Set(sourceIds);
  for (const item of raw) {
    if (!isRecord(item) || !validNodeId(item.id) || knownIds.has(item.id)) {
      errors.push({ code: 'reactive_processor_id', message: 'processor id is invalid.', stepId });
      continue;
    }
    if (
      item.type !== 'audio.beatTracker' &&
      item.type !== 'audio.onsetDetector' &&
      item.type !== 'audio.moodEstimator'
    ) {
      errors.push({
        code: 'reactive_processor_type',
        message: 'processor type is unsupported.',
        stepId,
      });
    }
    if (!validNodeId(item.input) || !knownIds.has(item.input)) {
      errors.push({
        code: 'reactive_processor_input',
        message: 'processor input is invalid.',
        stepId,
      });
    }
    ids.add(item.id);
    knownIds.add(item.id);
  }
  return ids;
}

function validateReactiveOutputs(
  raw: unknown,
  knownIds: Set<string>,
  stepId: string,
  errors: PlanValidationIssue[],
): Set<string> {
  const outputTypes = new Set<string>();
  const ids = new Set<string>();
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push({
      code: 'reactive_outputs_required',
      message: 'outputs must be a non-empty array.',
      stepId,
    });
    return outputTypes;
  }
  for (const item of raw) {
    if (!isRecord(item) || !validNodeId(item.id) || ids.has(item.id)) {
      errors.push({ code: 'reactive_output_id', message: 'output id is invalid.', stepId });
      continue;
    }
    if (
      item.type !== 'base.motionReactive' &&
      item.type !== 'led.reactivePattern' &&
      item.type !== 'speech.reactiveCue'
    ) {
      errors.push({ code: 'reactive_output_type', message: 'output type is unsupported.', stepId });
    }
    if (!validNodeId(item.input) || !knownIds.has(item.input)) {
      errors.push({ code: 'reactive_output_input', message: 'output input is invalid.', stepId });
    }
    if (item.type === 'base.motionReactive') {
      const outputArgs = isRecord(item.args) ? item.args : {};
      const maxSpeedMps = asNumber(outputArgs.maxSpeedMps ?? 0.2);
      const maxAngularRadps = asNumber(outputArgs.maxAngularRadps ?? 0.349066);
      if (maxSpeedMps === undefined || maxSpeedMps <= 0 || maxSpeedMps > 0.5) {
        errors.push({
          code: 'reactive_output_speed',
          message: 'base.motionReactive maxSpeedMps must be <= 0.5.',
          stepId,
        });
      }
      if (maxAngularRadps === undefined || maxAngularRadps <= 0 || maxAngularRadps > 0.785398) {
        errors.push({
          code: 'reactive_output_angular',
          message: 'base.motionReactive maxAngularRadps must be <= 0.785398.',
          stepId,
        });
      }
    }
    ids.add(item.id);
    if (typeof item.type === 'string') outputTypes.add(item.type);
  }
  return outputTypes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function validNodeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 32 &&
    /^[A-Za-z][A-Za-z0-9_-]*$/.test(value)
  );
}

function isAlwaysAllowedStopTool(toolName: string): boolean {
  return toolName === 'base.stop' || toolName === 'arm.stop';
}

function hasCycle(plan: RobotPlan): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(plan.steps.map((step) => [step.id, step]));

  const visit = (stepId: string): boolean => {
    if (visiting.has(stepId)) return true;
    if (visited.has(stepId)) return false;
    visiting.add(stepId);
    for (const dependency of byId.get(stepId)?.dependsOn ?? []) {
      if (visit(dependency)) return true;
    }
    visiting.delete(stepId);
    visited.add(stepId);
    return false;
  };

  return plan.steps.some((step) => visit(step.id));
}
