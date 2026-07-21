import {
  buildPoiDeletePlan,
  buildRaceRunLapPlan,
  buildRaceTrackClearPlan,
  buildRaceTrackGetPlan,
  buildRecordCurrentPosePlan,
} from './race/racePlanBuilder.js';
import type { RaceLapOrder, RaceRunLapArgs } from './race/types.js';
import { DEFAULT_RACE_ORDER } from './race/types.js';
import type { RobotPlan, RobotPlanStep, RobotRisk } from './types.js';

interface BuildContext {
  padId: string;
  sessionId: string;
  mapId?: string;
}

const MAX_DRIVE_DISTANCE_PER_STEP_METERS = 2;
const MAX_ROTATE_ANGLE_PER_STEP_RAD = Math.PI * 2 + 0.001;
const MAX_SEQUENCE_ACTIONS = 100;
const DEFAULT_LINEAR_SPEED_MPS = 0.2;
const MAX_LINEAR_SPEED_MPS = 0.5;
const DEFAULT_ANGULAR_SPEED_RADPS = degreesToRadians(20);
const MAX_ANGULAR_SPEED_RADPS = degreesToRadians(45);
const DEFAULT_REACTIVE_DURATION_MS = 30_000;
const MAX_REACTIVE_DURATION_MS = 120_000;
const DEFAULT_REACTIVE_STOP_ON_SILENCE_MS = 5_000;
const DEFAULT_REACTIVE_STARTUP_NO_INPUT_MS = 5_000;
const ALLOWED_REACTIVE_SOURCE_TYPES = new Set(['audio.microphone']);
const ALLOWED_REACTIVE_PROCESSOR_TYPES = new Set([
  'audio.beatTracker',
  'audio.onsetDetector',
  'audio.moodEstimator',
]);
const ALLOWED_REACTIVE_OUTPUT_TYPES = new Set([
  'base.motionReactive',
  'led.reactivePattern',
  'speech.reactiveCue',
]);

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36) || 'plan';

function createPlan(
  ctx: BuildContext,
  kind: string,
  intent: string,
  risk: RobotRisk,
  requiresUserConfirmation: boolean,
  steps: RobotPlanStep[],
  maxDurationMs: number,
  assumptions: string[],
): RobotPlan {
  const createdAt = new Date().toISOString();
  return {
    schemaVersion: 'robot-plan/v1',
    planId: `${kind}_${slugify(intent)}_${Date.now().toString(36)}`,
    createdAt,
    createdBy: {
      padId: ctx.padId,
      sessionId: ctx.sessionId,
      agentRunId: `agent_${Date.now().toString(36)}`,
    },
    intent,
    risk,
    requiresUserConfirmation,
    assumptions,
    steps,
    constraints: {
      maxDurationMs,
      maxSteps: Math.max(steps.length, 1),
      allowedTools: [...new Set(steps.map((step) => step.tool))],
    },
  };
}

export function buildRememberPoiPlan(ctx: BuildContext, poiName: string): RobotPlan {
  return createPlan(
    ctx,
    'plan_memory',
    `用户声明这里是${poiName}`,
    'medium',
    false,
    [
      { id: 's1', tool: 'base.state', args: {} },
      {
        id: 's2',
        tool: 'memory.upsertPoi',
        dependsOn: ['s1'],
        args: {
          poi: {
            name: poiName,
            aliases: [poiName],
            type: 'room',
            source: 'user',
            confidence: 0.8,
          },
        },
      },
    ],
    3000,
    ['当前位置来自机器人当前定位'],
  );
}

export function buildMoveToPoiPlan(ctx: BuildContext, poiName: string): RobotPlan {
  return createPlan(
    ctx,
    'plan_move',
    `移动到${poiName}`,
    'high',
    true,
    [
      { id: 's1', tool: 'speech.say', args: { text: `我准备移动到${poiName}。` } },
      { id: 's2', tool: 'memory.getPoi', args: { name: poiName } },
      { id: 's3', tool: 'watchdog.acquire', args: { resource: 'base', ttlMs: 1500 } },
      {
        id: 's4',
        tool: 'base.followPath',
        dependsOn: ['s2', 's3'],
        args: { targetPoi: poiName, maxSpeedMps: 0.15 },
        timeoutMs: 30000,
        safety: {
          requiresLease: 'base',
          stopOnObstacle: true,
          maxSpeedMps: 0.15,
        },
      },
      { id: 's5', tool: 'watchdog.release', dependsOn: ['s4'], args: { resource: 'base' } },
      { id: 's6', tool: 'led.setMode', dependsOn: ['s5'], args: { mode: 'idle' } },
    ],
    30000,
    [`${poiName} POI 已存在`, '机器人定位可用'],
  );
}

export function buildSpeechPlan(ctx: BuildContext, text: string): RobotPlan {
  return createPlan(
    ctx,
    'plan_speech',
    `语音播报：${text}`,
    'low',
    false,
    [{ id: 's1', tool: 'speech.say', args: { text } }],
    5000,
    [],
  );
}

export function buildLedPlan(ctx: BuildContext, mode: string): RobotPlan {
  return createPlan(
    ctx,
    'plan_led',
    `设置 LED：${mode}`,
    'low',
    false,
    [{ id: 's1', tool: 'led.setMode', args: { mode } }],
    2000,
    [],
  );
}

