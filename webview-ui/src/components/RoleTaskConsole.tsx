import { useEffect, useRef } from 'react';

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
}

export function RoleTaskConsole({ entries }: RoleTaskConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries]);

  return (
    <section className="absolute left-0 right-0 bottom-0 z-[25] h-190 bg-bg-dark border-t-2 border-border shadow-pixel flex flex-col">
      <div className="h-32 px-12 flex items-center justify-between border-b-2 border-border bg-bg">
        <span className="text-sm text-text">Console</span>
        <span className="text-2xs text-text-muted">Role task output</span>
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
              {entry.stream === 'system' ? `[${entry.roleId}] ` : ''}
              {entry.content}
            </pre>
          ))
        )}
      </div>
    </section>
  );
}
