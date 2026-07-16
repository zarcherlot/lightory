import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { BlueprintCommand, BlueprintCommandInput } from '../src/blueprint/domain/commands.js';
import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import {
  blueprintHistoryReducer,
  createBlueprintHistoryState,
} from '../src/blueprint/domain/reducer.js';
import type { AgentWorkflow, SceneEntity } from '../src/blueprint/domain/types.js';
import { LocalStorageBlueprintRepository } from '../src/blueprint/persistence/blueprintRepository.js';

test('creates, edits and removes meter-based scene entities with undo', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'scene.entity-create', entity: robotStart() });
  state = run(state, {
    type: 'scene.entity-create',
    entity: {
      ...robotStart(),
      id: 'target',
      kind: 'target-landmark',
      label: '宝藏',
      position: { x: 7.5, y: 5.5 },
    },
  });
  state = run(state, {
    type: 'scene.entity-move',
    entityId: 'target',
    position: { x: 20, y: -3 },
  });
  assert.deepEqual(state.present.scene.entities[1]?.position, { x: 7.25, y: 0 });

  state = run(state, {
    type: 'scene.entity-update',
    entityId: 'target',
    label: '  终点宝藏  ',
    meaning: ' 到达这里才算完成 ',
    size: { width: 1.25, height: 1 },
    rotation: 450,
  });
  assert.deepEqual(state.present.scene.entities[1], {
    ...state.present.scene.entities[1],
    label: '终点宝藏',
    meaning: '到达这里才算完成',
    position: { x: 6.75, y: 0 },
    size: { width: 1.25, height: 1 },
    rotation: 90,
  });

  state = run(state, { type: 'scene.entity-delete', entityId: 'target' });
  assert.equal(state.present.scene.entities.length, 1);
  state = blueprintHistoryReducer(state, { type: 'history.undo' });
  assert.equal(state.present.scene.entities[1]?.label, '终点宝藏');
});

test('allows only one robot start and keeps Agent workflow valid after scene edits', () => {
  const workflow: AgentWorkflow = { blueprintRevisionId: 'workflow-revision', nodes: [], batches: [] };
  let state = createBlueprintHistoryState({ ...createEmptyBlueprintDocument(), workflow });
  state = run(state, { type: 'scene.entity-create', entity: robotStart() });
  assert.deepEqual(state.present.workflow, workflow);
  assert.throws(
    () => run(state, { type: 'scene.entity-create', entity: { ...robotStart(), id: 'robot-2' } }),
    /only have one robot start/,
  );
});

test('migrates and restores a legacy scene without metric metadata', async () => {
  const storage = new MemoryStorage();
  const legacy = createEmptyBlueprintDocument() as unknown as Record<string, unknown>;
  legacy.scene = { entities: [robotStart()] };
  storage.setItem('lightory.blueprint.v1:legacy-scene', JSON.stringify(legacy));
  const repository = new LocalStorageBlueprintRepository(storage);

  const loaded = await repository.load('legacy-scene');
  assert.equal(loaded?.scene.schemaVersion, 'lightory-scene/v1');
  assert.equal(loaded?.scene.widthMeters, 8);
  assert.equal(loaded?.scene.heightMeters, 6);
  assert.equal(loaded?.scene.gridSizeMeters, 0.5);
  assert.equal(loaded?.scene.entities[0]?.id, 'robot-start');

  await repository.save('restored-scene', loaded!);
  assert.deepEqual(await repository.load('restored-scene'), loaded);
});

function robotStart(): SceneEntity {
  return {
    id: 'robot-start',
    kind: 'robot-start',
    label: '小车起点',
    meaning: '实验开始的位置',
    position: { x: 1, y: 4 },
    size: { width: 0.75, height: 0.75 },
    rotation: 0,
    sourceStrokeIds: [],
  };
}

function run(
  state: ReturnType<typeof createBlueprintHistoryState>,
  command: BlueprintCommandInput,
) {
  const sequence = state.present.revisions.length + 1;
  return blueprintHistoryReducer(state, {
    type: 'command',
    command: {
      ...command,
      revision: { id: `scene-revision-${sequence}`, createdAt: sequence, reason: command.type },
    } as BlueprintCommand,
  });
}

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}
