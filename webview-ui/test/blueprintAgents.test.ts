import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  createDraftAssignment,
  createMockDelivery,
  createMockRestatement,
  validateAgentTaskContract,
} from '../src/blueprint/agents/index.js';
import { assignmentStatusLabel } from '../src/blueprint/components/agentPresentation.js';
import type { BlueprintCommand, BlueprintCommandInput } from '../src/blueprint/domain/commands.js';
import {
  createEmptyBlueprintDocument,
  migrateBlueprintDocument,
  validateBlueprintDocument,
} from '../src/blueprint/domain/document.js';
import {
  blueprintHistoryReducer,
  type BlueprintHistoryState,
  createBlueprintHistoryState,
} from '../src/blueprint/domain/reducer.js';
import type {
  AgentDefinition,
  BlueprintNode,
  ToolDefinition,
} from '../src/blueprint/domain/types.js';

const node: BlueprintNode = {
  id: 'move',
  kind: 'function',
  label: '移动',
  position: { x: 100, y: 100 },
  size: { width: 180, height: 120 },
  sourceStrokeIds: [],
  recognition: { source: 'manual' },
};
const agent: AgentDefinition = {
  id: 'route-engineer',
  name: '路线工程师',
  capabilityIds: ['basic-movement'],
  knownLimitations: ['转向后偶尔忘记更新朝向'],
  contextScope: 'assignment-only',
  fallibilityPolicyId: 'scripted-review-v1',
};
const tool: ToolDefinition = {
  id: 'basic-movement',
  name: '基础移动',
  description: '移动',
  inputSchema: {},
  outputSchema: {},
  safetyConstraints: [],
};

test('presents confirmed assignments as waiting for the chief engineer, not already working', () => {
  assert.equal(assignmentStatusLabel('working'), '已派工');
});

test('runs the assignment confirmation, return, resubmit and acceptance state machine', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node });
  const assignment = createDraftAssignment(
    'assignment-1',
    { agent, node, availableTools: [tool] },
    1,
  );
  assignment.contract = {
    revision: 1,
    goal: '规划到宝藏点的移动路线',
    inputNodeIds: [],
    expectedOutputs: ['移动步骤和转向参数'],
    acceptanceCriteria: ['到达目标位置', '转向后朝向正确'],
    toolIds: ['basic-movement'],
    evidenceIds: [],
  };
  state = run(state, { type: 'assignment.create', assignment });
  const restatement = createMockRestatement(agent, assignment, []);
  state = run(state, {
    type: 'assignment.restatement-submit',
    assignmentId: assignment.id,
    restatement,
  });
  state = run(state, { type: 'assignment.confirm', assignmentId: assignment.id });
  const v1 = createMockDelivery('delivery-1', agent, state.present.assignments[0]!, []);
  state = run(state, {
    type: 'assignment.delivery-submit',
    assignmentId: assignment.id,
    delivery: v1,
  });
  state = run(state, {
    type: 'assignment.return',
    assignmentId: assignment.id,
    deliveryId: v1.id,
    review: {
      id: 'review-1',
      assignmentId: assignment.id,
      deliveryId: v1.id,
      decision: 'returned',
      comment: '请补充转向后的朝向检查',
      createdAt: 2,
    },
  });
  state = run(state, {
    type: 'assignment.resubmit',
    assignmentId: assignment.id,
    restatement: { ...restatement, summary: '我会补充朝向检查后重新提交。' },
  });
  const v2 = createMockDelivery(
    'delivery-2',
    agent,
    state.present.assignments[0]!,
    state.present.deliveries,
    '请补充转向后的朝向检查',
  );
  state = run(state, {
    type: 'assignment.delivery-submit',
    assignmentId: assignment.id,
    delivery: v2,
  });
  state = run(state, {
    type: 'assignment.accept',
    assignmentId: assignment.id,
    deliveryId: v2.id,
    review: {
      id: 'review-2',
      assignmentId: assignment.id,
      deliveryId: v2.id,
      decision: 'accepted',
      comment: '符合验收标准',
      createdAt: 3,
    },
  });

  assert.equal(state.present.assignments[0]?.status, 'accepted');
  assert.deepEqual(
    state.present.deliveries.map(({ version, status }) => ({ version, status })),
    [
      { version: 1, status: 'returned' },
      { version: 2, status: 'accepted' },
    ],
  );
  assert.equal(state.present.assignmentReviews.length, 2);

  state = run(state, { type: 'assignment.reopen', assignmentId: assignment.id });
  assert.equal(state.present.assignments[0]?.status, 'draft');
  assert.equal(state.present.deliveries[1]?.status, 'accepted');
  state = run(state, {
    type: 'assignment.contract-update',
    assignmentId: assignment.id,
    contract: { ...assignment.contract, goal: '调整已经验收的路线' },
  });
  assert.equal(state.present.assignments[0]?.contract.goal, '调整已经验收的路线');

  state = run(state, { type: 'node.delete', nodeId: node.id });
  assert.equal(state.present.assignments.length, 0);
  assert.equal(state.present.deliveries.length, 0);
  assert.equal(state.present.assignmentReviews.length, 0);
  state = blueprintHistoryReducer(state, { type: 'history.undo' });
  assert.equal(state.present.assignments[0]?.status, 'draft');
  assert.equal(state.present.assignmentReviews.length, 2);
});

