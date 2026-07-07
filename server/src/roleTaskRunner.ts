import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { HookProvider } from '../../core/src/provider.js';
import type { RoleTaskInputCard } from './clientMessageHandler.js';

type WsSend = (message: Record<string, unknown>) => void;

const ROLE_TASK_FILES: Record<string, string> = {
  weather: 'weather.md',
  dresser: 'dresser.md',
  travel: 'travel.md',
  captain: 'captain.md',
};
const ROLE_TASK_TIMEOUT_MS = 120_000;

export interface RoleTaskRunnerOptions {
  provider: HookProvider;
  rolesDir: string;
  cwd: string;
}

interface CommandSpec {
  command: string;
  args: string[];
  env?: Record<string, string>;
  displayCommand?: string;
  input?: string;
  outputPath?: string;
}

export function createRoleTaskRunner(options: RoleTaskRunnerOptions) {
  return (roleId: string, send: WsSend, inputCards: RoleTaskInputCard[] = []): void => {
    const relativeTaskFile = ROLE_TASK_FILES[roleId];
    const runId = `${roleId}-${Date.now().toString(36)}`;

    const emit = (message: Record<string, unknown>) => {
      send({ type: 'roleTaskConsole', runId, roleId, ...message });
    };
    const emitStatus = (status: string, weatherIcon?: string) => {
      send({ type: 'roleTaskStatus', runId, roleId, status, weatherIcon });
    };

    if (!relativeTaskFile) {
      emitStatus('error');
      emit({ status: 'error', stream: 'stderr', content: `Unknown role task: ${roleId}\n` });
      return;
    }

    const taskPath = path.join(options.rolesDir, relativeTaskFile);
    if (!fs.existsSync(taskPath)) {
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Role task file not found: ${path.join('roles', relativeTaskFile)}\n`,
      });
      return;
    }

    const taskMarkdown = fs.readFileSync(taskPath, 'utf8');
    const prompt = [
      `Execute this ${roleId} role task using only the task text below.`,
      '',
      'Do not read local files. Do not list directories. Do not run shell commands.',
      'If the task needs current weather, use built-in web search only.',
      'Return only the final child-friendly card or checklist text.',
      '',
      formatInputCards(inputCards),
      '',
      taskMarkdown,
    ].join('\n');
    const command = buildRoleTaskCommand(options.provider, prompt, options.cwd, runId);
    if (!command) {
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Provider ${options.provider.displayName} cannot launch role tasks.\n`,
      });
      return;
    }

    emitStatus('started');

    const child = spawn(command.command, command.args, {
      cwd: options.cwd,
      env: { ...process.env, ...command.env },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Role task timed out after ${Math.round(ROLE_TASK_TIMEOUT_MS / 1000)} seconds.\n`,
      });
      child.kill();
    }, ROLE_TASK_TIMEOUT_MS);

    if (command.input !== undefined) {
      child.stdin.end(command.input);
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const content = chunk.toString();
      stderr += content;
      traceRoleTaskStderr(options.provider.id, runId, roleId, content);
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const commandName = command.displayCommand ?? command.command;
      const hint = errorMessageHasMissingCommand(error)
        ? missingCommandHint(options.provider.id)
        : '';
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Failed to start ${commandName}: ${error.message}\n${hint}`,
      });
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (timedOut) {
        cleanupTaskOutput(command.outputPath);
        return;
      }
      const output = readTaskOutput(command.outputPath) || stdout.trim();
      const semanticFailure = isRoleTaskFailureOutput(output);
      const ok = code === 0 && !semanticFailure;
      const hint =
        code === 127 && options.provider.id === 'opencode'
          ? missingCommandHint(options.provider.id)
          : '';
      const errorOutput = stderr.trim() || stdout.trim();
      const content =
        signal !== null
          ? `Task stopped by signal ${signal}.`
          : ok
            ? output
            : [
                semanticFailure ? output : errorOutput,
                semanticFailure
                  ? 'Task output indicates the role did not complete successfully.'
                  : '',
                semanticFailure ? '' : `Task exited with code ${code ?? 'unknown'}.`,
                hint,
              ]
                .filter(Boolean)
                .join('\n');
      emit({
        status: ok ? 'done' : 'error',
        stream: ok ? 'stdout' : 'stderr',
        content: content.endsWith('\n') ? content : `${content}\n`,
      });
      emitStatus(ok ? 'done' : 'error', ok ? inferWeatherIcon(output) : undefined);
      cleanupTaskOutput(command.outputPath);
    });
  };
}