export function buildDriveDistancePlan(
  ctx: BuildContext,
  distanceMeters: number,
  maxSpeedMps = DEFAULT_LINEAR_SPEED_MPS,
): RobotPlan {
  const direction = distanceMeters >= 0 ? '前进' : '后退';
  const absDistance = Math.abs(distanceMeters);
  const speed = normalizeLinearSpeed(maxSpeedMps);
  return createPlan(
    ctx,
    'plan_drive_distance',
    `${direction}${absDistance}米`,
    'high',
    true,
    [
      {
        id: 's1',
        tool: 'base.driveDistance',
        args: { distanceMeters, maxSpeedMps: speed },
        timeoutMs: 15000,
        safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: speed },
      },
      { id: 's2', tool: 'base.stop', dependsOn: ['s1'], args: {} },
    ],
    16000,
    ['小车已架空或处于安全测试环境', '移动距离由机器人里程计估算'],
  );
}

export function buildRotateAnglePlan(
  ctx: BuildContext,
  angleRad: number,
  maxAngularRadps = DEFAULT_ANGULAR_SPEED_RADPS,
): RobotPlan {
  const angularSpeed = normalizeAngularSpeed(maxAngularRadps);
  return createPlan(
    ctx,
    'plan_rotate_angle',
    `旋转${formatTurns(angleRad)}`,
    'high',
    true,
    [
      {
        id: 's1',
        tool: 'base.rotateAngle',
        args: { angleRad, maxAngularRadps: angularSpeed },
        timeoutMs: 15000,
        safety: { requiresLease: 'base', stopOnObstacle: true },
      },
      { id: 's2', tool: 'base.stop', dependsOn: ['s1'], args: {} },
    ],
    16000,
    ['小车已架空或处于安全测试环境', '旋转角度由机器人里程计估算'],
  );
}

export function buildVelocityProfilePlan(
  ctx: BuildContext,
  intent: string,
  segments: Array<{ linearX: number; angularZ: number; durationMs: number }>,
): RobotPlan {
  return createPlan(
    ctx,
    'plan_velocity_profile',
    intent,
    'high',
    true,
    [
      {
        id: 's1',
        tool: 'base.velocityProfile',
        args: { segments },
        timeoutMs: 20000,
        safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: MAX_LINEAR_SPEED_MPS },
      },
      { id: 's2', tool: 'base.stop', dependsOn: ['s1'], args: {} },
    ],
    21000,
    ['小车已架空或处于安全测试环境', '速度曲线由小车侧 watchdog 限时执行'],
  );
}

export function buildSequencePlan(
  ctx: BuildContext,
  intent: string,
  actions: RobotSequenceAction[],
): RobotPlan {
  const steps: RobotPlanStep[] = [];
  for (const [index, action] of actions.entries()) {
    const actionStepId = `s${steps.length + 1}`;
    const dependsOn = steps.length > 0 ? [steps[steps.length - 1].id] : undefined;
    if (action.type === 'driveDistance') {
      const speed = normalizeLinearSpeed(action.maxSpeedMps);
      steps.push({
        id: actionStepId,
        tool: 'base.driveDistance',
        ...(dependsOn ? { dependsOn } : {}),
        args: { distanceMeters: action.distanceMeters, maxSpeedMps: speed },
        timeoutMs: 15000,
        safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: speed },
      });
    } else if (action.type === 'rotateAngle') {
      const angularSpeed = normalizeAngularSpeed(action.maxAngularRadps);
      steps.push({
        id: actionStepId,
        tool: 'base.rotateAngle',
        ...(dependsOn ? { dependsOn } : {}),
        args: { angleRad: action.angleRad, maxAngularRadps: angularSpeed },
        timeoutMs: 15000,
        safety: { requiresLease: 'base', stopOnObstacle: true },
      });
    } else {
      steps.push({
        id: actionStepId,
        tool: 'base.velocityProfile',
        ...(dependsOn ? { dependsOn } : {}),
        args: { segments: action.segments },
        timeoutMs: 20000,
        safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: MAX_LINEAR_SPEED_MPS },
      });
    }

    steps.push({
      id: `s${steps.length + 1}`,
      tool: 'base.stop',
      dependsOn: [actionStepId],
      args: {},
    });

    if (index >= actions.length - 1) break;
  }

  return createPlan(
    ctx,
    'plan_sequence',
    intent,
    'high',
    true,
    steps,
    Math.max(actions.length, 1) * 21000,
    ['小车已架空或处于安全测试环境', '序列动作按依赖顺序执行，每个动作后显式停止'],
  );
}

export function buildReactivePlan(
  ctx: BuildContext,
  intent: string,
  graph: ReactiveGraph,
): RobotPlan {
  const durationMs = normalizeReactiveDuration(graph.durationMs);
  return createPlan(
    ctx,
    'plan_reactive',
    intent,
    graph.outputs.some((output) => output.type === 'base.motionReactive') ? 'high' : 'medium',
    graph.outputs.some((output) => output.type === 'base.motionReactive'),
    [
      {
        id: 's1',
        tool: 'reactive.run',
        args: { ...graph, durationMs },
        timeoutMs: durationMs + 1000,
        safety: graph.outputs.some((output) => output.type === 'base.motionReactive')
          ? {
              requiresLease: 'base',
              stopOnObstacle: true,
              maxSpeedMps: normalizeLinearSpeed(graph.safety?.maxSpeedMps),
            }
          : undefined,
      },
      { id: 's2', tool: 'base.stop', dependsOn: ['s1'], args: {} },
    ],
    durationMs + 2000,
    ['实时音频分析和输出控制在小车侧执行', 'LLM 只生成受限 reactive graph 配置'],
  );
}

