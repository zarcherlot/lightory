import type { RobotPlan, RobotPlanStep, RobotRisk } from './types.js';

interface BuildContext {
  padId: string;
  sessionId: string;
}

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

export function buildDriveDistancePlan(ctx: BuildContext, distanceMeters: number): RobotPlan {
  const direction = distanceMeters >= 0 ? '前进' : '后退';
  const absDistance = Math.abs(distanceMeters);
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
        args: { distanceMeters, maxSpeedMps: 0.2 },
        timeoutMs: 15000,
        safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: 0.2 },
      },
      { id: 's2', tool: 'base.stop', dependsOn: ['s1'], args: {} },
    ],
    16000,
    ['小车已架空或处于安全测试环境', '移动距离由机器人里程计估算'],
  );
}

export function buildRotateAnglePlan(ctx: BuildContext, angleRad: number): RobotPlan {
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
        args: { angleRad, maxAngularRadps: 0.8 },
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
        safety: { requiresLease: 'base', stopOnObstacle: true, maxSpeedMps: 0.2 },
      },
      { id: 's2', tool: 'base.stop', dependsOn: ['s1'], args: {} },
    ],
    21000,
    ['小车已架空或处于安全测试环境', '速度曲线由小车侧 watchdog 限时执行'],
  );
}

export type RobotIntent =
  | { type: 'rememberPoi'; poiName: string }
  | { type: 'moveToPoi'; poiName: string }
  | { type: 'speech'; text: string }
  | { type: 'led'; mode: string }
  | { type: 'driveDistance'; distanceMeters: number }
  | { type: 'rotateAngle'; angleRad: number }
  | {
      type: 'velocityProfile';
      intent: string;
      segments: Array<{ linearX: number; angularZ: number; durationMs: number }>;
    };

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
  if (intent.type === 'driveDistance') return buildDriveDistancePlan(ctx, intent.distanceMeters);
  if (intent.type === 'rotateAngle') return buildRotateAnglePlan(ctx, intent.angleRad);
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

function formatTurns(angleRad: number): string {
  const turns = angleRad / (Math.PI * 2);
  if (Math.abs(Math.abs(turns) - 1) < 0.001) return '1圈';
  return `${turns.toFixed(2)}圈`;
}
