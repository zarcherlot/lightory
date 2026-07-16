import type { RobotPlanStep } from '../../robot/types.js';
import type { SceneEntity } from '../domain/types.js';
import type {
  SimulationEvent,
  SimulationInput,
  SimulationPathPoint,
  SimulationPose,
  SimulationRun,
} from './simulationTypes.js';

const MOTION_INCREMENT_METERS = 0.05;

export function simulateRobotPlan(input: SimulationInput): SimulationRun {
  const createId = input.createId ?? defaultCreateId;
  const start = input.scene.entities.find(({ kind }) => kind === 'robot-start');
  const emptyPose = { xMeters: 0, yMeters: 0, headingDegrees: 0 };
  if (!start) {
    return invalidRun(input, createId, emptyPose, 'robot_start_missing', '请先在试验场放置小车起点。');
  }

  const initialPose: SimulationPose = {
    xMeters: start.position.x + start.size.width / 2,
    yMeters: start.position.y + start.size.height / 2,
    headingDegrees: normalizeDegrees(start.rotation),
  };
  const robotRadiusMeters = Math.max(0.15, Math.min(start.size.width, start.size.height) / 2);
  const obstacles = input.scene.entities.filter(({ kind }) => kind === 'obstacle');
  const targets = input.scene.entities.filter(({ kind }) => kind === 'target-landmark');
  const path: SimulationPathPoint[] = [{ ...initialPose }];
  const events: SimulationEvent[] = [];
  let pose = initialPose;
  const batches = createExecutionBatches(input.plan.steps);
  if ('issue' in batches) {
    return invalidRun(input, createId, initialPose, batches.issue.code, batches.issue.message);
  }

  for (const [batchIndex, batch] of batches.entries()) {
    const baseSteps = batch.filter(({ tool }) => tool.startsWith('base.'));
    if (baseSteps.length > 1) {
      return {
        id: createId('simulation'),
        planId: input.plan.planId,
        status: 'blocked',
        initialPose,
        finalPose: pose,
        robotRadiusMeters,
        events,
        path,
        reachedTargetIds: findReachedTargets(pose, robotRadiusMeters, targets),
        issues: [{
          code: 'parallel_base_conflict',
          message: `同一批出现 ${baseSteps.length} 个底盘动作，小车无法同时执行。请检查蓝图中的并行连接。`,
          stepId: baseSteps[0]?.id,
        }],
      };
    }

    for (const step of batch) {
      const result = executeStep({
        step,
        batchIndex,
        parallel: batch.length > 1,
        pose,
        path,
        sceneWidth: input.scene.widthMeters,
        sceneHeight: input.scene.heightMeters,
        robotRadiusMeters,
        obstacles,
        createId,
      });
      if ('issue' in result) {
        return invalidRun(input, createId, initialPose, result.issue.code, result.issue.message, step.id);
      }
      pose = result.pose;
      events.push(result.event);
      if (result.event.status === 'blocked') {
        return {
          id: createId('simulation'),
          planId: input.plan.planId,
          status: 'blocked',
          initialPose,
          finalPose: pose,
          robotRadiusMeters,
          events,
          path,
          reachedTargetIds: findReachedTargets(pose, robotRadiusMeters, targets),
          issues: [{
            code: result.event.collisionEntityId ? 'obstacle_collision' : 'field_boundary',
            message: result.event.detail,
            stepId: step.id,
          }],
        };
      }
    }
  }

  return {
    id: createId('simulation'),
    planId: input.plan.planId,
    status: 'completed',
    initialPose,
    finalPose: pose,
    robotRadiusMeters,
    events,
    path,
    reachedTargetIds: findReachedTargets(pose, robotRadiusMeters, targets),
    issues: [],
  };
}

