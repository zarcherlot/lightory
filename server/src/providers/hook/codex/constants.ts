export const CODEX_HOOK_SCRIPT_NAME = 'codex-hook.js';

export const CODEX_HOOK_EVENTS = [
  'SessionStart',
  'Stop',
  'PermissionRequest',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PreCompact',
  'PostCompact',
  'SubagentStart',
  'SubagentStop',
] as const;
