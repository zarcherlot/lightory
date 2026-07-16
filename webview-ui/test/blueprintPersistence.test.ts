import assert from 'node:assert/strict';

import { test } from 'vitest';

import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import type { BlueprintDocument } from '../src/blueprint/domain/types.js';
import {
  BlueprintRepositoryError,
  LocalStorageBlueprintRepository,
  type StorageLike,
} from '../src/blueprint/persistence/blueprintRepository.js';

test('round-trips blueprint/v1 without losing strokes or revision history', async () => {
  const storage = new MemoryStorage();
  const repository = new LocalStorageBlueprintRepository(storage);
  const document: BlueprintDocument = {
    ...createEmptyBlueprintDocument(),
    strokes: [
      {
        id: 'stroke-1',
        pointerKind: 'pen',
        createdAt: 10,
        points: [
          { x: 1, y: 2, t: 10, pressure: 0.4 },
          { x: 3, y: 4, t: 11, pressure: 0.7 },
        ],
      },
    ],
    revisions: [{ id: 'revision-1', createdAt: 12, reason: 'draw rectangle' }],
  };

  await repository.save('family-project', document);
  assert.deepEqual(await repository.load('family-project'), document);

  await repository.remove('family-project');
  assert.equal(await repository.load('family-project'), null);
});

test('rejects corrupted persisted documents', async () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'lightory.blueprint.v1:broken',
    JSON.stringify({ schemaVersion: 'blueprint/v2' }),
  );
  storage.setItem(
    'lightory.blueprint.v1:malformed-node',
    JSON.stringify({ ...createEmptyBlueprintDocument(), nodes: [null] }),
  );
  const repository = new LocalStorageBlueprintRepository(storage);

  await assert.rejects(() => repository.load('broken'), BlueprintRepositoryError);
  await assert.rejects(() => repository.load('malformed-node'), BlueprintRepositoryError);
});

test('migrates a valid older document by adding review and experiment collections', async () => {
  const storage = new MemoryStorage();
  const legacy = createEmptyBlueprintDocument() as unknown as Record<string, unknown>;
  delete legacy.assignmentReviews;
  delete legacy.experimentExpectations;
  storage.setItem('lightory.blueprint.v1:legacy', JSON.stringify(legacy));
  const repository = new LocalStorageBlueprintRepository(storage);

  const loaded = await repository.load('legacy');
  assert.deepEqual(loaded?.assignmentReviews, []);
  assert.deepEqual(loaded?.experimentExpectations, []);
});

test('migrates legacy completion and artifact connections to trigger and message interactions', async () => {
  const storage = new MemoryStorage();
  const legacy = {
    ...createEmptyBlueprintDocument(),
    nodes: [
      {
        id: 'move',
        kind: 'function',
        label: '移动',
        position: { x: 0, y: 0 },
        size: { width: 180, height: 120 },
        sourceStrokeIds: [],
        recognition: { source: 'manual' },
      },
      {
        id: 'voice',
        kind: 'function',
        label: '语音',
        position: { x: 240, y: 0 },
        size: { width: 180, height: 120 },
        sourceStrokeIds: [],
        recognition: { source: 'manual' },
      },
    ],
    edges: [
      {
        id: 'completion',
        sourceId: 'move',
        targetId: 'voice',
        relation: 'handoff',
        handoffKind: 'completion',
        sourceStrokeIds: [],
      },
      {
        id: 'artifact',
        sourceId: 'move',
        targetId: 'voice',
        relation: 'handoff',
        handoffKind: 'artifact',
        label: '路线方案',
        sourceStrokeIds: [],
      },
    ],
  };
  storage.setItem('lightory.blueprint.v1:legacy-edges', JSON.stringify(legacy));
  const repository = new LocalStorageBlueprintRepository(storage);

  const loaded = await repository.load('legacy-edges');

  assert.equal(loaded?.edges[0]?.handoffKind, 'trigger');
  assert.equal(loaded?.edges[0]?.condition, '上游完成后');
  assert.equal(loaded?.edges[1]?.handoffKind, 'message');
  assert.equal(loaded?.edges[1]?.message, '路线方案');
});

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
