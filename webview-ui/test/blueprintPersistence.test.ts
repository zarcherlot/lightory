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
