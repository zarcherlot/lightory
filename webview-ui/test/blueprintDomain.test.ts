import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { BlueprintCommand } from '../src/blueprint/domain/commands.js';
import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import {
  blueprintHistoryReducer,
  createBlueprintHistoryState,
} from '../src/blueprint/domain/reducer.js';
import type { BlueprintEdge, BlueprintNode } from '../src/blueprint/domain/types.js';

type BlueprintCommandInput = {
  [Type in BlueprintCommand['type']]: Omit<Extract<BlueprintCommand, { type: Type }>, 'revision'>;
}[BlueprintCommand['type']];

const container = node('system', 'container', '寻宝系统', 100, 100);
const moveNode = node('move', 'function', '移动', 180, 180);
const voiceNode = node('voice', 'function', '语音', 420, 180);
const triggerEdge: BlueprintEdge = {
  id: 'move-to-voice',
  sourceId: 'move',
  targetId: 'voice',
  relation: 'trigger',
  sourceStrokeIds: [],
};

test('applies node and edge commands with undo and redo', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: container });
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'node.create', node: voiceNode });
  state = run(state, { type: 'node.set-parent', nodeId: 'move', parentId: 'system' });
  state = run(state, { type: 'node.set-parent', nodeId: 'voice', parentId: 'system' });
  state = run(state, { type: 'edge.create', edge: triggerEdge });
  state = run(state, { type: 'node.rename', nodeId: 'system', label: ' 家庭寻宝系统 ' });
  state = run(state, { type: 'node.move', nodeId: 'move', position: { x: 220, y: 210 } });

  assert.equal(state.present.nodes.find(({ id }) => id === 'system')?.label, '家庭寻宝系统');
  assert.deepEqual(state.present.nodes.find(({ id }) => id === 'move')?.position, {
    x: 220,
    y: 210,
  });
  assert.equal(state.present.edges.length, 1);
  assert.equal(state.present.revisions.length, 8);

  state = blueprintHistoryReducer(state, { type: 'history.undo' });
  assert.deepEqual(state.present.nodes.find(({ id }) => id === 'move')?.position, {
    x: 180,
    y: 180,
  });
  state = blueprintHistoryReducer(state, { type: 'history.redo' });
  assert.deepEqual(state.present.nodes.find(({ id }) => id === 'move')?.position, {
    x: 220,
    y: 210,
  });
});

test('deleting a node removes dependent edges and clears child containment', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: container });
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'node.create', node: voiceNode });
  state = run(state, { type: 'node.set-parent', nodeId: 'move', parentId: 'system' });
  state = run(state, { type: 'edge.create', edge: triggerEdge });
  state = run(state, { type: 'node.delete', nodeId: 'system' });

  assert.equal(state.present.nodes.some(({ id }) => id === 'system'), false);
  assert.equal(state.present.nodes.find(({ id }) => id === 'move')?.parentId, undefined);

  state = run(state, { type: 'node.delete', nodeId: 'voice' });
  assert.equal(state.present.edges.length, 0);
});

test('rejects invalid node containment and missing edge endpoints', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: container });
  state = run(state, { type: 'node.create', node: moveNode });

  assert.throws(
    () => run(state, { type: 'node.set-parent', nodeId: 'system', parentId: 'move' }),
    /not a container/,
  );
  assert.throws(
    () =>
      run(state, {
        type: 'edge.create',
        edge: { ...triggerEdge, targetId: 'missing' },
      }),
    /Unknown node: missing/,
  );
});

function run(
  state: ReturnType<typeof createBlueprintHistoryState>,
  command: BlueprintCommandInput,
) {
  const sequence = state.present.revisions.length + 1;
  return blueprintHistoryReducer(state, {
    type: 'command',
    command: {
      ...command,
      revision: {
        id: `revision-${sequence}`,
        createdAt: sequence,
        reason: command.type,
      },
    } as BlueprintCommand,
  });
}

function node(
  id: string,
  kind: BlueprintNode['kind'],
  label: string,
  x: number,
  y: number,
): BlueprintNode {
  return {
    id,
    kind,
    label,
    position: { x, y },
    size: { width: 180, height: 120 },
    sourceStrokeIds: [],
    recognition: { source: 'manual' },
  };
}
