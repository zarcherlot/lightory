import type { HookProvider } from '../../core/src/provider.js';
import { executeLlmRolePrompt } from './llmRoleExecutor.js';

const ROBOT_INTENT_TIMEOUT_MS = 90_000;
const MAX_SEQUENCE_ACTIONS = 100;
const MAX_PLANNED_DISTANCE_METERS = 200;
const MAX_PLANNED_ROTATION_RAD = Math.PI * 2 * 20;
const MAX_LINEAR_SPEED_MPS = 0.5;
const DEFAULT_LINEAR_SPEED_MPS = 0.2;
const MAX_ANGULAR_SPEED_RADPS = 0.785398;
const DEFAULT_ANGULAR_SPEED_RADPS = 0.349066;
const MAX_REACTIVE_DURATION_MS = 120_000;

export interface RobotIntentPlannerOptions {
  provider: HookProvider;
  cwd: string;
}

export interface RobotIntentPlanRequest {
  requestId: string;
  content: string;
  tools: Array<Record<string, unknown>>;
}

export type RobotIntentPlanResult =
  | { ok: true; intent: Record<string, unknown> }
  | { ok: false; error: string };

export function createRobotIntentPlanner(options: RobotIntentPlannerOptions) {
  return async (request: RobotIntentPlanRequest): Promise<RobotIntentPlanResult> => {
    const prompt = buildRobotIntentPrompt(request.content, request.tools);
    const result = await executeLlmRolePrompt({
      provider: options.provider,
      cwd: options.cwd,
      runId: `robot-intent-${request.requestId}`,
      prompt,
      timeoutMs: ROBOT_INTENT_TIMEOUT_MS,
      timeoutError: 'Robot intent planner timed out.',
      unavailableError: `Provider ${options.provider.displayName} cannot plan robot intents.`,
    });
    if (!result.ok) return { ok: false, error: result.error };
    const parsed = parsePlannerJson(result.output);
    if (!parsed) return { ok: false, error: 'Planner returned non-JSON output.' };
    const validation = validatePlannerIntent(parsed);
    if (validation) return { ok: false, error: validation };
    return { ok: true, intent: parsed };
  };
}