function formatInputCards(inputCards: RoleTaskInputCard[]): string {
  if (inputCards.length === 0) {
    return 'Input cards received from upstream roles: none.';
  }
  return [
    'Input cards received from upstream roles:',
    ...inputCards.map(
      (input) =>
        `- ${input.card} from ${input.sourceRoleId}:\n${input.content.trim() || '(empty card)'}`,
    ),
  ].join('\n');
}

function traceRoleTaskStderr(
  providerId: string,
  runId: string,
  roleId: string,
  content: string,
): void {
  if (providerId !== 'codex') return;
  const trimmed = content.trim();
  if (!trimmed) return;
  console.error(`[Lightory] roleTask stderr run=${runId} role=${roleId}\n${trimmed}`);
}

function isRoleTaskFailureOutput(output: string): boolean {
  const normalized = output.trim().toLowerCase();
  if (!normalized) return true;
  return [
    '查询失败',
    '无法联网',
    '无法获取',
    '稍后重新查询',
    'failed to',
    'cannot access',
    'could not',
    'unable to',
  ].some((token) => normalized.includes(token));
}

function buildRoleTaskCommand(
  provider: HookProvider,
  prompt: string,
  cwd: string,
  runId: string,
): CommandSpec | null {
  switch (provider.id) {
    case 'claude':
      return { command: 'claude', args: [prompt] };
    case 'codex':
      const outputPath = path.join(os.tmpdir(), `lightory-${runId}-last-message.txt`);
      return {
        command: 'codex',
        args: [
          'exec',
          '--ignore-user-config',
          '--color',
          'never',
          '--sandbox',
          'read-only',
          '-c',
          'model_provider="my_codex"',
          '-c',
          'model="gpt-5.5"',
          '-c',
          'model_reasoning_effort="medium"',
          '-c',
          'model_providers.my_codex.name="my_codex"',
          '-c',
          'model_providers.my_codex.base_url="https://tokenrain.ai/v1"',
          '-c',
          'model_providers.my_codex.wire_api="responses"',
          '-c',
          'model_providers.my_codex.requires_openai_auth=true',
          '--cd',
          cwd,
          '--output-last-message',
          outputPath,
          '-',
        ],
        env: { CODEX_SESSION_ID: `pixel-role-${runId}`, PWD: cwd },
        input: prompt,
        outputPath,
      };
    case 'opencode':
      const opencodeCommand = process.env['LIGHTORY_OPENCODE_BIN'] ?? 'opencode';
      return {
        command: opencodeCommand,
        args: ['run', prompt],
        env: { PWD: cwd },
        displayCommand: opencodeCommand,
      };
    default:
      return null;
  }
}

function errorMessageHasMissingCommand(error: Error): boolean {
  return 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

function missingCommandHint(providerId: string): string {
  if (providerId !== 'opencode') return '';
  return 'OpenCode CLI was not found. Install it, add it to PATH, set LIGHTORY_OPENCODE_BIN to its absolute path, or restart this server with --provider codex to run role tasks through Codex.\n';
}

function readTaskOutput(outputPath: string | undefined): string {
  if (!outputPath || !fs.existsSync(outputPath)) return '';
  return fs.readFileSync(outputPath, 'utf8').trim();
}

function cleanupTaskOutput(outputPath: string | undefined): void {
  if (!outputPath) return;
  try {
    fs.rmSync(outputPath, { force: true });
  } catch {
    // Best effort cleanup only.
  }
}

function inferWeatherIcon(output: string): string {
  const text = output.toLowerCase();
  if (hasAny(text, ['⛈', '🌩', 'thunder', 'storm', '雷', '暴风'])) return 'storm';
  if (hasAny(text, ['❄', '🌨', 'snow', 'sleet', '雪', '雨夹雪'])) return 'snow';
  if (hasAny(text, ['☔', '🌧', 'rain', 'drizzle', 'shower', '雨', '阵雨'])) return 'rain';
  if (hasAny(text, ['☀', '🌞', 'sunny', 'sun', 'clear', '晴'])) return 'sun';
  if (hasAny(text, ['⛅', '🌤', '🌥', '☁', '🌫', 'cloud', 'overcast', 'fog', '阴', '云', '雾'])) {
    return 'cloud';
  }
  return 'cloud';
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

export const __test = { inferWeatherIcon };
