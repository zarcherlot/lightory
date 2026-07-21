import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  createConsoleEntrySequencer,
  createConsoleTranscriptSnapshot,
  LIGHTORY_CONSOLE_TRANSCRIPT_KEY,
  publishConsoleTranscript,
} from '../src/components/consoleTranscript.js';
import type { RoleTaskConsoleEntry } from '../src/components/roleTaskConsoleTypes.js';

const entries: RoleTaskConsoleEntry[] = [
  {
    id: 1,
    runId: 'r1',
    roleId: 'user',
    status: 'done',
    stream: 'system',
    content: '老师，我想玩一次四点竞速赛',
  },
  {
    id: 2,
    runId: 'r1',
    roleId: 'AI老师',
    status: 'done',
    stream: 'stdout',
    content: '好，我们先预测一下：你觉得第一圈更可能输在直线速度，还是转弯路线？',
  },
];

test('creates a readable child-facing console transcript snapshot', () => {
  const snapshot = createConsoleTranscriptSnapshot(
    entries,
    () => new Date('2026-07-19T08:00:00.000Z'),
  );

  assert.equal(snapshot.updatedAt, '2026-07-19T08:00:00.000Z');
  assert.deepEqual(snapshot.entries, entries);
  assert.match(snapshot.text, /\[user\].*四点竞速赛/u);
  assert.match(snapshot.text, /\[AI老师\].*直线速度/u);
});

test('publishes console transcript to window and localStorage for Playwright inspection', () => {
  const storage = new Map<string, string>();
  const target = {
    localStorage: {
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  } as unknown as Window;

  const snapshot = publishConsoleTranscript(entries, target);

  assert.deepEqual(target.__lightoryConsoleTranscript, snapshot);
  const stored = storage.get(LIGHTORY_CONSOLE_TRANSCRIPT_KEY);
  assert.ok(stored);
  assert.deepEqual(JSON.parse(stored), snapshot);
});

test('keeps console entries in first-seen order across independent entry sources', () => {
  const sequenceEntries = createConsoleEntrySequencer();
  const tutorEntry = {
    ...entries[1]!,
    id: 200002,
    runId: 'race',
    roleId: 'AI老师',
  };
  const laterRobotEntry = {
    id: 100001,
    runId: 'robot',
    roleId: 'robot',
    status: 'running',
    stream: 'system',
    content: 'Build robot-plan/v1 plan_race_run_lap: 四点竞速赛 default-abcd 跑一圈',
  } satisfies RoleTaskConsoleEntry;

  assert.deepEqual(sequenceEntries([tutorEntry]), [tutorEntry]);
  assert.deepEqual(sequenceEntries([laterRobotEntry, tutorEntry]), [tutorEntry, laterRobotEntry]);
});