export type RobotSequenceAction =
  | { type: 'driveDistance'; distanceMeters: number; maxSpeedMps?: number }
  | { type: 'rotateAngle'; angleRad: number; maxAngularRadps?: number }
  | {
      type: 'velocityProfile';
      intent: string;
      segments: Array<{ linearX: number; angularZ: number; durationMs: number }>;
    };

export interface ReactiveGraph {
  durationMs: number;
  sources: ReactiveSourceNode[];
  processors: ReactiveProcessorNode[];
  outputs: ReactiveOutputNode[];
  safety?: ReactiveSafety;
}

export interface ReactiveSourceNode {
  id: string;
  type: 'audio.microphone';
  args: Record<string, unknown>;
}

export interface ReactiveProcessorNode {
  id: string;
  type: 'audio.beatTracker' | 'audio.onsetDetector' | 'audio.moodEstimator';
  input: string;
  args: Record<string, unknown>;
}

export interface ReactiveOutputNode {
  id: string;
  type: 'base.motionReactive' | 'led.reactivePattern' | 'speech.reactiveCue';
  input: string;
  args: Record<string, unknown>;
}

export interface ReactiveSafety {
  requiresLease?: Array<'base' | 'arm'>;
  stopOnObstacle?: boolean;
  stopOnSilenceMs?: number;
  startupNoInputMs?: number;
  maxSpeedMps?: number;
  maxAngularRadps?: number;
}

export type RobotIntent =
  | { type: 'rememberPoi'; poiName: string }
  | { type: 'moveToPoi'; poiName: string }
  | { type: 'speech'; text: string }
  | { type: 'led'; mode: string }
  | { type: 'driveDistance'; distanceMeters: number; maxSpeedMps?: number }
  | { type: 'rotateAngle'; angleRad: number; maxAngularRadps?: number }
  | {
      type: 'velocityProfile';
      intent: string;
      segments: Array<{ linearX: number; angularZ: number; durationMs: number }>;
    }
  | { type: 'sequence'; intent: string; actions: RobotSequenceAction[] }
  | { type: 'reactive'; intent: string; graph: ReactiveGraph }
  | {
      type: 'raceLap';
      trackId: string;
      order?: RaceLapOrder;
      strategy?: RaceRunLapArgs['strategy'];
      safety?: RaceRunLapArgs['safety'];
    }
  | { type: 'raceRecordPoint'; name: string }
  | { type: 'raceTrackGet'; trackId: string }
  | { type: 'raceTrackClear'; trackId: string }
  | { type: 'raceDeletePoint'; name: string };

export type RobotIntentPlannerOutcome =
  | { type: 'planned'; intent: RobotIntent; confirmationMessage?: string }
  | { type: 'unsupported'; reason: string }
  | { type: 'error'; message: string };