function buildRobotIntentPrompt(content: string, tools: Array<Record<string, unknown>>): string {
  return [
    'You are the Lightory robot intent planner.',
    'Convert the user Chinese command into one restricted robot intent JSON object.',
    'Use natural Chinese for confirmationMessage when the action is long, compound, or more risky than a short single move.',
    'Do not execute anything. Do not call tools. Do not write prose.',
    'Return JSON only, without markdown fences.',
    '',
    'Available robot tool names:',
    tools.map((tool) => `- ${String(tool.name ?? '')}`).join('\n'),
    '',
    'Allowed output schemas:',
    '{"type":"driveDistance","distanceMeters":number,"maxSpeedMps":number}',
    '{"type":"rotateAngle","angleRad":number,"maxAngularRadps":number}',
    '{"type":"velocityProfile","intent":"short Chinese intent","segments":[{"linearX":number,"angularZ":number,"durationMs":number}]}',
    '{"type":"sequence","intent":"short Chinese intent","confirmationMessage":"polite Chinese confirmation question","actions":[{"type":"driveDistance","distanceMeters":number,"maxSpeedMps":number},{"type":"rotateAngle","angleRad":number,"maxAngularRadps":number},{"type":"velocityProfile","intent":"short Chinese intent","segments":[{"linearX":number,"angularZ":number,"durationMs":number}]}]}',
    '{"type":"reactive","intent":"short Chinese intent","confirmationMessage":"polite Chinese confirmation question","graph":{"durationMs":number,"sources":[{"id":"mic","type":"audio.microphone","args":{}}],"processors":[{"id":"beat","type":"audio.beatTracker","input":"mic","args":{}}],"outputs":[{"id":"base","type":"base.motionReactive","input":"beat","args":{"style":"dance","maxSpeedMps":number,"maxAngularRadps":number}},{"id":"led","type":"led.reactivePattern","input":"beat","args":{"style":"cheerful"}}],"safety":{"requiresLease":["base"],"stopOnObstacle":true,"startupNoInputMs":number,"stopOnSilenceMs":number,"maxSpeedMps":number,"maxAngularRadps":number}}}',
    '{"type":"raceLap","trackId":"default-abcd","order":["A","B","C","D","A"],"strategy":{"maxSpeedMps":number,"lookaheadMeters":number,"waypointToleranceM":number,"headingKp":number,"maxAngularRadps":number},"safety":{"frontStopDistanceMeters":number,"maxDurationMs":number},"confirmationMessage":"polite Chinese confirmation question"}',
    '{"type":"raceRecordPoint","name":"A|B|C|D"}',
    '{"type":"speech","text":"short text"}',
    '{"type":"led","mode":"short mode"}',
    '{"type":"rememberPoi","poiName":"place name"}',
    '{"type":"unsupported","reason":"short Chinese reason"}',
    '',
    'Safety limits that your JSON must obey:',
    '- Use driveDistance for explicit distance movement. The frontend can split long distances into safe tool-sized steps.',
    '- Use rotateAngle for explicit turns. The frontend can split large rotations into safe tool-sized steps.',
    `- Use sequence for compound commands. It may contain up to ${MAX_SEQUENCE_ACTIONS} actions before frontend expansion.`,
    `- Default linear speed is ${DEFAULT_LINEAR_SPEED_MPS}m/s. maxSpeedMps must be >0 and <=${MAX_LINEAR_SPEED_MPS}.`,
    `- Default angular speed is ${DEFAULT_ANGULAR_SPEED_RADPS}rad/s (20deg/s). maxAngularRadps must be >0 and <=${MAX_ANGULAR_SPEED_RADPS}rad/s (45deg/s).`,
    '- For "快一点", "加速", or "速度快点", choose a higher safe speed up to the max. For "慢点", choose a lower speed.',
    '- Use velocityProfile for vague expressive motion such as dancing, shaking, celebration, forward/back patterns, or figure-eight.',
    '- Use reactive for real-time microphone-driven compound behavior such as following music, clapping, singing, dancing to sound, flashing lights to music, or performing happily to music.',
    '- For reactive, do not invent a separate business tool for dancing, lighting, or performance. Compose allowed graph nodes only.',
    '- Reactive source types: audio.microphone.',
    '- Reactive processor types: audio.beatTracker, audio.onsetDetector, audio.moodEstimator.',
    '- Reactive output types: base.motionReactive, led.reactivePattern, speech.reactiveCue.',
    `- Reactive durationMs must be >0 and <=${MAX_REACTIVE_DURATION_MS}. Default to 30000 if unspecified.`,
    '- Reactive should wait for sound before moving. Use startupNoInputMs:5000 and stopOnSilenceMs:5000 unless the user asks otherwise.',
    '- Each velocityProfile segment must have abs(linearX) <= 0.5, abs(angularZ) <= 0.785398, durationMs > 0.',
    '- Total velocityProfile duration must be <= 20000ms.',
    '- Prefer conservative speeds and short durations.',
    '- Use raceLap for explicit four-point race execution, one-lap test runs, default-abcd race runs, or developer test mode requests to run A/B/C/D.',
    '- raceLap order must be the closed route ["A","B","C","D","A"]. Default trackId is "default-abcd".',
    '- For raceLap MVP, prefer maxSpeedMps 0.12 unless the user explicitly asks to optimize speed. Include confirmationMessage because it moves the real robot.',
    '- Use raceRecordPoint when the user says the robot is currently at A/B/C/D, asks to remember A/B/C/D, or says 到A点了 / 现在是A点 / 这里是A点. Do not use rememberPoi for A/B/C/D race points.',
    '- Do not reject a compound movement just because it combines multiple tools; return sequence.',
    '- Do not reject a 3m-style long distance just because one tool call is shorter; return sequence or driveDistance with a friendly confirmationMessage.',
    '- If the request is physically risky, ambiguous, or unusually long, still return a safe candidate with confirmationMessage when possible.',
    '- Return unsupported only when there is no safe candidate plan at all.',
    '',
    'Examples:',
    'User: 前进2m',
    'JSON: {"type":"driveDistance","distanceMeters":2,"maxSpeedMps":0.2}',
    'User: 快一点前进2m',
    'JSON: {"type":"driveDistance","distanceMeters":2,"maxSpeedMps":0.4}',
    'User: 旋转1圈',
    'JSON: {"type":"rotateAngle","angleRad":6.283185307,"maxAngularRadps":0.349066}',
    'User: 快速旋转1圈',
    'JSON: {"type":"rotateAngle","angleRad":6.283185307,"maxAngularRadps":0.785398}',
    'User: 让小车前前后后跳个舞',
    'JSON: {"type":"velocityProfile","intent":"前后摆动跳舞","segments":[{"linearX":0.15,"angularZ":0.4,"durationMs":700},{"linearX":-0.15,"angularZ":-0.4,"durationMs":700},{"linearX":0.15,"angularZ":-0.4,"durationMs":700},{"linearX":-0.15,"angularZ":0.4,"durationMs":700}]}',
    'User: 让小车跟着音乐跳起舞来',
    'JSON: {"type":"reactive","intent":"跟着麦克风听到的音乐跳舞","confirmationMessage":"我会打开小车麦克风，先等待音乐或拍子，再根据节拍实时控制底盘动作。请确认小车已架空或周围安全后再开始。","graph":{"durationMs":30000,"sources":[{"id":"mic","type":"audio.microphone","args":{"sampleRateHz":16000,"channel":"mono"}}],"processors":[{"id":"beat","type":"audio.beatTracker","input":"mic","args":{"features":["beat","tempo","energy","onset"],"latencyTargetMs":180}}],"outputs":[{"id":"base","type":"base.motionReactive","input":"beat","args":{"style":"dance","maxSpeedMps":0.35,"maxAngularRadps":0.6}}],"safety":{"requiresLease":["base"],"stopOnObstacle":true,"startupNoInputMs":5000,"stopOnSilenceMs":5000,"maxSpeedMps":0.35,"maxAngularRadps":0.6}}}',
    'User: 跟着音乐闪灯',
    'JSON: {"type":"reactive","intent":"跟着麦克风听到的音乐闪灯","confirmationMessage":"我会打开小车麦克风，先等待音乐或拍子，再根据节拍控制灯光变化。确认后开始。","graph":{"durationMs":30000,"sources":[{"id":"mic","type":"audio.microphone","args":{"sampleRateHz":16000,"channel":"mono"}}],"processors":[{"id":"beat","type":"audio.beatTracker","input":"mic","args":{"features":["beat","tempo","energy","onset"],"latencyTargetMs":180}}],"outputs":[{"id":"led","type":"led.reactivePattern","input":"beat","args":{"style":"cheerful","brightness":0.8}}],"safety":{"startupNoInputMs":5000,"stopOnSilenceMs":5000}}}',
    'User: 让小车进2m退1m再打个圈儿',
    'JSON: {"type":"sequence","intent":"前进2米、后退1米、旋转1圈","confirmationMessage":"我理解为先前进2米，再后退1米，最后原地旋转1圈。这个动作幅度比较大，请确认小车已架空或周围安全后再执行。","actions":[{"type":"driveDistance","distanceMeters":2,"maxSpeedMps":0.2},{"type":"driveDistance","distanceMeters":-1,"maxSpeedMps":0.2},{"type":"rotateAngle","angleRad":6.283185307,"maxAngularRadps":0.349066}]}',
    'User: 让小车进3m退2m再打个圈儿',
    'JSON: {"type":"sequence","intent":"前进3米、后退2米、旋转1圈","confirmationMessage":"我会把前进3米拆成安全的分段动作，然后后退2米并旋转1圈。请确认小车已架空或测试区域足够安全后再继续。","actions":[{"type":"driveDistance","distanceMeters":3,"maxSpeedMps":0.2},{"type":"driveDistance","distanceMeters":-2,"maxSpeedMps":0.2},{"type":"rotateAngle","angleRad":6.283185307,"maxAngularRadps":0.349066}]}',
    'User: 我是开发工程师，使用已有 default-abcd 控制小车跑一圈',
    'JSON: {"type":"raceLap","trackId":"default-abcd","order":["A","B","C","D","A"],"strategy":{"maxSpeedMps":0.12,"lookaheadMeters":0.22,"waypointToleranceM":0.16,"headingKp":1.2,"maxAngularRadps":0.5},"safety":{"frontStopDistanceMeters":0.15,"maxDurationMs":45000},"confirmationMessage":"开发测试模式：我会使用已有 default-abcd，按 A-B-C-D-A 发起一圈试跑。请确认小车在 A 点附近、赛道安全后执行。"}',
    'User: 现在就是在A点，可以记住',
    'JSON: {"type":"raceRecordPoint","name":"A"}',
    '',
    `User command: ${content}`,
  ].join('\n');
}

