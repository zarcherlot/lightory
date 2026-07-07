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
  return firstString(raw.session_id, raw.sessionID, raw.sessionId, session.id);
}

function getCwd(raw: Record<string, unknown>): string | undefined {
  const session = asRecord(raw.session);
  return firstString(raw.cwd, raw.directory, raw.project_dir, session.cwd, session.directory);
}

function getTool(raw: Record<string, unknown>): { id: string; name: string; input: unknown } {
  const tool = asRecord(raw.tool);
  const call = asRecord(raw.call);
  const input = raw.tool_input ?? raw.input ?? tool.input ?? call.input ?? {};
  return {
    id: firstString(raw.tool_id, raw.toolId, tool.id, call.id) ?? `hook-${Date.now()}`,
    name: firstString(raw.tool_name, raw.toolName, tool.name, call.name) ?? 'tool',
    input,
  };
}

function normalizeHookEvent(raw: Record<string, unknown>): NormalizedHook | null {
  const eventName = firstString(raw.hook_event_name, raw.event, raw.type);
  const sessionId = getSessionId(raw);
  if (!eventName || !sessionId) return null;

  switch (eventName) {
    case 'session.created':
    case 'session.updated':
    case 'session.init':
    case 'SessionStart':
      return {
        sessionId,
        event: { kind: 'sessionStart', source: 'opencode', cwd: getCwd(raw) },
      };

    case 'session.idle':
    case 'session.status.idle':
      return { sessionId, event: { kind: 'turnEnd', awaitingInput: true } };

    case 'session.error':
    case 'session.deleted':
    case 'session.ended':
    case 'SessionEnd':
      return {
        sessionId,
        event: {
          kind: 'sessionEnd',
          reason: firstString(raw.reason, raw.error) ?? eventName,
        },
      };

    case 'permission.asked':
    case 'permission.requested':
    case 'PermissionRequest':
      return { sessionId, event: { kind: 'permissionRequest' } };

    case 'permission.replied':
    case 'permission.resolved':
      return { sessionId, event: { kind: 'turnEnd' } };

    case 'tool.execute.before':
    case 'tool.before':
    case 'PreToolUse': {
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

    case 'tool.execute.after':
    case 'tool.after':
    case 'PostToolUse':
    case 'PostToolUseFailure': {
      const tool = getTool(raw);
      return { sessionId, event: { kind: 'toolEnd', toolId: tool.id } };
    }

    case 'message.updated':
    case 'message.created':
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
      return `Reading ${basename(inp.file ?? inp.path ?? inp.file_path)}`;
    case 'edit':
    case 'patch':
    case 'Edit':
    case 'Write':
      return `Editing ${basename(inp.file ?? inp.path ?? inp.file_path)}`;
    case 'bash':
    case 'shell':
    case 'Bash': {
      const cmd = firstString(inp.command, inp.cmd) ?? '';
      return `Running: ${cmd.length > BASH_COMMAND_DISPLAY_MAX_LENGTH ? cmd.slice(0, BASH_COMMAND_DISPLAY_MAX_LENGTH) + '\u2026' : cmd}`;
    }
    case 'grep':
    case 'glob':
      return 'Searching code';
    case 'webfetch':
    case 'websearch':
      return 'Searching the web';
    case 'task':
    case 'agent': {
      const desc = firstString(inp.description, inp.prompt) ?? '';
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
    '[Pixel Agents] OpenCode hooks use the plugin in opencode/pixel-agents-opencode.ts. Copy or symlink it into .opencode/plugins/.',
  );
}

async function uninstallHooks(): Promise<void> {
  console.log(
    '[Pixel Agents] Remove pixel-agents-opencode.ts from .opencode/plugins/ to disable hooks.',
  );
}

async function areHooksInstalled(): Promise<boolean> {
  return false;
}

export const opencodeProvider: HookProvider = {
  kind: 'hook',
  id: 'opencode',
  displayName: 'OpenCode',
  protocolVersion: 1,

  normalizeHookEvent,

  installHooks,
  uninstallHooks,
  areHooksInstalled,

  formatToolStatus,
  permissionExemptTools: new Set(['task', 'agent']),
  subagentToolNames: new Set(['task', 'agent']),
  readingTools: new Set(['read', 'grep', 'glob', 'webfetch', 'websearch']),
  terminalNamePrefix: 'opencode',
};