export function normalizeRobotIntent(raw: unknown): RobotIntentPlannerOutcome {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { type: 'error', message: 'Planner returned an invalid intent object.' };
  }
  const intent = raw as Record<string, unknown>;
  if (intent.type === 'unsupported') {
    return {
      type: 'unsupported',
      reason:
        typeof intent.reason === 'string' && intent.reason.trim()
          ? intent.reason.trim()
          : '无法安全映射为机器人动作',
    };
  }
  if (intent.type === 'driveDistance') {
    const distanceMeters = intent.distanceMeters;
    if (!isFiniteNumber(distanceMeters) || distanceMeters === 0) {
      return { type: 'error', message: 'driveDistance requires a non-zero distanceMeters.' };
    }
    const speed = normalizeLinearSpeed(intent.maxSpeedMps);
    const chunks = splitDistanceIntoSafeActions(distanceMeters, speed);
    if (chunks.length > 1) {
      return plannedOutcome(
        {
          type: 'sequence',
          intent: `${distanceMeters > 0 ? '前进' : '后退'}${Math.abs(distanceMeters)}米`,
          actions: chunks,
        },
        intent,
      );
    }
    return { type: 'planned', intent: { type: 'driveDistance', distanceMeters, maxSpeedMps: speed } };
  }
  if (intent.type === 'rotateAngle') {
    const angleRad = intent.angleRad;
    if (!isFiniteNumber(angleRad) || angleRad === 0) {
      return { type: 'error', message: 'rotateAngle requires a non-zero angleRad.' };
    }
    const angularSpeed = normalizeAngularSpeed(intent.maxAngularRadps);
    const chunks = splitAngleIntoSafeActions(angleRad, angularSpeed);
    if (chunks.length > 1) {
      return plannedOutcome(
        { type: 'sequence', intent: `旋转${formatTurns(angleRad)}`, actions: chunks },
        intent,
      );
    }
    return plannedOutcome({ type: 'rotateAngle', angleRad, maxAngularRadps: angularSpeed }, intent);
  }
  if (intent.type === 'speech') {
    return typeof intent.text === 'string' && intent.text.trim()
      ? { type: 'planned', intent: { type: 'speech', text: intent.text.trim() } }
      : { type: 'error', message: 'speech requires text.' };
  }
  if (intent.type === 'led') {
    return typeof intent.mode === 'string' && intent.mode.trim()
      ? { type: 'planned', intent: { type: 'led', mode: intent.mode.trim() } }
      : { type: 'error', message: 'led requires mode.' };
  }
  if (intent.type === 'rememberPoi') {
    return typeof intent.poiName === 'string' && intent.poiName.trim()
      ? { type: 'planned', intent: { type: 'rememberPoi', poiName: intent.poiName.trim() } }
      : { type: 'error', message: 'rememberPoi requires poiName.' };
  }
  if (intent.type === 'raceRecordPoint') {
    const name = normalizeRacePointName(intent.name);
    return name
      ? { type: 'planned', intent: { type: 'raceRecordPoint', name } }
      : { type: 'error', message: 'raceRecordPoint name must be A, B, C, or D.' };
  }
  if (intent.type === 'moveToPoi') {
    return typeof intent.poiName === 'string' && intent.poiName.trim()
      ? { type: 'planned', intent: { type: 'moveToPoi', poiName: intent.poiName.trim() } }
      : { type: 'error', message: 'moveToPoi requires poiName.' };
  }
  if (intent.type === 'velocityProfile') {
    const action = normalizeVelocityProfileAction(intent);
    return action.type === 'ok'
      ? plannedOutcome(action.action, intent)
      : { type: 'error', message: action.message };
  }
  if (intent.type === 'sequence') {
    if (typeof intent.intent !== 'string' || !intent.intent.trim()) {
      return { type: 'error', message: 'sequence requires intent.' };
    }
    if (!Array.isArray(intent.actions) || intent.actions.length === 0) {
      return { type: 'error', message: 'sequence requires actions.' };
    }
    if (intent.actions.length > MAX_SEQUENCE_ACTIONS) {
      return { type: 'error', message: `sequence cannot exceed ${MAX_SEQUENCE_ACTIONS} actions.` };
    }
    const actions: RobotSequenceAction[] = [];
    for (const rawAction of intent.actions) {
      const action = normalizeSequenceAction(rawAction);
      if (action.type === 'error') return { type: 'error', message: action.message };
      actions.push(...action.actions);
      if (actions.length > MAX_SEQUENCE_ACTIONS) {
        return {
          type: 'error',
          message: `sequence expands beyond ${MAX_SEQUENCE_ACTIONS} safe actions.`,
        };
      }
    }
    if (!actions.some((action) => isBaseMotionAction(action))) {
      return { type: 'error', message: 'sequence requires at least one base motion action.' };
    }
    return plannedOutcome({ type: 'sequence', intent: intent.intent.trim(), actions }, intent);
  }
  if (intent.type === 'reactive') {
    if (typeof intent.intent !== 'string' || !intent.intent.trim()) {
      return { type: 'error', message: 'reactive requires intent.' };
    }
    const graph = normalizeReactiveGraph(intent.graph);
    return graph.type === 'ok'
      ? plannedOutcome({ type: 'reactive', intent: intent.intent.trim(), graph: graph.graph }, intent)
      : { type: 'error', message: graph.message };
  }
  if (intent.type === 'raceLap') {
    const trackId = typeof intent.trackId === 'string' && intent.trackId.trim()
      ? intent.trackId.trim()
      : 'default-abcd';
    const order = normalizeRaceOrder(intent.order);
    if (!order) return { type: 'error', message: 'raceLap order must be A-B-C-D-A style.' };
    return plannedOutcome(
      {
        type: 'raceLap',
        trackId,
        order,
        strategy: normalizeRaceStrategy(intent.strategy),
        safety: normalizeRaceSafety(intent.safety),
      },
      intent,
    );
  }
  return { type: 'error', message: 'Planner returned an unsupported intent type.' };
}