test('rejects incomplete contracts and illegal assignment transitions', () => {
  let state = createBlueprintHistoryState(createEmptyBlueprintDocument());
  state = run(state, { type: 'node.create', node });
  const assignment = createDraftAssignment(
    'assignment-1',
    { agent, node, availableTools: [tool] },
    1,
  );
  state = run(state, { type: 'assignment.create', assignment });

  assert.throws(
    () =>
      run(state, {
        type: 'assignment.restatement-submit',
        assignmentId: assignment.id,
        restatement: createMockRestatement(agent, assignment, []),
      }),
    /incomplete/,
  );
  assert.throws(
    () => run(state, { type: 'assignment.confirm', assignmentId: assignment.id }),
    /cannot perform/,
  );
  assert.ok(
    validateAgentTaskContract(assignment.contract, { agent, node, availableTools: [tool] }).length >
      0,
  );
  assert.deepEqual(
    validateAgentTaskContract(
      {
        ...assignment.contract,
        goal: '移动',
        expectedOutputs: ['路线'],
        acceptanceCriteria: ['到达'],
        toolIds: ['voice'],
      },
      { agent, node, availableTools: [tool] },
    ),
    ['Agent 不能使用 Tool：voice'],
  );
});

test('migrates a P1 blueprint without assignment reviews', () => {
  const legacy = createEmptyBlueprintDocument() as unknown as Record<string, unknown>;
  delete legacy.assignmentReviews;
  legacy.assignments = [{ id: 'a', nodeId: 'n', agentId: 'x', status: 'draft' }];
  const migrated = migrateBlueprintDocument(legacy) as Record<string, unknown>;
  assert.deepEqual(migrated.assignmentReviews, []);
  assert.equal((migrated.assignments as Array<Record<string, unknown>>)[0]?.createdAt, 0);
});

test('migrates legacy plan edges, contracts and delivery payloads into P3 artifacts', () => {
  const legacy = createEmptyBlueprintDocument() as unknown as Record<string, unknown>;
  legacy.nodes = [node];
  legacy.edges = [
    {
      id: 'legacy-edge',
      sourceId: 'move',
      targetId: 'move',
      relation: 'trigger',
      sourceStrokeIds: [],
    },
  ];
  legacy.planSteps = [{ id: 'step', nodeId: 'move', dependsOn: [], checkpoint: true }];
  legacy.assignments = [
    {
      id: 'legacy-assignment',
      nodeId: 'move',
      agentId: 'route-engineer',
      status: 'accepted',
      contract: {
        goal: '移动',
        inputNodeIds: [],
        expectedOutputs: ['路线'],
        acceptanceCriteria: ['到达'],
        toolIds: ['basic-movement'],
      },
      createdAt: 1,
    },
  ];
  legacy.deliveries = [
    {
      id: 'legacy-delivery',
      assignmentId: 'legacy-assignment',
      version: 1,
      summary: '旧交付',
      assumptions: [],
      uncertainties: [],
      artifact: { turnAngle: 60 },
      status: 'accepted',
    },
  ];

  const migrated = migrateBlueprintDocument(legacy) as Record<string, unknown>;
  const migratedEdge = (migrated.edges as Array<Record<string, unknown>>)[0]!;
  const migratedAssignment = (migrated.assignments as Array<Record<string, unknown>>)[0]!;
  const migratedDelivery = (migrated.deliveries as Array<Record<string, unknown>>)[0]!;
  assert.equal(migrated.planSteps, undefined);
  assert.equal(migratedEdge.relation, 'handoff');
  assert.equal(migratedEdge.handoffKind, 'completion');
  assert.equal((migratedAssignment.contract as Record<string, unknown>).revision, 1);
  assert.equal((migratedDelivery.artifact as Record<string, unknown>).schemaId, 'lightory.agent-artifact/legacy-v1');
  assert.deepEqual(validateBlueprintDocument(migrated), []);
});

function run(state: BlueprintHistoryState, command: BlueprintCommandInput): BlueprintHistoryState {
  const sequence = state.present.revisions.length + 1;
  return blueprintHistoryReducer(state, {
    type: 'command',
    command: {
      ...command,
      revision: { id: `revision-${sequence}`, createdAt: sequence, reason: command.type },
    } as BlueprintCommand,
  });
}