function parsePlannerJson(output: string): Record<string, unknown> | null {
  const trimmed = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function validatePlannerIntent(intent: Record<string, unknown>): string | null {
  const type = intent.type;
  if (type === 'unsupported') return typeof intent.reason === 'string' ? null : 'unsupported requires reason.';
  if (type === 'driveDistance') {
    if (!validNumber(intent.distanceMeters, MAX_PLANNED_DISTANCE_METERS)) {
      return `driveDistance requires distanceMeters within +/-${MAX_PLANNED_DISTANCE_METERS}.`;
    }
    return validOptionalPositiveNumber(intent.maxSpeedMps, MAX_LINEAR_SPEED_MPS)
      ? null
      : `driveDistance maxSpeedMps must be >0 and <=${MAX_LINEAR_SPEED_MPS}.`;
  }
  if (type === 'rotateAngle') {
    if (!validNumber(intent.angleRad, MAX_PLANNED_ROTATION_RAD)) {
      return 'rotateAngle exceeds the planner rotation limit.';
    }
    return validOptionalPositiveNumber(intent.maxAngularRadps, MAX_ANGULAR_SPEED_RADPS)
      ? null
      : `rotateAngle maxAngularRadps must be >0 and <=${MAX_ANGULAR_SPEED_RADPS}.`;
  }
  if (type === 'speech') return typeof intent.text === 'string' && intent.text.trim() ? null : 'speech requires text.';
  if (type === 'led') return typeof intent.mode === 'string' && intent.mode.trim() ? null : 'led requires mode.';
  if (type === 'rememberPoi') {
    return typeof intent.poiName === 'string' && intent.poiName.trim() ? null : 'rememberPoi requires poiName.';
  }
  if (type === 'velocityProfile') {
    return validateVelocityProfile(intent);
  }
  if (type === 'sequence') {
    if (typeof intent.intent !== 'string' || !intent.intent.trim()) return 'sequence requires intent.';
    if (!Array.isArray(intent.actions) || intent.actions.length === 0) return 'sequence requires actions.';
    if (intent.actions.length > MAX_SEQUENCE_ACTIONS) {
      return `sequence cannot exceed ${MAX_SEQUENCE_ACTIONS} actions.`;
    }
    for (const action of intent.actions) {
      if (!action || typeof action !== 'object' || Array.isArray(action)) return 'Invalid sequence action.';
      const validation = validateSequenceAction(action as Record<string, unknown>);
      if (validation) return validation;
    }
    return null;
  }
  if (type === 'reactive') {
    if (typeof intent.intent !== 'string' || !intent.intent.trim()) return 'reactive requires intent.';
    return validateReactiveGraph(intent.graph);
  }
  if (type === 'raceLap') return validateRaceLap(intent);
  if (type === 'raceRecordPoint') return validateRacePointName(intent.name);
  return 'Unsupported planner intent type.';
}

function validateRacePointName(raw: unknown): string | null {
  return raw === 'A' || raw === 'B' || raw === 'C' || raw === 'D'
    ? null
    : 'raceRecordPoint name must be A, B, C, or D.';
}

function validateRaceLap(intent: Record<string, unknown>): string | null {
  if (intent.trackId !== undefined && (typeof intent.trackId !== 'string' || !intent.trackId.trim())) {
    return 'raceLap trackId must be a non-empty string.';
  }
  if (intent.order !== undefined) {
    if (!Array.isArray(intent.order) || intent.order.length !== 5) {
      return 'raceLap order must contain five closed route points.';
    }
    const order = intent.order.map(String);
    if (
      !order.every((point) => point === 'A' || point === 'B' || point === 'C' || point === 'D') ||
      order[0] !== order[4]
    ) {
      return 'raceLap order must be closed A/B/C/D route.';
    }
  }
  if (intent.strategy !== undefined) {
    if (!intent.strategy || typeof intent.strategy !== 'object' || Array.isArray(intent.strategy)) {
      return 'raceLap strategy must be an object.';
    }
    const strategy = intent.strategy as Record<string, unknown>;
    if (!validOptionalPositiveNumber(strategy.maxSpeedMps, MAX_LINEAR_SPEED_MPS)) {
      return `raceLap maxSpeedMps must be >0 and <=${MAX_LINEAR_SPEED_MPS}.`;
    }
    if (!validOptionalPositiveNumber(strategy.maxAngularRadps, MAX_ANGULAR_SPEED_RADPS)) {
      return `raceLap maxAngularRadps must be >0 and <=${MAX_ANGULAR_SPEED_RADPS}.`;
    }
  }
  if (intent.safety !== undefined) {
    if (!intent.safety || typeof intent.safety !== 'object' || Array.isArray(intent.safety)) {
      return 'raceLap safety must be an object.';
    }
    const safety = intent.safety as Record<string, unknown>;
    if (!validOptionalPositiveNumber(safety.frontStopDistanceMeters, 2)) {
      return 'raceLap frontStopDistanceMeters must be >0 and <=2.';
    }
    if (!validOptionalPositiveNumber(safety.maxDurationMs, MAX_REACTIVE_DURATION_MS)) {
      return `raceLap maxDurationMs must be >0 and <=${MAX_REACTIVE_DURATION_MS}.`;
    }
  }
  return null;
}

function validateSequenceAction(action: Record<string, unknown>): string | null {
  if (action.type === 'driveDistance') {
    if (!validNumber(action.distanceMeters, MAX_PLANNED_DISTANCE_METERS)) {
      return `sequence driveDistance requires distanceMeters within +/-${MAX_PLANNED_DISTANCE_METERS}.`;
    }
    return validOptionalPositiveNumber(action.maxSpeedMps, MAX_LINEAR_SPEED_MPS)
      ? null
      : `sequence driveDistance maxSpeedMps must be >0 and <=${MAX_LINEAR_SPEED_MPS}.`;
  }
  if (action.type === 'rotateAngle') {
    if (!validNumber(action.angleRad, MAX_PLANNED_ROTATION_RAD)) {
      return 'sequence rotateAngle exceeds the planner rotation limit.';
    }
    return validOptionalPositiveNumber(action.maxAngularRadps, MAX_ANGULAR_SPEED_RADPS)
      ? null
      : `sequence rotateAngle maxAngularRadps must be >0 and <=${MAX_ANGULAR_SPEED_RADPS}.`;
  }
  if (action.type === 'velocityProfile') return validateVelocityProfile(action);
  return 'Unsupported sequence action type.';
}

function validateVelocityProfile(intent: Record<string, unknown>): string | null {
  if (typeof intent.intent !== 'string' || !intent.intent.trim()) return 'velocityProfile requires intent.';
  if (!Array.isArray(intent.segments) || intent.segments.length === 0) {
    return 'velocityProfile requires segments.';
  }
  let totalMs = 0;
  for (const segment of intent.segments) {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) return 'Invalid segment.';
    const item = segment as Record<string, unknown>;
    if (!validNumber(item.linearX, MAX_LINEAR_SPEED_MPS)) return 'segment linearX exceeds +/-0.5.';
    if (!validNumber(item.angularZ, MAX_ANGULAR_SPEED_RADPS)) {
      return 'segment angularZ exceeds +/-45deg/s.';
    }
    if (!validPositiveNumber(item.durationMs)) return 'segment durationMs must be positive.';
    totalMs += Number(item.durationMs);
  }
  return totalMs <= 20_000 ? null : 'velocityProfile duration exceeds 20000ms.';
}