export function parseRobotIntent(input: string): RobotIntent | null {
  const text = input.trim();
  const normalized = text.replace(/\s+/gu, '');

  if (/八字|8字/u.test(normalized)) {
    return {
      type: 'velocityProfile',
      intent: '画八字',
      segments: [
        { linearX: 0.15, angularZ: 0.7, durationMs: 4500 },
        { linearX: 0.15, angularZ: -0.7, durationMs: 4500 },
      ],
    };
  }

  if (
    /(?:四点|竞速|计时赛|default-abcd|abcd)/iu.test(normalized) &&
    /(?:跑一圈|跑一次|试跑|发起|执行|开始|run|lap)/iu.test(normalized)
  ) {
    return {
      type: 'raceLap',
      trackId: 'default-abcd',
      order: DEFAULT_RACE_ORDER,
      strategy: { maxSpeedMps: /快|fast/iu.test(normalized) ? 0.2 : 0.12 },
      safety: { maxDurationMs: 45_000 },
    };
  }

  const backwardDuration = normalized.match(/(?:后退|倒车).*?([0-9]+(?:\.[0-9]+)?)(?:s|秒)/u);
  if (backwardDuration?.[1]) {
    const durationMs = Math.round(Number(backwardDuration[1]) * 1000);
    if (Number.isFinite(durationMs) && durationMs > 0) {
      return {
        type: 'velocityProfile',
        intent: `加速后退${backwardDuration[1]}秒`,
        segments: buildBackwardRampSegments(durationMs),
      };
    }
  }

  const driveDistance = normalized.match(/(?:前进|向前|往前|后退|倒车)([0-9]+(?:\.[0-9]+)?)(?:m|米)/u);
  if (driveDistance?.[1]) {
    const distance = Number(driveDistance[1]);
    if (Number.isFinite(distance)) {
      const sign = /后退|倒车/u.test(normalized) ? -1 : 1;
      return { type: 'driveDistance', distanceMeters: sign * distance };
    }
  }

  const fullTurns = normalized.match(/(?:旋转|转)([0-9]+(?:\.[0-9]+)?)?圈/u);
  if (fullTurns) {
    const turns = fullTurns[1] ? Number(fullTurns[1]) : 1;
    if (Number.isFinite(turns)) return { type: 'rotateAngle', angleRad: turns * Math.PI * 2 };
  }

  const degrees = normalized.match(/(?:旋转|转)(-?[0-9]+(?:\.[0-9]+)?)(?:度|°)/u);
  if (degrees?.[1]) {
    const angle = (Number(degrees[1]) * Math.PI) / 180;
    if (Number.isFinite(angle)) return { type: 'rotateAngle', angleRad: angle };
  }

  const remember = text.match(/^这里是(.+)$/u) ?? text.match(/^这是(.+)$/u);
  if (remember?.[1]) {
    const racePoint = normalizeRacePointName(remember[1]);
    if (racePoint) return { type: 'raceRecordPoint', name: racePoint };
  }
  if (remember?.[1]) return { type: 'rememberPoi', poiName: remember[1].trim() };

  const currentRacePoint =
    normalized.match(/(?:现在(?:就是)?在|当前在|到|到了|记录|记住)([abcd])点?/iu) ??
    normalized.match(/([abcd])点(?:到了|可以记住|记住|记录)/iu);
  if (currentRacePoint?.[1]) {
    const racePoint = normalizeRacePointName(currentRacePoint[1]);
    if (racePoint) return { type: 'raceRecordPoint', name: racePoint };
  }

  const move = text.match(/^去(.+)$/u) ?? text.match(/^移动到(.+)$/u) ?? text.match(/^前往(.+)$/u);
  if (move?.[1]) return { type: 'moveToPoi', poiName: move[1].trim() };

  const speech = text.match(/^说(.+)$/u) ?? text.match(/^播报(.+)$/u);
  if (speech?.[1]) return { type: 'speech', text: speech[1].trim() };

  const led = text.match(/^led[:： ](.+)$/iu) ?? text.match(/^灯光[:： ](.+)$/u);
  if (led?.[1]) return { type: 'led', mode: led[1].trim() };

  return null;
}

export function buildPlanForIntent(ctx: BuildContext, intent: RobotIntent): RobotPlan {
  if (intent.type === 'rememberPoi') return buildRememberPoiPlan(ctx, intent.poiName);
  if (intent.type === 'moveToPoi') return buildMoveToPoiPlan(ctx, intent.poiName);
  if (intent.type === 'speech') return buildSpeechPlan(ctx, intent.text);
  if (intent.type === 'led') return buildLedPlan(ctx, intent.mode);
  if (intent.type === 'driveDistance') {
    return buildDriveDistancePlan(ctx, intent.distanceMeters, intent.maxSpeedMps);
  }
  if (intent.type === 'rotateAngle') {
    return buildRotateAnglePlan(ctx, intent.angleRad, intent.maxAngularRadps);
  }
  if (intent.type === 'sequence') return buildSequencePlan(ctx, intent.intent, intent.actions);
  if (intent.type === 'reactive') return buildReactivePlan(ctx, intent.intent, intent.graph);
  if (intent.type === 'raceRecordPoint') return buildRecordCurrentPosePlan(ctx, intent.name);
  if (intent.type === 'raceTrackGet') return buildRaceTrackGetPlan(ctx, intent);
  if (intent.type === 'raceTrackClear') return buildRaceTrackClearPlan(ctx, intent);
  if (intent.type === 'raceDeletePoint') return buildPoiDeletePlan(ctx, intent.name);
  if (intent.type === 'raceLap') {
    return buildRaceRunLapPlan(ctx, {
      trackId: intent.trackId,
      ...(ctx.mapId?.trim() ? { mapId: ctx.mapId.trim() } : {}),
      order: intent.order ?? DEFAULT_RACE_ORDER,
      strategy: intent.strategy,
      safety: intent.safety,
    });
  }
  return buildVelocityProfilePlan(ctx, intent.intent, intent.segments);
}

function normalizeRaceOrder(raw: unknown): RaceLapOrder | null {
  if (raw === undefined) return DEFAULT_RACE_ORDER;
  if (!Array.isArray(raw) || raw.length !== 5) return null;
  const values = raw.map((item) => String(item).toUpperCase());
  return values.every((item) => item === 'A' || item === 'B' || item === 'C' || item === 'D') &&
    values[0] === values[4]
    ? (values as RaceLapOrder)
    : null;
}

function normalizeRacePointName(raw: unknown): 'A' | 'B' | 'C' | 'D' | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().replace(/点$/u, '').toUpperCase();
  return normalized === 'A' || normalized === 'B' || normalized === 'C' || normalized === 'D'
    ? normalized
    : null;
}

