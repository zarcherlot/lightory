import type { RobotPlan, RobotPlanStep, RobotRisk } from './types.js';

interface BuildContext {
  padId: string;
  sessionId: string;
}

const MAX_DRIVE_DISTANCE_PER_STEP_METERS = 2;
const MAX_ROTATE_ANGLE_PER_STEP_RAD = Math.PI * 2 + 0.001;
const MAX_SEQUENCE_ACTIONS = 100;
const DEFAULT_LINEAR_SPEED_MPS = 0.2;
const MAX_LINEAR_SPEED_MPS = 0.5;
const DEFAULT_ANGULAR_SPEED_RADPS = degreesToRadians(20);
const MAX_ANGULAR_SPEED_RADPS = degreesToRadians(45);

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

export type RobotSequenceAction =
  | { type: 'driveDistance'; distanceMeters: number; maxSpeedMps?: number }
  | { type: 'rotateAngle'; angleRad: number; maxAngularRadps?: number }
  | {
      type: 'velocityProfile';
      intent: string;
      segments: Array<{ linearX: number; angularZ: number; durationMs: number }>;
    };

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
  | { type: 'sequence'; intent: string; actions: RobotSequenceAction[] };

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
  if (remember?.[1]) return { type: 'rememberPoi', poiName: remember[1].trim() };

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
  return buildVelocityProfilePlan(ctx, intent.intent, intent.segments);
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
