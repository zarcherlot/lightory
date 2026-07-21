import type { RoleTaskConsoleEntry } from './roleTaskConsoleTypes.js';

export const LIGHTORY_CONSOLE_TRANSCRIPT_KEY = 'lightory.console.transcript.v1';

export interface ConsoleTranscriptSnapshot {
  updatedAt: string;
  entries: RoleTaskConsoleEntry[];
  text: string;
}

export type ConsoleEntrySequencer = (entries: RoleTaskConsoleEntry[]) => RoleTaskConsoleEntry[];

declare global {
  interface Window {
    __lightoryConsoleTranscript?: ConsoleTranscriptSnapshot;
  }
}

export function createConsoleTranscriptSnapshot(
  entries: RoleTaskConsoleEntry[],
  now: () => Date = () => new Date(),
): ConsoleTranscriptSnapshot {
  const normalizedEntries = entries.map((entry) => ({ ...entry }));
  return {
    updatedAt: now().toISOString(),
    entries: normalizedEntries,
    text: normalizedEntries.map(formatTranscriptLine).join('\n\n'),
  };
}

export function publishConsoleTranscript(
  entries: RoleTaskConsoleEntry[],
  target: Window | undefined = typeof window === 'undefined' ? undefined : window,
): ConsoleTranscriptSnapshot | null {
  if (!target) return null;
  const snapshot = createConsoleTranscriptSnapshot(entries);
  target.__lightoryConsoleTranscript = snapshot;
  try {
    target.localStorage.setItem(LIGHTORY_CONSOLE_TRANSCRIPT_KEY, JSON.stringify(snapshot));
  } catch {
    // The in-memory window field is enough for Playwright even if storage is unavailable.
  }
  return snapshot;
}

export function createConsoleEntrySequencer(): ConsoleEntrySequencer {
  const seenOrder = new Map<string, number>();
  let nextOrder = 0;
  return (entries) =>
    entries
      .map((entry, sourceIndex) => {
        const key = keyForEntry(entry);
        let order = seenOrder.get(key);
        if (order === undefined) {
          order = ++nextOrder;
          seenOrder.set(key, order);
        }
        return { entry, order, sourceIndex };
      })
      .sort((a, b) => a.order - b.order || a.sourceIndex - b.sourceIndex)
      .map((item) => item.entry);
}

function formatTranscriptLine(entry: RoleTaskConsoleEntry): string {
  return [
    `[${entry.roleId}]`,
    `status=${entry.status}`,
    `stream=${entry.stream}`,
    entry.content.trim(),
  ]
    .filter(Boolean)
    .join(' ');
}

function keyForEntry(entry: RoleTaskConsoleEntry): string {
  return `${entry.id}:${entry.runId}:${entry.roleId}`;
}