function normalizeRaceStrategy(raw: unknown): RaceRunLapArgs['strategy'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { maxSpeedMps: 0.12 };
  const strategy = raw as Record<string, unknown>;
  return {
    ...(typeof strategy.name === 'string' && strategy.name.trim()
      ? { name: strategy.name.trim() }
      : {}),
    ...(isFiniteNumber(strategy.maxSpeedMps)
      ? { maxSpeedMps: Math.min(Math.max(strategy.maxSpeedMps, 0.05), 0.5) }
      : { maxSpeedMps: 0.12 }),
    ...(isFiniteNumber(strategy.minTurnSpeedMps)
      ? { minTurnSpeedMps: Math.min(Math.max(strategy.minTurnSpeedMps, 0.03), 0.5) }
      : {}),
    ...(isFiniteNumber(strategy.lookaheadMeters)
      ? { lookaheadMeters: Math.min(Math.max(strategy.lookaheadMeters, 0.05), 1) }
      : {}),
    ...(isFiniteNumber(strategy.waypointRadiusMeters)
      ? { waypointRadiusMeters: Math.min(Math.max(strategy.waypointRadiusMeters, 0.05), 1) }
      : {}),
    ...(isFiniteNumber(strategy.finishRadiusMeters)
      ? { finishRadiusMeters: Math.min(Math.max(strategy.finishRadiusMeters, 0.05), 1) }
      : {}),
    ...(isFiniteNumber(strategy.waypointToleranceM)
      ? { waypointToleranceM: Math.min(Math.max(strategy.waypointToleranceM, 0.03), 1) }
      : {}),
    ...(isFiniteNumber(strategy.headingKp)
      ? { headingKp: Math.min(Math.max(strategy.headingKp, 0.1), 4) }
      : {}),
    ...(isFiniteNumber(strategy.maxAngularRadps)
      ? { maxAngularRadps: Math.min(Math.max(strategy.maxAngularRadps, 0.1), 0.785398) }
      : {}),
  };
}

function normalizeRaceSafety(raw: unknown): RaceRunLapArgs['safety'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { frontStopDistanceMeters: 0.15, maxDurationMs: 45_000 };
  }
  const safety = raw as Record<string, unknown>;
  const frontStopDistanceMeters = isFiniteNumber(safety.frontStopDistanceMeters)
    ? safety.frontStopDistanceMeters
    : isFiniteNumber(safety.frontStopMeters)
    ? safety.frontStopMeters
      : 0.15;
  return {
    frontStopDistanceMeters: Math.min(Math.max(frontStopDistanceMeters, 0.15), 2),
    maxDurationMs: isFiniteNumber(safety.maxDurationMs)
      ? Math.min(Math.max(Math.round(safety.maxDurationMs), 5_000), 120_000)
      : 45_000,
  };
}

function buildBackwardRampSegments(
  durationMs: number,
): Array<{ linearX: number; angularZ: number; durationMs: number }> {
  const clamped = Math.min(Math.max(durationMs, 250), 2000);
  const count = Math.min(4, Math.max(1, Math.ceil(clamped / 250)));
  const segmentMs = Math.floor(clamped / count);
  return Array.from({ length: count }, (_, index) => ({
    linearX: -0.05 * (index + 1),
    angularZ: 0,
    durationMs: index === count - 1 ? clamped - segmentMs * (count - 1) : segmentMs,
  }));
}

function normalizeSequenceAction(
  raw: unknown,
): { type: 'ok'; actions: RobotSequenceAction[] } | { type: 'error'; message: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { type: 'error', message: 'sequence contains an invalid action.' };
  }
  const action = raw as Record<string, unknown>;
  if (action.type === 'driveDistance') {
    if (!isFiniteNumber(action.distanceMeters) || action.distanceMeters === 0) {
      return { type: 'error', message: 'driveDistance action requires non-zero distanceMeters.' };
    }
    return {
      type: 'ok',
      actions: splitDistanceIntoSafeActions(
        action.distanceMeters,
        normalizeLinearSpeed(action.maxSpeedMps),
      ),
    };
  }
  if (action.type === 'rotateAngle') {
    if (!isFiniteNumber(action.angleRad) || action.angleRad === 0) {
      return { type: 'error', message: 'rotateAngle action requires non-zero angleRad.' };
    }
    return {
      type: 'ok',
      actions: splitAngleIntoSafeActions(
        action.angleRad,
        normalizeAngularSpeed(action.maxAngularRadps),
      ),
    };
  }
  if (action.type === 'velocityProfile') {
    const normalized = normalizeVelocityProfileAction(action);
    return normalized.type === 'ok'
      ? { type: 'ok', actions: [normalized.action] }
      : { type: 'error', message: normalized.message };
  }
  return { type: 'error', message: 'sequence contains an unsupported action type.' };
}

function normalizeVelocityProfileAction(
  intent: Record<string, unknown>,
): { type: 'ok'; action: Extract<RobotSequenceAction, { type: 'velocityProfile' }> } | {
  type: 'error';
  message: string;
} {
  if (typeof intent.intent !== 'string' || !intent.intent.trim()) {
    return { type: 'error', message: 'velocityProfile requires intent.' };
  }
  if (!Array.isArray(intent.segments) || intent.segments.length === 0) {
    return { type: 'error', message: 'velocityProfile requires segments.' };
  }
  const segments: Array<{ linearX: number; angularZ: number; durationMs: number }> = [];
  let totalMs = 0;
  for (const segment of intent.segments) {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
      return { type: 'error', message: 'velocityProfile contains an invalid segment.' };
    }
    const item = segment as Record<string, unknown>;
    if (!isBoundedNumber(item.linearX, MAX_LINEAR_SPEED_MPS)) {
      return { type: 'error', message: 'velocityProfile linearX is outside +/-0.5m/s.' };
    }
    if (!isBoundedNumber(item.angularZ, MAX_ANGULAR_SPEED_RADPS)) {
      return { type: 'error', message: 'velocityProfile angularZ is outside +/-45deg/s.' };
    }
    if (!isPositiveNumber(item.durationMs)) {
      return { type: 'error', message: 'velocityProfile durationMs must be positive.' };
    }
    totalMs += item.durationMs;
    segments.push({
      linearX: item.linearX,
      angularZ: item.angularZ,
      durationMs: Math.round(item.durationMs),
    });
  }
  if (totalMs > 20_000) {
    return { type: 'error', message: 'velocityProfile duration exceeds 20000ms.' };
  }
  return {
    type: 'ok',
    action: { type: 'velocityProfile', intent: intent.intent.trim(), segments },
  };
}