interface ExecuteContext {
  step: RobotPlanStep;
  batchIndex: number;
  parallel: boolean;
  pose: SimulationPose;
  path: SimulationPathPoint[];
  sceneWidth: number;
  sceneHeight: number;
  robotRadiusMeters: number;
  obstacles: SceneEntity[];
  createId: (prefix: string) => string;
}

function executeStep(context: ExecuteContext):
  | { pose: SimulationPose; event: SimulationEvent }
  | { issue: { code: string; message: string } } {
  const base = {
    id: context.createId('simulation-event'),
    stepId: context.step.id,
    batchIndex: context.batchIndex,
    parallel: context.parallel,
  };
  if (context.step.tool === 'speech.say') {
    const text = typeof context.step.args.text === 'string' ? context.step.args.text.trim() : '';
    if (!text) return { issue: { code: 'speech_text_invalid', message: '语音步骤没有可播报的文字。' } };
    return {
      pose: context.pose,
      event: {
        ...base,
        kind: 'speech',
        status: 'completed',
        title: `小车说：“${text}”`,
        detail: context.parallel ? '与同批动作同时发生。' : '语音播报完成。',
        pose: context.pose,
        pathEndIndex: context.path.length - 1,
        speechText: text,
      },
    };
  }
  if (context.step.tool === 'base.rotateAngle') {
    const angleRad = finiteNumber(context.step.args.angleRad);
    if (angleRad === undefined) return { issue: { code: 'rotate_angle_invalid', message: '转向步骤缺少有效角度。' } };
    const pose = {
      ...context.pose,
      headingDegrees: normalizeDegrees(context.pose.headingDegrees - radiansToDegrees(angleRad)),
    };
    context.path.push({ ...pose, stepId: context.step.id });
    return {
      pose,
      event: {
        ...base,
        kind: 'turn',
        status: 'completed',
        title: `${angleRad >= 0 ? '左转' : '右转'} ${formatNumber(Math.abs(radiansToDegrees(angleRad)))}°`,
        detail: `朝向变为 ${formatNumber(pose.headingDegrees)}°。`,
        pose,
        pathEndIndex: context.path.length - 1,
      },
    };
  }
  if (context.step.tool === 'base.driveDistance') {
    const distanceMeters = finiteNumber(context.step.args.distanceMeters);
    if (distanceMeters === undefined || distanceMeters === 0) {
      return { issue: { code: 'drive_distance_invalid', message: '移动步骤缺少有效距离。' } };
    }
    const increments = Math.max(1, Math.ceil(Math.abs(distanceMeters) / MOTION_INCREMENT_METERS));
    const increment = distanceMeters / increments;
    let pose = context.pose;
    for (let index = 0; index < increments; index += 1) {
      const headingRadians = degreesToRadians(pose.headingDegrees);
      const candidate = {
        ...pose,
        xMeters: pose.xMeters + Math.sin(headingRadians) * increment,
        yMeters: pose.yMeters - Math.cos(headingRadians) * increment,
      };
      const collision = detectCollision(context, candidate);
      if (collision) {
        return {
          pose,
          event: {
            ...base,
            kind: 'move',
            status: 'blocked',
            title: `移动在 ${formatPoint(pose)} 停止`,
            detail: collision.entity
              ? `小车将碰到“${collision.entity.label}”，安全系统已停止实验。`
              : '小车将驶出试验场边界，安全系统已停止实验。',
            pose,
            pathEndIndex: context.path.length - 1,
            ...(collision.entity ? { collisionEntityId: collision.entity.id } : {}),
          },
        };
      }
      pose = candidate;
      context.path.push({ ...pose, stepId: context.step.id });
    }
    return {
      pose,
      event: {
        ...base,
        kind: 'move',
        status: 'completed',
        title: `${distanceMeters > 0 ? '前进' : '后退'} ${formatNumber(Math.abs(distanceMeters))} 米`,
        detail: `到达 ${formatPoint(pose)}。`,
        pose,
        pathEndIndex: context.path.length - 1,
      },
    };
  }
  if (context.step.tool === 'base.stop') {
    return {
      pose: context.pose,
      event: {
        ...base,
        kind: 'stop',
        status: 'completed',
        title: '底盘停止',
        detail: `停在 ${formatPoint(context.pose)}。`,
        pose: context.pose,
        pathEndIndex: context.path.length - 1,
      },
    };
  }
  return {
    issue: {
      code: 'unsupported_simulation_tool',
      message: `当前试验场暂不支持 ${context.step.tool}。`,
    },
  };
}

