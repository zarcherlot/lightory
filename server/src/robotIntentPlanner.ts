import { spawn } from 'child_process';
import * as fs from 'fs';

import type { HookProvider } from '../../core/src/provider.js';
import { buildRoleTaskCommand } from './roleTaskRunner.js';

const ROBOT_INTENT_TIMEOUT_MS = 90_000;
const MAX_SEQUENCE_ACTIONS = 100;
const MAX_PLANNED_DISTANCE_METERS = 200;
const MAX_PLANNED_ROTATION_RAD = Math.PI * 2 * 20;
const MAX_LINEAR_SPEED_MPS = 0.5;
const DEFAULT_LINEAR_SPEED_MPS = 0.2;
const MAX_ANGULAR_SPEED_RADPS = 0.785398;
const DEFAULT_ANGULAR_SPEED_RADPS = 0.349066;

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
    const command = buildRoleTaskCommand(
      options.provider,
      prompt,
      options.cwd,
      `robot-intent-${request.requestId}`,
    );
    if (!command) {
      return { ok: false, error: `Provider ${options.provider.displayName} cannot plan robot intents.` };
    }

    return new Promise((resolve) => {
      const child = spawn(command.command, command.args, {
        cwd: options.cwd,
        env: command.env ?? process.env,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill();
        resolve({ ok: false, error: 'Robot intent planner timed out.' });
      }, ROBOT_INTENT_TIMEOUT_MS);

      if (command.input !== undefined) child.stdin.end(command.input);
      else child.stdin.end();

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ ok: false, error: `Failed to start robot intent planner: ${error.message}` });
      });
      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const output = readOutput(command.outputPath) || stdout.trim();
        cleanupOutput(command.outputPath);
        if (code !== 0) {
          resolve({ ok: false, error: stderr.trim() || output || `Planner exited with code ${code}.` });
          return;
        }
        const parsed = parsePlannerJson(output);
        if (!parsed) {
          resolve({ ok: false, error: 'Planner returned non-JSON output.' });
          return;
        }
        const validation = validatePlannerIntent(parsed);
        if (validation) {
          resolve({ ok: false, error: validation });
          return;
        }
        resolve({ ok: true, intent: parsed });
      });
    });
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
    '- Each velocityProfile segment must have abs(linearX) <= 0.5, abs(angularZ) <= 0.785398, durationMs > 0.',
    '- Total velocityProfile duration must be <= 20000ms.',
    '- Prefer conservative speeds and short durations.',
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
    'User: 让小车进2m退1m再打个圈儿',
    'JSON: {"type":"sequence","intent":"前进2米、后退1米、旋转1圈","confirmationMessage":"我理解为先前进2米，再后退1米，最后原地旋转1圈。这个动作幅度比较大，请确认小车已架空或周围安全后再执行。","actions":[{"type":"driveDistance","distanceMeters":2,"maxSpeedMps":0.2},{"type":"driveDistance","distanceMeters":-1,"maxSpeedMps":0.2},{"type":"rotateAngle","angleRad":6.283185307,"maxAngularRadps":0.349066}]}',
    'User: 让小车进3m退2m再打个圈儿',
    'JSON: {"type":"sequence","intent":"前进3米、后退2米、旋转1圈","confirmationMessage":"我会把前进3米拆成安全的分段动作，然后后退2米并旋转1圈。请确认小车已架空或测试区域足够安全后再继续。","actions":[{"type":"driveDistance","distanceMeters":3,"maxSpeedMps":0.2},{"type":"driveDistance","distanceMeters":-2,"maxSpeedMps":0.2},{"type":"rotateAngle","angleRad":6.283185307,"maxAngularRadps":0.349066}]}',
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
  return 'Unsupported planner intent type.';
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

function validNumber(value: unknown, absLimit: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= absLimit;
}

function validPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validOptionalPositiveNumber(value: unknown, absLimit: number): boolean {
  return value === undefined || validPositiveNumber(value) && Number(value) <= absLimit;
}

function readOutput(outputPath: string | undefined): string {
  if (!outputPath || !fs.existsSync(outputPath)) return '';
  return fs.readFileSync(outputPath, 'utf8').trim();
}

function cleanupOutput(outputPath: string | undefined): void {
  if (!outputPath) return;
  try {
    fs.rmSync(outputPath, { force: true });
  } catch {
    // Best effort cleanup only.
  }
}