function normalizeReactiveGraph(
  raw: unknown,
): { type: 'ok'; graph: ReactiveGraph } | { type: 'error'; message: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { type: 'error', message: 'reactive graph must be an object.' };
  }
  const graph = raw as Record<string, unknown>;
  const durationMs = normalizeReactiveDuration(graph.durationMs);
  const sources = normalizeReactiveSources(graph.sources);
  if (sources.type === 'error') return sources;
  const processors = normalizeReactiveProcessors(graph.processors, sources.nodes);
  if (processors.type === 'error') return processors;
  const outputs = normalizeReactiveOutputs(graph.outputs, sources.nodes, processors.nodes);
  if (outputs.type === 'error') return outputs;
  const safety = normalizeReactiveSafety(graph.safety);
  if (safety.type === 'error') return safety;
  if (outputs.nodes.some((output) => output.type === 'base.motionReactive')) {
    safety.safety.requiresLease = ['base'];
    safety.safety.stopOnObstacle = safety.safety.stopOnObstacle ?? true;
  }
  return {
    type: 'ok',
    graph: {
      durationMs,
      sources: sources.nodes,
      processors: processors.nodes,
      outputs: outputs.nodes,
      safety: safety.safety,
    },
  };
}

function normalizeReactiveSources(
  raw: unknown,
): { type: 'ok'; nodes: ReactiveSourceNode[] } | { type: 'error'; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { type: 'error', message: 'reactive graph requires sources.' };
  }
  const nodes: ReactiveSourceNode[] = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { type: 'error', message: 'reactive source must be an object.' };
    }
    const node = item as Record<string, unknown>;
    const id = normalizeNodeId(node.id);
    if (!id || ids.has(id)) return { type: 'error', message: 'reactive source id is invalid.' };
    if (typeof node.type !== 'string' || !ALLOWED_REACTIVE_SOURCE_TYPES.has(node.type)) {
      return { type: 'error', message: 'reactive source type is unsupported.' };
    }
    ids.add(id);
    nodes.push({ id, type: 'audio.microphone', args: normalizeArgs(node.args) });
  }
  return { type: 'ok', nodes };
}

function normalizeReactiveProcessors(
  raw: unknown,
  sources: ReactiveSourceNode[],
): { type: 'ok'; nodes: ReactiveProcessorNode[] } | { type: 'error'; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { type: 'error', message: 'reactive graph requires processors.' };
  }
  const knownIds = new Set(sources.map((source) => source.id));
  const nodes: ReactiveProcessorNode[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { type: 'error', message: 'reactive processor must be an object.' };
    }
    const node = item as Record<string, unknown>;
    const id = normalizeNodeId(node.id);
    const input = normalizeNodeId(node.input);
    if (!id || knownIds.has(id)) return { type: 'error', message: 'reactive processor id is invalid.' };
    if (!input || !knownIds.has(input)) {
      return { type: 'error', message: 'reactive processor input is invalid.' };
    }
    if (typeof node.type !== 'string' || !ALLOWED_REACTIVE_PROCESSOR_TYPES.has(node.type)) {
      return { type: 'error', message: 'reactive processor type is unsupported.' };
    }
    knownIds.add(id);
    nodes.push({
      id,
      type: node.type as ReactiveProcessorNode['type'],
      input,
      args: normalizeArgs(node.args),
    });
  }
  return { type: 'ok', nodes };
}

function normalizeReactiveOutputs(
  raw: unknown,
  sources: ReactiveSourceNode[],
  processors: ReactiveProcessorNode[],
): { type: 'ok'; nodes: ReactiveOutputNode[] } | { type: 'error'; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { type: 'error', message: 'reactive graph requires outputs.' };
  }
  const knownIds = new Set([
    ...sources.map((source) => source.id),
    ...processors.map((processor) => processor.id),
  ]);
  const outputIds = new Set<string>();
  const nodes: ReactiveOutputNode[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { type: 'error', message: 'reactive output must be an object.' };
    }
    const node = item as Record<string, unknown>;
    const id = normalizeNodeId(node.id);
    const input = normalizeNodeId(node.input);
    if (!id || outputIds.has(id)) return { type: 'error', message: 'reactive output id is invalid.' };
    if (!input || !knownIds.has(input)) {
      return { type: 'error', message: 'reactive output input is invalid.' };
    }
    if (typeof node.type !== 'string' || !ALLOWED_REACTIVE_OUTPUT_TYPES.has(node.type)) {
      return { type: 'error', message: 'reactive output type is unsupported.' };
    }
    const args = normalizeArgs(node.args);
    if (node.type === 'base.motionReactive') {
      args.maxSpeedMps = normalizeLinearSpeed(args.maxSpeedMps);
      args.maxAngularRadps = normalizeAngularSpeed(args.maxAngularRadps);
      args.style = typeof args.style === 'string' && args.style.trim() ? args.style.trim() : 'dance';
    }
    outputIds.add(id);
    nodes.push({ id, type: node.type as ReactiveOutputNode['type'], input, args });
  }
  return { type: 'ok', nodes };
}

