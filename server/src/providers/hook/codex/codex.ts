import * as path from 'path';

import type { AgentEvent, HookProvider } from '../../../../../core/src/provider.js';
import {
  BASH_COMMAND_DISPLAY_MAX_LENGTH,
  TASK_DESCRIPTION_DISPLAY_MAX_LENGTH,
} from '../../../constants.js';

type NormalizedHook = { sessionId: string; event: AgentEvent };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function basename(value: unknown): string {
  return typeof value === 'string' ? path.basename(value) : '';
}

function getSessionId(raw: Record<string, unknown>): string | undefined {
  const session = asRecord(raw.session);
  return firstString(raw.session_id, raw.sessionId, raw.conversation_id, raw.thread_id, session.id);
}

function getCwd(raw: Record<string, unknown>): string | undefined {
  const session = asRecord(raw.session);
  return firstString(raw.cwd, raw.directory, raw.project_dir, raw.workspace, session.cwd, session.directory);
}

function getTool(raw: Record<string, unknown>): { id: string; name: string; input: unknown } {
  const tool = asRecord(raw.tool);
  const call = asRecord(raw.call);
  const action = asRecord(raw.action);
  const input = raw.tool_input ?? raw.input ?? raw.arguments ?? tool.input ?? call.input ?? action.input ?? {};

  return {
    id:
      firstString(raw.tool_id, raw.toolId, raw.call_id, raw.callId, tool.id, call.id, action.id) ??
      `hook-${Date.now()}`,
    name:
      firstString(raw.tool_name, raw.toolName, raw.name, tool.name, call.name, action.name) ?? 'tool',
    input,
  };
}

function normalizeHookEvent(raw: Record<string, unknown>): NormalizedHook | null {
  const eventName = firstString(raw.hook_event_name, raw.event, raw.type, raw.name);
  const sessionId = getSessionId(raw);
  if (!eventName || !sessionId) return null;

  switch (eventName) {
    case 'session.created':
    case 'session.started':
    case 'session.start':
    case 'SessionStart':
    case 'codex.session_start':
      return {
        sessionId,
        event: {
          kind: 'sessionStart',
          source: 'codex',
          transcriptPath: firstString(raw.transcript_path, raw.transcriptPath),
          cwd: getCwd(raw),
        },
      };

    case 'session.idle':
    case 'session.waiting':
    case 'turn.idle':
    case 'codex.turn_waiting':
      return { sessionId, event: { kind: 'turnEnd', awaitingInput: true } };

    case 'turn.completed':
    case 'turn.complete':
    case 'turn.end':
    case 'Stop':
    case 'codex.turn_end':
      return { sessionId, event: { kind: 'turnEnd' } };

    case 'session.error':
    case 'session.deleted':
    case 'session.ended':
    case 'session.end':
    case 'SessionEnd':
    case 'codex.session_end':
      return {
        sessionId,
        event: {
          kind: 'sessionEnd',
          reason: firstString(raw.reason, raw.error, raw.message) ?? eventName,
        },
      };

    case 'permission.requested':
    case 'permission.asked':
    case 'PermissionRequest':
    case 'codex.permission_request':
      return { sessionId, event: { kind: 'permissionRequest' } };

    case 'permission.resolved':
    case 'permission.replied':
      return { sessionId, event: { kind: 'turnEnd' } };

    case 'tool.start':
    case 'tool.started':
    case 'tool.call.start':
    case 'tool.before':
    case 'PreToolUse':
    case 'codex.tool_start': {
      const tool = getTool(raw);
      const input = asRecord(tool.input);
      return {
        sessionId,
        event: {
          kind: 'toolStart',
          toolId: tool.id,
          toolName: tool.name,
          input: tool.input,
          runInBackground: input.run_in_background === true || input.background === true,
        },
      };
    }

    case 'tool.end':
    case 'tool.completed':
    case 'tool.call.end':
    case 'tool.after':
    case 'PostToolUse':
    case 'PostToolUseFailure':
    case 'codex.tool_end': {
      const tool = getTool(raw);
      return { sessionId, event: { kind: 'toolEnd', toolId: tool.id } };
    }

    case 'message.created':
    case 'message.updated':
    case 'file.edited':
      return null;

    default:
      return null;
  }
}

export function formatToolStatus(toolName: string, input?: unknown): string {
  const inp = asRecord(input);
  switch (toolName) {
    case 'read':
    case 'Read':
    case 'open_file':
      return `Reading ${basename(inp.file ?? inp.path ?? inp.file_path)}`;
    case 'edit':
    case 'apply_patch':
    case 'patch':
    case 'write':
    case 'Edit':
    case 'Write':
      return `Editing ${basename(inp.file ?? inp.path ?? inp.file_path)}`;
    case 'bash':
    case 'shell':
    case 'exec':
    case 'exec_command':
    case 'Bash': {
      const cmd = firstString(inp.command, inp.cmd) ?? '';
      return `Running: ${cmd.length > BASH_COMMAND_DISPLAY_MAX_LENGTH ? cmd.slice(0, BASH_COMMAND_DISPLAY_MAX_LENGTH) + '\u2026' : cmd}`;
    }
    case 'grep':
    case 'glob':
    case 'search':
    case 'rg':
      return 'Searching code';
    case 'webfetch':
    case 'websearch':
    case 'web_fetch':
    case 'web_search':
      return 'Searching the web';
    case 'task':
    case 'agent':
    case 'subagent': {
      const desc = firstString(inp.description, inp.prompt, inp.task) ?? '';
      return desc
        ? `Subtask: ${desc.length > TASK_DESCRIPTION_DISPLAY_MAX_LENGTH ? desc.slice(0, TASK_DESCRIPTION_DISPLAY_MAX_LENGTH) + '\u2026' : desc}`
        : 'Running subtask';
    }
    default:
      return `Using ${toolName}`;
  }
}

async function installHooks(): Promise<void> {
  console.log(
    '[Pixel Agents] Codex provider is ready. Configure Codex hooks to POST JSON events to /api/hooks/codex using the server token.',
  );
}

async function uninstallHooks(): Promise<void> {
  console.log('[Pixel Agents] Remove the Codex hook entries that POST to /api/hooks/codex.');
}

async function areHooksInstalled(): Promise<boolean> {
  return false;
}

function buildLaunchCommand(
  sessionId: string,
  cwd: string,
  opts?: { bypassPermissions?: boolean },
): { command: string; args: string[]; env?: Record<string, string> } {
  const args: string[] = [];
  if (opts?.bypassPermissions) args.push('--dangerously-bypass-approvals-and-sandbox');
  return { command: 'codex', args, env: { CODEX_SESSION_ID: sessionId, PWD: cwd } };
}

export const codexProvider: HookProvider = {
  kind: 'hook',
  id: 'codex',
  displayName: 'Codex',
  protocolVersion: 1,

  normalizeHookEvent,

  installHooks,
  uninstallHooks,
  areHooksInstalled,

  formatToolStatus,
  permissionExemptTools: new Set(['task', 'agent', 'subagent']),
  subagentToolNames: new Set(['task', 'agent', 'subagent']),
  readingTools: new Set([
    'read',
    'Read',
    'open_file',
    'grep',
    'glob',
    'search',
    'rg',
    'webfetch',
    'websearch',
    'web_fetch',
    'web_search',
  ]),
  terminalNamePrefix: 'codex',
  buildLaunchCommand,
};