function createExecutionBatches(steps: RobotPlanStep[]):
  | RobotPlanStep[][]
  | { issue: { code: string; message: string } } {
  const remaining = new Map(steps.map((step) => [step.id, step]));
  const completed = new Set<string>();
  const batches: RobotPlanStep[][] = [];
  while (remaining.size > 0) {
    const batch = steps.filter(
      (step) => remaining.has(step.id) && (step.dependsOn ?? []).every((id) => completed.has(id)),
    );
    if (batch.length === 0) {
      return { issue: { code: 'plan_dependency_invalid', message: 'RobotPlan 的步骤依赖无法执行。' } };
    }
    batches.push(batch);
    for (const step of batch) {
      remaining.delete(step.id);
      completed.add(step.id);
    }
  }
  return batches;
}

function detectCollision(
  context: ExecuteContext,
  pose: SimulationPose,
): { entity?: SceneEntity } | undefined {
  const radius = context.robotRadiusMeters;
  if (
    pose.xMeters - radius < 0 ||
    pose.xMeters + radius > context.sceneWidth ||
    pose.yMeters - radius < 0 ||
    pose.yMeters + radius > context.sceneHeight
  ) {
    return {};
  }
  const entity = context.obstacles.find((obstacle) =>
    circleIntersectsRotatedRectangle(pose, radius, obstacle),
  );
  return entity ? { entity } : undefined;
}

function circleIntersectsRotatedRectangle(
  pose: SimulationPose,
  radius: number,
  entity: SceneEntity,
): boolean {
  const centerX = entity.position.x + entity.size.width / 2;
  const centerY = entity.position.y + entity.size.height / 2;
  const angle = degreesToRadians(-entity.rotation);
  const dx = pose.xMeters - centerX;
  const dy = pose.yMeters - centerY;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  const closestX = clamp(localX, -entity.size.width / 2, entity.size.width / 2);
  const closestY = clamp(localY, -entity.size.height / 2, entity.size.height / 2);
  return Math.hypot(localX - closestX, localY - closestY) <= radius;
}

function findReachedTargets(
  pose: SimulationPose,
  radius: number,
  targets: SceneEntity[],
): string[] {
  return targets
    .filter((target) => circleIntersectsRotatedRectangle(pose, radius, target))
    .map(({ id }) => id)
    .sort();
}

function invalidRun(
  input: SimulationInput,
  createId: (prefix: string) => string,
  pose: SimulationPose,
  code: string,
  message: string,
  stepId?: string,
): SimulationRun {
  return {
    id: createId('simulation'),
    planId: input.plan.planId,
    status: 'invalid',
    initialPose: pose,
    finalPose: pose,
    robotRadiusMeters: 0,
    events: [],
    path: [{ ...pose }],
    reachedTargetIds: [],
    issues: [{ code, message, ...(stepId ? { stepId } : {}) }],
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeDegrees(value: number): number {
  return Number((((value % 360) + 360) % 360).toFixed(6));
}

function degreesToRadians(value: number): number { return (value * Math.PI) / 180; }
function radiansToDegrees(value: number): number { return (value * 180) / Math.PI; }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(value, minimum), maximum); }
function formatNumber(value: number): string { return Number(value.toFixed(2)).toString(); }
function formatPoint(pose: SimulationPose): string { return `(${formatNumber(pose.xMeters)}, ${formatNumber(pose.yMeters)}) 米`; }

function defaultCreateId(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}
