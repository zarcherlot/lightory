import { describe, expect, it } from 'vitest';

import { codexProvider } from '../src/providers/hook/codex/codex.js';

describe('codexProvider', () => {
  it('has hook provider identity', () => {
    expect(codexProvider.kind).toBe('hook');
    expect(codexProvider.id).toBe('codex');
    expect(codexProvider.displayName).toBe('Codex');
    expect(codexProvider.protocolVersion).toBe(1);
  });

  it('normalizes session start events', () => {
    const result = codexProvider.normalizeHookEvent({
      hook_event_name: 'session.started',
      session_id: 'sess-1',
      cwd: '/work/project',
      transcript_path: '/tmp/codex/sess-1.jsonl',
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event.kind).toBe('sessionStart');
    if (result?.event.kind === 'sessionStart') {
      expect(result.event.source).toBe('codex');
      expect(result.event.cwd).toBe('/work/project');
      expect(result.event.transcriptPath).toBe('/tmp/codex/sess-1.jsonl');
    }
  });

  it('normalizes tool start events with camelCase fields', () => {
    const result = codexProvider.normalizeHookEvent({
      type: 'tool.start',
      session: { id: 'sess-1' },
      tool: { id: 'tool-1', name: 'exec_command' },
      input: { command: 'npm test' },
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event.kind).toBe('toolStart');
    if (result?.event.kind === 'toolStart') {
      expect(result.event.toolId).toBe('tool-1');
      expect(result.event.toolName).toBe('exec_command');
      expect(result.event.input).toEqual({ command: 'npm test' });
    }
  });

  it('normalizes Codex CLI tool_use_id fields', () => {
    const result = codexProvider.normalizeHookEvent({
      hook_event_name: 'PreToolUse',
      session_id: 'sess-1',
      tool_name: 'Bash',
      tool_input: { command: 'pwd' },
      tool_use_id: 'call-1',
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event.kind).toBe('toolStart');
    if (result?.event.kind === 'toolStart') {
      expect(result.event.toolId).toBe('call-1');
      expect(result.event.toolName).toBe('Bash');
      expect(result.event.input).toEqual({ command: 'pwd' });
    }
  });

  it('normalizes tool end events', () => {
    const result = codexProvider.normalizeHookEvent({
      event: 'tool.completed',
      sessionId: 'sess-1',
      toolId: 'tool-1',
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event).toEqual({ kind: 'toolEnd', toolId: 'tool-1' });
  });

  it('normalizes permission, idle, and completed turn events', () => {
    const permission = codexProvider.normalizeHookEvent({
      hook_event_name: 'permission.requested',
      session_id: 'sess-1',
    });
    const idle = codexProvider.normalizeHookEvent({
      hook_event_name: 'turn.idle',
      session_id: 'sess-1',
    });
    const complete = codexProvider.normalizeHookEvent({
      hook_event_name: 'turn.completed',
      session_id: 'sess-1',
    });

    expect(permission?.event.kind).toBe('permissionRequest');
    expect(idle?.event.kind).toBe('turnEnd');
    if (idle?.event.kind === 'turnEnd') {
      expect(idle.event.awaitingInput).toBe(true);
    }
    expect(complete?.event).toEqual({ kind: 'turnEnd' });
  });

  it('formats common Codex tool statuses', () => {
    expect(codexProvider.formatToolStatus('read', { path: '/a/b.ts' })).toBe('Reading b.ts');
    expect(codexProvider.formatToolStatus('apply_patch', { file: '/a/b.ts' })).toBe(
      'Editing b.ts',
    );
    expect(codexProvider.formatToolStatus('exec_command', { command: 'npm test' })).toBe(
      'Running: npm test',
    );
  });

  it('builds a codex launch command', () => {
    expect(codexProvider.buildLaunchCommand?.('sess-1', '/work/project')).toEqual({
      command: 'codex',
      args: [],
      env: { CODEX_SESSION_ID: 'sess-1', PWD: '/work/project' },
    });
  });
});
