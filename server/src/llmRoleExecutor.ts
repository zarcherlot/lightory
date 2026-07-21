import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { HookProvider } from '../../core/src/provider.js';

const CODEX_ROLE_TASK_ENV = {
  bin: 'LIGHTORY_CODEX_BIN',
  modelProvider: 'LIGHTORY_CODEX_MODEL_PROVIDER',
  model: 'LIGHTORY_CODEX_MODEL',
  reasoningEffort: 'LIGHTORY_CODEX_REASONING_EFFORT',
  providerName: 'LIGHTORY_CODEX_PROVIDER_NAME',
  providerBaseUrl: 'LIGHTORY_CODEX_PROVIDER_BASE_URL',
  providerWireApi: 'LIGHTORY_CODEX_PROVIDER_WIRE_API',
  providerRequiresOpenAiAuth: 'LIGHTORY_CODEX_PROVIDER_REQUIRES_OPENAI_AUTH',
} as const;

export interface LlmRoleRequest {
  roleId: string;
  prompt: string;
}

export type LlmRoleRunner = (request: LlmRoleRequest) => Promise<string>;

export interface LlmRoleRunnerOptions {
  provider: HookProvider;
  cwd: string;
  timeoutMs?: number;
}

export interface CommandSpec {
  command: string;
  args: string[];
  env?: Record<string, string>;
  displayCommand?: string;
  input?: string;
  outputPath?: string;
}

export type LlmRoleExecutionResult =
  | { ok: true; output: string }
  | { ok: false; error: string; errorCode?: string; exitCode?: number | null };

export interface ExecuteLlmRolePromptOptions {
  provider: HookProvider;
  cwd: string;
  runId: string;
  prompt: string;
  timeoutMs: number;
  timeoutError: string;
  unavailableError: string;
  onStderr?: (content: string) => void;
}

export function createLlmRoleRunner(options: LlmRoleRunnerOptions): LlmRoleRunner {
  return async (request) => {
    const result = await executeLlmRolePrompt({
      provider: options.provider,
      cwd: options.cwd,
      runId: `${request.roleId}-${Date.now().toString(36)}`,
      prompt: request.prompt,
      timeoutMs: options.timeoutMs ?? 120_000,
      timeoutError: 'LLM role task timed out.',
      unavailableError: `Provider ${options.provider.displayName} cannot launch LLM role tasks.`,
    });
    if (!result.ok) throw new Error(result.error);
    return result.output;
  };
}

export function executeLlmRolePrompt(
  options: ExecuteLlmRolePromptOptions,
): Promise<LlmRoleExecutionResult> {
  const command = buildLlmRoleCommand(options.provider, options.prompt, options.cwd, options.runId);
  if (!command) return Promise.resolve({ ok: false, error: options.unavailableError });

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
      cleanupLlmRoleOutput(command.outputPath);
      resolve({ ok: false, error: options.timeoutError });
    }, options.timeoutMs);

    if (command.input !== undefined) child.stdin.end(command.input);
    else child.stdin.end();

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      const content = chunk.toString();
      stderr += content;
      options.onStderr?.(content);
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanupLlmRoleOutput(command.outputPath);
      resolve({
        ok: false,
        error: error.message,
        errorCode: 'code' in error ? String((error as NodeJS.ErrnoException).code) : undefined,
      });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const output = readLlmRoleOutput(command.outputPath) || stdout.trim();
      cleanupLlmRoleOutput(command.outputPath);
      if (code !== 0) {
        resolve({
          ok: false,
          error: stderr.trim() || output || `LLM role task exited with code ${code ?? 'unknown'}.`,
          exitCode: code,
        });
        return;
      }
      resolve({ ok: true, output });
    });
  });
}

export function buildLlmRoleCommand(
  provider: HookProvider,
  prompt: string,
  cwd: string,
  runId: string,
): CommandSpec | null {
  switch (provider.id) {
    case 'claude':
      return { command: 'claude', args: [prompt] };
    case 'codex':
      const codexCommand = process.env[CODEX_ROLE_TASK_ENV.bin] ?? 'codex';
      const outputPath = path.join(os.tmpdir(), `lightory-${runId}-last-message.txt`);
      return {
        command: codexCommand,
        args: [
          'exec',
          ...buildCodexRoleTaskIsolationArgs(),
          '--color',
          'never',
          '--sandbox',
          'read-only',
          ...buildCodexRoleTaskConfigArgs(),
          '--cd',
          cwd,
          '--output-last-message',
          outputPath,
          '-',
        ],
        env: buildRoleTaskEnv({
          CODEX_SESSION_ID: `pixel-role-${runId}`,
          LIGHTORY_ROLE_TASK: '1',
          LIGHTORY_ROLE_TASK_RUN_ID: runId,
          PWD: cwd,
        }),
        input: prompt,
        outputPath,
        displayCommand: codexCommand,
      };
    case 'opencode':
      const opencodeCommand = process.env['LIGHTORY_OPENCODE_BIN'] ?? 'opencode';
      return {
        command: opencodeCommand,
        args: ['run', prompt],
        env: buildRoleTaskEnv({
          LIGHTORY_ROLE_TASK: '1',
          LIGHTORY_ROLE_TASK_RUN_ID: runId,
          PWD: cwd,
        }),
        displayCommand: opencodeCommand,
      };
    default:
      return null;
  }
}

export function buildCodexRoleTaskIsolationArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  return env[CODEX_ROLE_TASK_ENV.modelProvider] ? ['--ignore-user-config'] : [];
}

export function buildRoleTaskEnv(overrides: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') env[key] = value;
  }
  Object.assign(env, overrides);
  for (const key of Object.keys(env)) {
    if (key.startsWith('CODEX_') && key !== 'CODEX_SESSION_ID') {
      delete env[key];
    }
  }
  return env;
}

export function buildCodexRoleTaskConfigArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  const args: string[] = [];
  const addConfig = (value: string | undefined, key: string, format = tomlString) => {
    if (!value) return;
    args.push('-c', `${key}=${format(value)}`);
  };

  const providerId = env[CODEX_ROLE_TASK_ENV.modelProvider];
  addConfig(providerId, 'model_provider');
  addConfig(env[CODEX_ROLE_TASK_ENV.model], 'model');
  addConfig(env[CODEX_ROLE_TASK_ENV.reasoningEffort] ?? 'low', 'model_reasoning_effort');

  if (providerId) {
    addConfig(env[CODEX_ROLE_TASK_ENV.providerName], `model_providers.${providerId}.name`);
    addConfig(env[CODEX_ROLE_TASK_ENV.providerBaseUrl], `model_providers.${providerId}.base_url`);
    addConfig(env[CODEX_ROLE_TASK_ENV.providerWireApi], `model_providers.${providerId}.wire_api`);
    addConfig(
      env[CODEX_ROLE_TASK_ENV.providerRequiresOpenAiAuth],
      `model_providers.${providerId}.requires_openai_auth`,
      tomlBoolean,
    );
  }

  return args;
}

function readLlmRoleOutput(outputPath: string | undefined): string {
  if (!outputPath || !fs.existsSync(outputPath)) return '';
  return fs.readFileSync(outputPath, 'utf8').trim();
}

function cleanupLlmRoleOutput(outputPath: string | undefined): void {
  if (!outputPath) return;
  try {
    fs.rmSync(outputPath, { force: true });
  } catch {
    // Best effort cleanup only.
  }
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function tomlBoolean(value: string): string {
  return /^(1|true|yes)$/i.test(value) ? 'true' : 'false';
}
