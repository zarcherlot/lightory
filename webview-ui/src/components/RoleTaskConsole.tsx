import { useEffect, useRef } from 'react';

import { getRoleDefinition } from '../roles.js';

export interface RoleTaskConsoleEntry {
  id: number;
  runId: string;
  roleId: string;
  status: 'started' | 'running' | 'done' | 'error';
  stream: 'system' | 'stdout' | 'stderr';
  content: string;
}

interface RoleTaskConsoleProps {
  entries: RoleTaskConsoleEntry[];
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export function RoleTaskConsole({
  entries,
  isSettingsOpen,
  onToggleSettings,
}: RoleTaskConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries]);

  return (
    <section className="absolute right-0 top-0 bottom-0 z-[25] w-360 max-w-[42vw] bg-bg-dark border-l-2 border-border shadow-pixel flex flex-col">
      <div className="h-32 px-12 flex items-center justify-between border-b-2 border-border bg-bg">
        <span className="text-sm text-text">Console</span>
        <div className="flex items-center gap-8">
          <span className="text-2xs text-text-muted">Role task output</span>
          <button
            type="button"
            className={`w-20 h-20 border-2 flex items-center justify-center text-sm leading-none cursor-pointer ${
              isSettingsOpen
                ? 'bg-active-bg border-accent text-text'
                : 'bg-btn-bg border-transparent text-text-muted hover:bg-btn-hover hover:text-text'
            }`}
            onClick={onToggleSettings}
            title="Settings"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-12 py-8 text-2xs leading-tight">
        {entries.length === 0 ? (
          <div className="text-text-muted">Drop a role into the room to run its markdown task.</div>
        ) : (
          entries.map((entry) => (
            <pre
              key={entry.id}
              className={`m-0 whitespace-pre-wrap break-words ${
                entry.stream === 'stderr'
                  ? 'text-status-error'
                  : entry.stream === 'system'
                    ? 'text-status-success'
                    : 'text-text'
              }`}
            >
              {getRoleSpeakerName(entry.roleId)}：{formatConsoleContent(entry.content)}
            </pre>
          ))
        )}
      </div>
    </section>
  );
}

function getRoleSpeakerName(roleId: string): string {
  return getRoleDefinition(roleId)?.name ?? roleId;
}

function formatConsoleContent(content: string): string {
  return content.replace(/^\s*(?:[^：:\n]{1,16}卡|趣味广播)[：:]\s*/u, '');
}