function validateReactiveGraph(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'reactive graph must be an object.';
  const graph = raw as Record<string, unknown>;
  if (!validPositiveNumber(graph.durationMs) || Number(graph.durationMs) > MAX_REACTIVE_DURATION_MS) {
    return `reactive durationMs must be >0 and <=${MAX_REACTIVE_DURATION_MS}.`;
  }
  const sourceIds = validateReactiveSources(graph.sources);
  if (typeof sourceIds === 'string') return sourceIds;
  const processorIds = validateReactiveProcessors(graph.processors, sourceIds);
  if (typeof processorIds === 'string') return processorIds;
  const outputs = validateReactiveOutputs(graph.outputs, new Set([...sourceIds, ...processorIds]));
  if (outputs) return outputs;
  return validateReactiveSafety(graph.safety);
}

function validateReactiveSources(raw: unknown): Set<string> | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'reactive graph requires sources.';
  const ids = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return 'reactive source must be an object.';
    const node = item as Record<string, unknown>;
    if (!validNodeId(node.id) || ids.has(String(node.id))) return 'reactive source id is invalid.';
    if (node.type !== 'audio.microphone') return 'reactive source type is unsupported.';
    ids.add(String(node.id));
  }
  return ids;
}

function validateReactiveProcessors(raw: unknown, sourceIds: Set<string>): Set<string> | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'reactive graph requires processors.';
  const knownIds = new Set(sourceIds);
  const processorIds = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return 'reactive processor must be an object.';
    const node = item as Record<string, unknown>;
    if (!validNodeId(node.id) || knownIds.has(String(node.id))) return 'reactive processor id is invalid.';
    if (!validNodeId(node.input) || !knownIds.has(String(node.input))) {
      return 'reactive processor input is invalid.';
    }
    if (
      node.type !== 'audio.beatTracker' &&
      node.type !== 'audio.onsetDetector' &&
      node.type !== 'audio.moodEstimator'
    ) {
      return 'reactive processor type is unsupported.';
    }
    knownIds.add(String(node.id));
    processorIds.add(String(node.id));
  }
  return processorIds;
}

