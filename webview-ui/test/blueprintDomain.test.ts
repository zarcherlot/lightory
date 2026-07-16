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
  relation: 'handoff',
  handoffKind: 'trigger',
  condition: '移动完成后',
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

  assert.equal(
    state.present.nodes.some(({ id }) => id === 'system'),
    false,
  );
  assert.equal(state.present.nodes.find(({ id }) => id === 'move')?.parentId, undefined);

  state = run(state, { type: 'node.delete', nodeId: 'voice' });
  assert.equal(state.present.edges.length, 0);
});

test('resizes a recognized node with minimum size protection', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'node.resize', nodeId: 'move', size: { width: 260, height: 150 } });
  assert.deepEqual(state.present.nodes[0]?.size, { width: 260, height: 150 });
  assert.throws(
    () => run(state, { type: 'node.resize', nodeId: 'move', size: { width: 80, height: 60 } }),
    /cannot be smaller/,
  );
});

test('supports a start module as the source of the program flow', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  const start = node('start', 'start', '开始', 40, 180);
  state = run(state, { type: 'node.create', node: start });
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, {
    type: 'edge.create',
    edge: {
      id: 'start-to-move',
      sourceId: 'start',
      targetId: 'move',
      relation: 'handoff',
      handoffKind: 'trigger',
      condition: '总工程师点击开始后',
      sourceStrokeIds: [],
    },
  });

  assert.equal(state.present.nodes[0]?.kind, 'start');
  assert.equal(state.present.edges[0]?.sourceId, 'start');
});

test('supports an editable end module and enforces control-node connection direction', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  const start = node('start-control', 'start', '开始', 20, 180);
  const end = node('end-control', 'end', '结束', 620, 180);
  state = run(state, { type: 'node.create', node: start });
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'node.create', node: end });
  state = run(state, {
    type: 'node.update',
    nodeId: end.id,
    label: '找到宝藏',
    kind: 'end',
    control: {
      trigger: 'manual',
      inputInformation: '收到到达结果',
      handoffInformation: '',
      completionCondition: '小车到达宝藏位置',
      finishAction: 'stop',
    },
  });
  state = run(state, { type: 'edge.create', edge: { ...triggerEdge, id: 'move-to-end', targetId: end.id } });

  assert.equal(state.present.nodes.find(({ id }) => id === end.id)?.control?.completionCondition, '小车到达宝藏位置');
  assert.throws(
    () => run(state, { type: 'edge.create', edge: { ...triggerEdge, id: 'end-to-move', sourceId: end.id, targetId: moveNode.id } }),
    /结束模块不能发出连线/,
  );
  assert.throws(
    () => run(state, { type: 'edge.create', edge: { ...triggerEdge, id: 'move-to-start', sourceId: moveNode.id, targetId: start.id } }),
    /开始模块不能接收连线/,
  );
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

test('keeps raw strokes in history and detaches them when explicitly deleted', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  const stroke = {
    id: 'stroke-1',
    pointerKind: 'pen' as const,
    createdAt: 1,
    points: [
      { x: 10, y: 10, t: 1, pressure: 0.4 },
      { x: 20, y: 20, t: 2, pressure: 0.6 },
    ],
  };
  state = run(state, { type: 'stroke.add', stroke });
  state = run(state, {
    type: 'node.create',
    node: { ...moveNode, sourceStrokeIds: ['stroke-1'] },
  });
  state = run(state, { type: 'stroke.delete', strokeId: 'stroke-1' });

  assert.equal(state.present.strokes.length, 0);
  assert.deepEqual(state.present.nodes[0]?.sourceStrokeIds, []);
  state = blueprintHistoryReducer(state, { type: 'history.undo' });
  assert.equal(state.present.strokes.length, 1);
  assert.deepEqual(state.present.nodes[0]?.sourceStrokeIds, ['stroke-1']);
});

test('replaces an erased source stroke atomically and undo restores its references', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  const stroke = {
    id: 'source-stroke',
    pointerKind: 'pen' as const,
    createdAt: 1,
    points: [
      { x: 0, y: 0, t: 1, pressure: 0.5 },
      { x: 100, y: 0, t: 2, pressure: 0.5 },
    ],
  };
  state = run(state, { type: 'stroke.add', stroke });
  state = run(state, {
    type: 'node.create',
    node: { ...moveNode, sourceStrokeIds: ['source-stroke'] },
  });
  const fragment = { ...stroke, id: 'fragment', points: stroke.points.slice(0, 1) };
  state = run(state, {
    type: 'stroke.replace',
    replacements: [{ sourceStrokeId: 'source-stroke', strokes: [fragment] }],
  });

  assert.deepEqual(
    state.present.strokes.map(({ id }) => id),
    ['fragment'],
  );
  assert.deepEqual(state.present.nodes[0]?.sourceStrokeIds, ['fragment']);
  state = blueprintHistoryReducer(state, { type: 'history.undo' });
  assert.deepEqual(
    state.present.strokes.map(({ id }) => id),
    ['source-stroke'],
  );
  assert.deepEqual(state.present.nodes[0]?.sourceStrokeIds, ['source-stroke']);
});

test('clears the complete canvas in one undoable command', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'document.clear' });
  assert.equal(state.present.nodes.length, 0);
  assert.equal(state.present.revisions.at(-1)?.reason, 'document.clear');

  state = blueprintHistoryReducer(state, { type: 'history.undo' });
  assert.equal(state.present.nodes.length, 1);
});

test('edits a recognized module name and type and detaches children when needed', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: container });
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'node.set-parent', nodeId: 'move', parentId: 'system' });
  state = run(state, {
    type: 'node.update',
    nodeId: 'system',
    label: '寻宝流程',
    kind: 'function',
  });

  assert.equal(state.present.nodes.find(({ id }) => id === 'system')?.label, '寻宝流程');
  assert.equal(state.present.nodes.find(({ id }) => id === 'system')?.kind, 'function');
  assert.equal(state.present.nodes.find(({ id }) => id === 'move')?.parentId, undefined);
});

test('creates trigger and message connections with required child-authored details', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node: moveNode });
  state = run(state, { type: 'node.create', node: voiceNode });

  state = run(state, {
    type: 'edge.create',
    edge: {
      id: 'move-triggers-voice',
      sourceId: 'move',
      targetId: 'voice',
      relation: 'handoff',
      handoffKind: 'trigger',
      condition: '到达目标后',
      sourceStrokeIds: [],
    },
  });
  state = run(state, {
    type: 'edge.create',
    edge: {
      id: 'move-message-voice',
      sourceId: 'move',
      targetId: 'voice',
      relation: 'handoff',
      handoffKind: 'message',
      message: '告诉语音模块：宝藏在沙发旁',
      sourceStrokeIds: [],
    },
  });

  assert.equal(state.present.edges[0]?.condition, '到达目标后');
  assert.equal(state.present.edges[1]?.message, '告诉语音模块：宝藏在沙发旁');
  assert.throws(
    () => run(state, {
      type: 'edge.create',
      edge: {
        id: 'missing-condition',
        sourceId: 'move',
        targetId: 'voice',
        relation: 'handoff',
        handoffKind: 'trigger',
        sourceStrokeIds: [],
      },
    }),
    /触发条件不能为空/,
  );
  assert.throws(
    () => run(state, {
      type: 'edge.create',
      edge: {
        id: 'missing-message',
        sourceId: 'move',
        targetId: 'voice',
        relation: 'handoff',
        handoffKind: 'message',
        sourceStrokeIds: [],
      },
    }),
    /传递消息不能为空/,
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
