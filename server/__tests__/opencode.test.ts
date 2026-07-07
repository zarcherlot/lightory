import { describe, expect, it } from 'vitest';

import { opencodeProvider } from '../src/providers/hook/opencode/opencode.js';

describe('opencodeProvider', () => {
  it('has hook provider identity', () => {
    expect(opencodeProvider.kind).toBe('hook');
    expect(opencodeProvider.id).toBe('opencode');
    expect(opencodeProvider.displayName).toBe('OpenCode');
    expect(opencodeProvider.protocolVersion).toBe(1);
  });

  it('normalizes session.created to hooks-only sessionStart', () => {
    const result = opencodeProvider.normalizeHookEvent({
      hook_event_name: 'session.created',
      session_id: 'sess-1',
      cwd: '/work/project',
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event.kind).toBe('sessionStart');
    if (result?.event.kind === 'sessionStart') {
      expect(result.event.source).toBe('opencode');
      expect(result.event.cwd).toBe('/work/project');
      expect(result.event.transcriptPath).toBeUndefined();
    }
  });

  it('normalizes tool.execute.before to toolStart', () => {
    const result = opencodeProvider.normalizeHookEvent({
      hook_event_name: 'tool.execute.before',
      session: { id: 'sess-1' },
      tool: { id: 'tool-1', name: 'read' },
      input: { file: '/work/project/src/index.ts' },
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event.kind).toBe('toolStart');
    if (result?.event.kind === 'toolStart') {
      expect(result.event.toolId).toBe('tool-1');
      expect(result.event.toolName).toBe('read');
      expect(result.event.input).toEqual({ file: '/work/project/src/index.ts' });
    }
  });

  it('normalizes tool.execute.after to toolEnd', () => {
    const result = opencodeProvider.normalizeHookEvent({
      hook_event_name: 'tool.execute.after',
      session_id: 'sess-1',
      tool_id: 'tool-1',
    });

    expect(result?.sessionId).toBe('sess-1');
    expect(result?.event).toEqual({ kind: 'toolEnd', toolId: 'tool-1' });
  });

  it('normalizes permission and idle events', () => {
    const permission = opencodeProvider.normalizeHookEvent({
      hook_event_name: 'permission.asked',
      session_id: 'sess-1',
    });
    const idle = opencodeProvider.normalizeHookEvent({
      hook_event_name: 'session.idle',
      session_id: 'sess-1',
    });

    expect(permission?.event.kind).toBe('permissionRequest');
    expect(idle?.event.kind).toBe('turnEnd');
    if (idle?.event.kind === 'turnEnd') {
      expect(idle.event.awaitingInput).toBe(true);
    }
  });

  it('formats common OpenCode tool statuses', () => {
    expect(opencodeProvider.formatToolStatus('read', { file: '/a/b.ts' })).toBe('Reading b.ts');
    expect(opencodeProvider.formatToolStatus('edit', { path: '/a/b.ts' })).toBe('Editing b.ts');
    expect(opencodeProvider.formatToolStatus('bash', { command: 'npm test' })).toBe(
      'Running: npm test',
    );
  });
});