function validateReactiveOutputs(raw: unknown, knownIds: Set<string>): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return 'reactive graph requires outputs.';
  const outputIds = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return 'reactive output must be an object.';
    const node = item as Record<string, unknown>;
    if (!validNodeId(node.id) || outputIds.has(String(node.id))) return 'reactive output id is invalid.';
    if (!validNodeId(node.input) || !knownIds.has(String(node.input))) return 'reactive output input is invalid.';
    if (
      node.type !== 'base.motionReactive' &&
      node.type !== 'led.reactivePattern' &&
      node.type !== 'speech.reactiveCue'
    ) {
      return 'reactive output type is unsupported.';
    }
    if (node.type === 'base.motionReactive') {
      const args = node.args && typeof node.args === 'object' && !Array.isArray(node.args)
        ? (node.args as Record<string, unknown>)
        : {};
      if (!validOptionalPositiveNumber(args.maxSpeedMps, MAX_LINEAR_SPEED_MPS)) {
        return `base.motionReactive maxSpeedMps must be >0 and <=${MAX_LINEAR_SPEED_MPS}.`;
      }
      if (!validOptionalPositiveNumber(args.maxAngularRadps, MAX_ANGULAR_SPEED_RADPS)) {
        return `base.motionReactive maxAngularRadps must be >0 and <=${MAX_ANGULAR_SPEED_RADPS}.`;
      }
    }
    outputIds.add(String(node.id));
  }
  return null;
}