function normalizeReactiveSafety(
  raw: unknown,
): { type: 'ok'; safety: ReactiveSafety } | { type: 'error'; message: string } {
  if (raw !== undefined && (!raw || typeof raw !== 'object' || Array.isArray(raw))) {
    return { type: 'error', message: 'reactive safety must be an object.' };
  }
  const safety = (raw ?? {}) as Record<string, unknown>;
  return {
    type: 'ok',
    safety: {
      requiresLease: Array.isArray(safety.requiresLease)
        ? safety.requiresLease.filter(
            (resource): resource is 'base' | 'arm' => resource === 'base' || resource === 'arm',
          )
        : undefined,
      stopOnObstacle: typeof safety.stopOnObstacle === 'boolean' ? safety.stopOnObstacle : undefined,
      stopOnSilenceMs: normalizeStopOnSilenceMs(safety.stopOnSilenceMs),
      startupNoInputMs: normalizeStartupNoInputMs(safety.startupNoInputMs),
      maxSpeedMps: normalizeLinearSpeed(safety.maxSpeedMps),
      maxAngularRadps: normalizeAngularSpeed(safety.maxAngularRadps),
    },
  };
}

function splitDistanceIntoSafeActions(
  distanceMeters: number,
  maxSpeedMps: number,
): RobotSequenceAction[] {
  const sign = Math.sign(distanceMeters);
  let remaining = Math.abs(distanceMeters);
  const actions: RobotSequenceAction[] = [];
  while (remaining > 0.000001) {
    const chunk = Math.min(remaining, MAX_DRIVE_DISTANCE_PER_STEP_METERS);
    actions.push({
      type: 'driveDistance',
      distanceMeters: sign * roundMotionValue(chunk),
      maxSpeedMps,
    });
    remaining = roundMotionValue(remaining - chunk);
  }
  return actions;
}

function splitAngleIntoSafeActions(
  angleRad: number,
  maxAngularRadps: number,
): RobotSequenceAction[] {
  const sign = Math.sign(angleRad);
  let remaining = Math.abs(angleRad);
  const actions: RobotSequenceAction[] = [];
  while (remaining > 0.000001) {
    const chunk = Math.min(remaining, MAX_ROTATE_ANGLE_PER_STEP_RAD);
    actions.push({
      type: 'rotateAngle',
      angleRad: sign * roundMotionValue(chunk),
      maxAngularRadps,
    });
    remaining = roundMotionValue(remaining - chunk);
  }
  return actions;
}

function isBaseMotionAction(action: RobotSequenceAction): boolean {
  return (
    action.type === 'driveDistance' ||
    action.type === 'rotateAngle' ||
    action.type === 'velocityProfile'
  );
}

function readConfirmationMessage(intent: Record<string, unknown>): string | undefined {
  return typeof intent.confirmationMessage === 'string' && intent.confirmationMessage.trim()
    ? intent.confirmationMessage.trim()
    : undefined;
}

function plannedOutcome(intent: RobotIntent, raw: Record<string, unknown>): RobotIntentPlannerOutcome {
  const confirmationMessage = readConfirmationMessage(raw);
  return confirmationMessage
    ? { type: 'planned', intent, confirmationMessage }
    : { type: 'planned', intent };
}

function roundMotionValue(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeReactiveDuration(value: unknown): number {
  if (!isPositiveNumber(value)) return DEFAULT_REACTIVE_DURATION_MS;
  return Math.round(Math.min(value, MAX_REACTIVE_DURATION_MS));
}

function normalizeStopOnSilenceMs(value: unknown): number {
  if (!isPositiveNumber(value)) return DEFAULT_REACTIVE_STOP_ON_SILENCE_MS;
  return Math.round(Math.min(Math.max(value, 1000), 30_000));
}

function normalizeStartupNoInputMs(value: unknown): number {
  if (!isPositiveNumber(value)) return DEFAULT_REACTIVE_STARTUP_NO_INPUT_MS;
  return Math.round(Math.min(Math.max(value, 1000), 30_000));
}

function normalizeNodeId(value: unknown): string {
  return typeof value === 'string' && /^[a-z][a-z0-9_-]{0,31}$/u.test(value) ? value : '';
}

function normalizeArgs(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function normalizeLinearSpeed(value: unknown): number {
  if (!isPositiveNumber(value)) return DEFAULT_LINEAR_SPEED_MPS;
  return roundMotionValue(Math.min(value, MAX_LINEAR_SPEED_MPS));
}

function normalizeAngularSpeed(value: unknown): number {
  if (!isPositiveNumber(value)) return roundMotionValue(DEFAULT_ANGULAR_SPEED_RADPS);
  return roundMotionValue(Math.min(value, MAX_ANGULAR_SPEED_RADPS));
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoundedNumber(value: unknown, absLimit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= absLimit;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function formatTurns(angleRad: number): string {
  const turns = angleRad / (Math.PI * 2);
  if (Math.abs(Math.abs(turns) - 1) < 0.001) return '1圈';
  return `${turns.toFixed(2)}圈`;
}
