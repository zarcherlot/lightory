import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

type PluginContext = {
  directory?: string;
  worktree?: string;
  client?: {
    app?: {
      log?: (input: { body: Record<string, unknown> }) => Promise<unknown>;
    };
  };
};

type ServerConfig = {
  port: number;
  pid: number;
  token: string;
};

const PROVIDER_ID = 'opencode';
const SERVER_JSON = path.join(os.homedir(), '.lightory', 'server.json');

function readServerConfig(): ServerConfig | null {
  try {
    return JSON.parse(fs.readFileSync(SERVER_JSON, 'utf8')) as ServerConfig;
  } catch {
    return null;
  }
}

function pickSessionId(input: Record<string, unknown>): string | undefined {
  const session =
    typeof input.session === 'object' && input.session
      ? (input.session as Record<string, unknown>)
      : {};
  const values = [input.session_id, input.sessionID, input.sessionId, session.id];
  return values.find((value): value is string => typeof value === 'string' && value.length > 0);
}

async function postLightoryEvent(
  payload: Record<string, unknown>,
  ctx: PluginContext,
): Promise<void> {
  const config = readServerConfig();
  if (!config) return;

  const sessionId = pickSessionId(payload);
  if (!sessionId) return;

  try {
    await fetch(`http://127.0.0.1:${config.port}/api/hooks/${PROVIDER_ID}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        cwd: ctx.worktree ?? ctx.directory,
        lightory_role_task: process.env.LIGHTORY_ROLE_TASK === '1',
        lightory_role_task_run_id: process.env.LIGHTORY_ROLE_TASK_RUN_ID,
        ...payload,
        session_id: sessionId,
      }),
    });
  } catch (error) {
    await ctx.client?.app?.log?.({
      body: {
        service: 'lightory',
        level: 'debug',
        message: 'failed to deliver hook event',
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function toolPayload(
  hook_event_name: 'tool.execute.before' | 'tool.execute.after',
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): Record<string, unknown> {
  const toolName = typeof input.tool === 'string' ? input.tool : 'tool';
  const args = typeof output.args === 'object' && output.args ? output.args : {};
  return {
    ...input,
    hook_event_name,
    tool_name: toolName,
    tool_input: args,
  };
}

export const LightoryOpenCode = async (ctx: PluginContext) => {
  return {
    event: async ({ event }: { event: Record<string, unknown> }) => {
      if (typeof event?.type !== 'string') return;
      await postLightoryEvent(
        {
          ...event,
          hook_event_name: event.type,
        },
        ctx,
      );
    },

    'tool.execute.before': async (
      input: Record<string, unknown>,
      output: Record<string, unknown>,
    ) => {
      await postLightoryEvent(toolPayload('tool.execute.before', input, output), ctx);
    },

    'tool.execute.after': async (
      input: Record<string, unknown>,
      output: Record<string, unknown>,
    ) => {
      await postLightoryEvent(toolPayload('tool.execute.after', input, output), ctx);
    },

    'permission.asked': async (input: Record<string, unknown>) => {
      await postLightoryEvent({ ...input, hook_event_name: 'permission.asked' }, ctx);
    },

    'permission.replied': async (input: Record<string, unknown>) => {
      await postLightoryEvent({ ...input, hook_event_name: 'permission.replied' }, ctx);
    },
  };
};