function validateReactiveSafety(raw: unknown): string | null {
  if (raw === undefined) return null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'reactive safety must be an object.';
  const safety = raw as Record<string, unknown>;
  if (!validOptionalPositiveNumber(safety.maxSpeedMps, MAX_LINEAR_SPEED_MPS)) {
    return `reactive safety maxSpeedMps must be >0 and <=${MAX_LINEAR_SPEED_MPS}.`;
  }
  if (!validOptionalPositiveNumber(safety.maxAngularRadps, MAX_ANGULAR_SPEED_RADPS)) {
    return `reactive safety maxAngularRadps must be >0 and <=${MAX_ANGULAR_SPEED_RADPS}.`;
  }
  if (safety.stopOnSilenceMs !== undefined && !validPositiveNumber(safety.stopOnSilenceMs)) {
    return 'reactive safety stopOnSilenceMs must be positive.';
  }
  if (safety.startupNoInputMs !== undefined && !validPositiveNumber(safety.startupNoInputMs)) {
    return 'reactive safety startupNoInputMs must be positive.';
  }
  if (
    safety.requiresLease !== undefined &&
    (!Array.isArray(safety.requiresLease) ||
      !safety.requiresLease.every((resource) => resource === 'base' || resource === 'arm'))
  ) {
    return 'reactive safety requiresLease is invalid.';
  }
  return null;
}

function validNodeId(value: unknown): boolean {
  return typeof value === 'string' && /^[a-z][a-z0-9_-]{0,31}$/u.test(value);
}

function validNumber(value: unknown, absLimit: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= absLimit;
}

function validPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validOptionalPositiveNumber(value: unknown, absLimit: number): boolean {
  return value === undefined || validPositiveNumber(value) && Number(value) <= absLimit;
}
