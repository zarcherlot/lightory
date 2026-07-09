import type { RobotPlan, RobotPlanStep, RobotRisk } from './types.js';

interface BuildContext {
  padId: string;
  sessionId: string;
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gu, '-')
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

export type RobotIntent =
  | { type: 'rememberPoi'; poiName: string }
  | { type: 'moveToPoi'; poiName: string }
  | { type: 'speech'; text: string }
  | { type: 'led'; mode: string };

export function parseRobotIntent(input: string): RobotIntent | null {
  const text = input.trim();
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
  return buildLedPlan(ctx, intent.mode);
}
