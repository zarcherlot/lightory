import { spawn } from 'child_process';
import * as fs from 'fs';

import type { HookProvider } from '../../../core/src/provider.js';
import { buildRoleTaskCommand } from '../roleTaskRunner.js';

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

const DEFAULT_LLM_ROLE_TIMEOUT_MS = 120_000;

export function createLlmRoleRunner(options: LlmRoleRunnerOptions): LlmRoleRunner {
  return async (request) => {
    const runId = `${request.roleId}-${Date.now().toString(36)}`;
    const command = buildRoleTaskCommand(options.provider, request.prompt, options.cwd, runId);
    if (!command) {
      throw new Error(`Provider ${options.provider.displayName} cannot launch tutor role tasks.`);
    }

    return new Promise((resolve, reject) => {
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
        cleanupOutput(command.outputPath);
        reject(new Error('Tutor role task timed out.'));
      }, options.timeoutMs ?? DEFAULT_LLM_ROLE_TIMEOUT_MS);

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
        cleanupOutput(command.outputPath);
        reject(error);
      });
      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const output = readOutput(command.outputPath) || stdout.trim();
        cleanupOutput(command.outputPath);
        if (code !== 0) {
          reject(new Error(stderr.trim() || output || `Tutor role task exited with code ${code}.`));
          return;
        }
        resolve(output);
      });
    });
  };
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
    // Best effort cleanup.
  }
}
