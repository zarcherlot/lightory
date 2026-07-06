import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';

import type { StateAdapter } from '../../core/src/adapter.js';
import { AgentRuntime } from '../src/agentRuntime.js';
import { AgentStateStore } from '../src/agentStateStore.js';
import { codexProvider } from '../src/providers/hook/codex/codex.js';

function createMockAdapter(): StateAdapter {
  return {
    loadAgents: vi.fn(() => []),
    saveAgents: vi.fn(),
    loadSeats: vi.fn(() => ({})),
    saveSeats: vi.fn(),
    getSetting: vi.fn(<T>(_key: string, fallback: T): T => fallback),
    setSetting: vi.fn<(key: string, value: unknown) => void>(),
  };
}

describe('AgentRuntime', () => {
  it('creates a hooks-only Codex agent for sessions in the server cwd', () => {
    const store = new AgentStateStore();
    store.setAdapter(createMockAdapter());
    const runtime = new AgentRuntime(store, codexProvider);
    const sessionId = 'codex-runtime-session';

    runtime.handleHookEvent('codex', {
      hook_event_name: 'SessionStart',
      session_id: sessionId,
      cwd: process.cwd(),
      source: 'startup',
    });
    runtime.handleHookEvent('codex', {
      hook_event_name: 'PreToolUse',
      session_id: sessionId,
      cwd: process.cwd(),
      tool_name: 'Bash',
      tool_input: { command: 'pwd' },
      tool_use_id: 'tool-1',
    });

    expect(store.size).toBe(1);
    const agent = [...store.values()][0];
    expect(agent?.sessionId).toBe(sessionId);
    expect(agent?.hooksOnly).toBe(true);
    expect(agent?.currentHookToolId).toBe('tool-1');

    runtime.dispose();
  });

  it('tracks Codex sessions by hook cwd even when transcript_path is elsewhere', () => {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pxl-codex-runtime-'));
    const transcriptPath = path.join(tmpBase, 'codex-session.jsonl');
    fs.writeFileSync(transcriptPath, '');

    const store = new AgentStateStore();
    store.setAdapter(createMockAdapter());
    const runtime = new AgentRuntime(store, codexProvider);
    const sessionId = 'codex-runtime-transcript-session';

    try {
      runtime.handleHookEvent('codex', {
        hook_event_name: 'SessionStart',
        session_id: sessionId,
        transcript_path: transcriptPath,
        cwd: process.cwd(),
        source: 'startup',
      });
      runtime.handleHookEvent('codex', {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: transcriptPath,
        cwd: process.cwd(),
        tool_name: 'Bash',
        tool_input: { command: 'pwd' },
        tool_use_id: 'tool-1',
      });

      expect(store.size).toBe(1);
      const agent = [...store.values()][0];
      expect(agent?.sessionId).toBe(sessionId);
      expect(agent?.jsonlFile).toBe(transcriptPath);
    } finally {
      runtime.dispose();
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });
});
