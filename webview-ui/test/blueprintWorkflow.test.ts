import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  MOVEMENT_ARTIFACT_SCHEMA_ID,
  SPEECH_ARTIFACT_SCHEMA_ID,
} from '../src/blueprint/domain/artifactSchemas.js';
import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import { applyBlueprintCommand } from '../src/blueprint/domain/reducer.js';
import type {
  AgentAssignment,
  AgentDefinition,
  AgentDelivery,
  BlueprintDocument,
  BlueprintEdge,
  BlueprintNode,
} from '../src/blueprint/domain/types.js';
import {
  analyzeAgentWorkflow,
  DeterministicAgentRuntimeAdapter,
  executeNextAgentBuildBatch,
} from '../src/blueprint/workflow/index.js';

test('derives parallel batches from child-authored handoff connections', () => {
  const document = makeDocument(
    [node('start', 'start'), node('move'), node('voice')],
    [edge('start', 'move'), edge('start', 'voice')],
    [assignment('move'), assignment('voice')],
    [delivery('move'), delivery('voice')],
  );

  const analysis = analyzeAgentWorkflow(document);

  assert.deepEqual(analysis.issues, []);
  assert.deepEqual(analysis.workflow.batches, [['move', 'voice']]);
  assert.deepEqual(
    analysis.workflow.nodes.map(({ nodeId, status }) => ({ nodeId, status })),
    [
      { nodeId: 'move', status: 'accepted' },
      { nodeId: 'voice', status: 'accepted' },
    ],
  );
});

test('carries dependencies through artifact nodes and detects changed upstream deliveries', () => {
  const document = makeDocument(
    [node('move'), node('voice')],
    [edge('move', 'voice', 'message', '到达目标的位置和路径')],
    [assignment('move'), assignment('voice')],
    [delivery('move'), delivery('voice', ['delivery-move'])],
  );
  const initial = analyzeAgentWorkflow(document);
  assert.deepEqual(initial.workflow.batches, [['move'], ['voice']]);
  assert.equal(initial.workflow.nodes.find(({ nodeId }) => nodeId === 'voice')?.status, 'accepted');

  const changed: BlueprintDocument = {
    ...document,
    deliveries: [
      { ...document.deliveries[0]!, id: 'delivery-move-v2', version: 2 },
      document.deliveries[1]!,
    ],
  };
  const rebuilt = analyzeAgentWorkflow(changed);
  const voice = rebuilt.workflow.nodes.find(({ nodeId }) => nodeId === 'voice');
  assert.equal(voice?.status, 'dirty');
  assert.match(voice?.dirtyReason ?? '', /上游交付已经变化/);
});

test('passes message connections as visible inputs but keeps trigger signals as dependencies only', async () => {
  const runtime = new DeterministicAgentRuntimeAdapter();
  const messageDocument = makeDocument(
    [node('move'), node('voice')],
    [edge('move', 'voice', 'message', '目标位置和路线方案')],
    [assignment('move'), assignment('voice')],
    [delivery('move')],
  );
  messageDocument.assignments[1]!.status = 'working';
  messageDocument.workflow = analyzeAgentWorkflow(messageDocument).workflow;
  const messageResult = await executeNextAgentBuildBatch({
    document: messageDocument,
    agents: [agent('voice')],
    adapter: runtime,
    workspaceId: 'family-project',
    createId: () => 'delivery-voice-message',
  });
  assert.deepEqual(messageResult.deliveries[0]?.artifact.inputArtifactIds, ['delivery-move']);

  const signalDocument = makeDocument(
    [node('move'), node('voice')],
    [edge('move', 'voice', 'trigger', '小车到达目标后')],
    [assignment('move'), assignment('voice')],
    [delivery('move')],
  );
  signalDocument.assignments[1]!.status = 'working';
  signalDocument.workflow = analyzeAgentWorkflow(signalDocument).workflow;
  const signalResult = await executeNextAgentBuildBatch({
    document: signalDocument,
    agents: [agent('voice')],
    adapter: runtime,
    workspaceId: 'family-project',
    createId: () => 'delivery-voice-signal',
  });
  assert.deepEqual(signalResult.deliveries[0]?.artifact.inputArtifactIds, []);
});

test('marks a changed contract and every downstream node dirty', () => {
  const moveAssignment = assignment('move');
  moveAssignment.contract.revision = 2;
  const document = makeDocument(
    [node('move'), node('voice')],
    [edge('move', 'voice')],
    [moveAssignment, assignment('voice')],
    [delivery('move'), delivery('voice', ['delivery-move'])],
  );

  const analysis = analyzeAgentWorkflow(document);
  assert.equal(analysis.workflow.nodes.find(({ nodeId }) => nodeId === 'move')?.status, 'dirty');
  assert.equal(analysis.workflow.nodes.find(({ nodeId }) => nodeId === 'voice')?.status, 'dirty');
});

test('blocks cyclic handoffs instead of letting an agent repair the architecture', () => {
  const document = makeDocument(
    [node('move'), node('voice')],
    [edge('move', 'voice'), edge('voice', 'move')],
    [assignment('move'), assignment('voice')],
    [],
  );
  const analysis = analyzeAgentWorkflow(document);
  assert.match(analysis.issues[0] ?? '', /形成循环/);
  assert.deepEqual(analysis.workflow.batches, []);
  assert.ok(analysis.workflow.nodes.every(({ status }) => status === 'blocked'));
});

test('deterministic adapter only sees explicit artifacts and contract tools', async () => {
  const runtime = new DeterministicAgentRuntimeAdapter();
  const contract = assignment('voice').contract;
  const artifact = await runtime.execute({
    agentRole: '语音工程师',
    assignmentId: 'assignment-voice',
    contract,
    visibleArtifacts: [{ deliveryId: 'arrival-v2', artifact: delivery('move').artifact }],
    allowedToolIds: ['basic-movement'],
    outputSchema: { $id: 'lightory.test/output-v1' },
    workspaceId: 'test-workspace',
  });
  assert.deepEqual(artifact.inputArtifactIds, ['arrival-v2']);
  assert.equal(artifact.sourceContractRevision, 1);
  await assert.rejects(
    runtime.execute({
      agentRole: '越权工程师',
      assignmentId: 'assignment-voice',
      contract,
      visibleArtifacts: [],
      allowedToolIds: ['voice'],
      outputSchema: {},
      workspaceId: 'test-workspace',
    }),
    /outside the child contract/,
  );
});

test('deterministic adapter emits typed actions only when the child contract is explicit', async () => {
  const runtime = new DeterministicAgentRuntimeAdapter();
  const movementContract = assignment('move').contract;
  movementContract.goal = '先前进 1.5 米，再右转 90 度';
  const movement = await runtime.execute({
    agentRole: '移动工程师',
    assignmentId: 'assignment-move',
    contract: movementContract,
    visibleArtifacts: [],
    allowedToolIds: ['basic-movement'],
    outputSchema: { $id: MOVEMENT_ARTIFACT_SCHEMA_ID },
    workspaceId: 'test-workspace',
  });
  assert.deepEqual(movement.payload.actions, [
    { type: 'driveDistance', distanceMeters: 1.5 },
    { type: 'rotateAngle', angleRad: -Math.PI / 2 },
  ]);

  movementContract.goal = '设计一个可靠的移动方式';
  const ambiguous = await runtime.execute({
    agentRole: '移动工程师',
    assignmentId: 'assignment-move',
    contract: movementContract,
    visibleArtifacts: [],
    allowedToolIds: ['basic-movement'],
    outputSchema: { $id: MOVEMENT_ARTIFACT_SCHEMA_ID },
    workspaceId: 'test-workspace',
  });
  assert.deepEqual(ambiguous.payload.actions, []);

  const speechContract = assignment('voice').contract;
  speechContract.goal = '播报“找到宝藏啦”';
  const speech = await runtime.execute({
    agentRole: '语音工程师',
    assignmentId: 'assignment-voice',
    contract: speechContract,
    visibleArtifacts: [{ deliveryId: 'delivery-move', artifact: delivery('move').artifact }],
    allowedToolIds: ['basic-movement'],
    outputSchema: { $id: SPEECH_ARTIFACT_SCHEMA_ID },
    workspaceId: 'test-workspace',
  });
  assert.equal(speech.payload.text, '找到宝藏啦');
  assert.equal(speech.payload.trigger, 'after-input');
});

test('executes only the earliest runnable batch and submits drafts for child review', async () => {
  const moveAssignment = assignment('move');
  const voiceAssignment = assignment('voice');
  moveAssignment.status = 'working';
  voiceAssignment.status = 'working';
  const document = makeDocument(
    [node('move'), node('voice')],
    [],
    [moveAssignment, voiceAssignment],
    [],
  );
  document.workflow = analyzeAgentWorkflow(document).workflow;

  const result = await executeNextAgentBuildBatch({
    document,
    agents: [agent('move'), agent('voice')],
    adapter: new DeterministicAgentRuntimeAdapter(),
    workspaceId: 'family-project',
    createId: (prefix) => `${prefix}-${Math.random()}`,
  });

  assert.deepEqual(result.nodeIds, ['move', 'voice']);
  assert.equal(result.deliveries.length, 2);
  assert.ok(result.deliveries.every(({ status }) => status === 'draft'));
});

test('waits for upstream acceptance, then rebuilds a dirty downstream module', async () => {
  const document = makeDocument(
    [node('move'), node('voice')],
    [edge('move', 'voice', 'message', '移动方案')],
    [assignment('move'), assignment('voice')],
    [delivery('move'), delivery('voice')],
  );
  document.workflow = analyzeAgentWorkflow(document).workflow;

  const result = await executeNextAgentBuildBatch({
    document,
    agents: [agent('move'), agent('voice')],
    adapter: new DeterministicAgentRuntimeAdapter(),
    workspaceId: 'family-project',
    createId: () => 'delivery-voice-v2',
  });

  assert.deepEqual(result.nodeIds, ['voice']);
  assert.deepEqual(result.deliveries[0]?.artifact.inputArtifactIds, ['delivery-move']);
  assert.equal(result.deliveries[0]?.version, 2);

  const submitted = applyBlueprintCommand(document, {
    type: 'workflow.delivery-submit',
    assignmentId: 'assignment-voice',
    delivery: result.deliveries[0]!,
    revision: { id: 'build-revision', createdAt: 2, reason: 'build' },
  });
  assert.equal(submitted.assignments.find(({ nodeId }) => nodeId === 'voice')?.status, 'awaiting-review');
  assert.equal(submitted.workflow, undefined);
});

test('rebuilds an accepted module after the child changes and reconfirms its contract', async () => {
  const changedAssignment = assignment('move');
  changedAssignment.status = 'working';
  changedAssignment.contract.revision = 2;
  changedAssignment.contract.goal = '前进 2 米';
  const document = makeDocument(
    [node('move')],
    [],
    [changedAssignment],
    [delivery('move')],
  );
  document.workflow = analyzeAgentWorkflow(document).workflow;

  const result = await executeNextAgentBuildBatch({
    document,
    agents: [agent('move')],
    adapter: new DeterministicAgentRuntimeAdapter(),
    workspaceId: 'family-project',
    createId: () => 'delivery-move-v2',
  });

  assert.deepEqual(result.nodeIds, ['move']);
  assert.equal(result.deliveries[0]?.version, 2);
  assert.equal(result.deliveries[0]?.artifact.sourceContractRevision, 2);
});

test('rejects an adapter result that claims hidden upstream inputs', async () => {
  const moveAssignment = assignment('move');
  moveAssignment.status = 'working';
  const document = makeDocument([node('move')], [], [moveAssignment], []);
  document.workflow = analyzeAgentWorkflow(document).workflow;
  await assert.rejects(
    executeNextAgentBuildBatch({
      document,
      agents: [agent('move')],
      adapter: {
        execute: async (request) => ({
          schemaId: 'bad',
          payload: {},
          childSummary: 'bad',
          assumptions: [],
          inputArtifactIds: ['hidden-delivery'],
          sourceAssignmentId: request.assignmentId,
          sourceContractRevision: request.contract.revision,
        }),
      },
      workspaceId: 'family-project',
      createId: () => 'bad-delivery',
    }),
    /交付连接之外的输入/,
  );
});

function makeDocument(
  nodes: BlueprintNode[],
  edges: BlueprintEdge[],
  assignments: AgentAssignment[],
  deliveries: AgentDelivery[],
): BlueprintDocument {
  return { ...createEmptyBlueprintDocument(), nodes, edges, assignments, deliveries };
}

function node(id: string, kind: BlueprintNode['kind'] = 'function'): BlueprintNode {
  return {
    id,
    kind,
    label: id,
    position: { x: 0, y: 0 },
    size: { width: 180, height: 120 },
    sourceStrokeIds: [],
    recognition: { source: 'manual' },
  };
}

function edge(
  sourceId: string,
  targetId: string,
  handoffKind: BlueprintEdge['handoffKind'] = 'trigger',
  detail = '上游完成后',
): BlueprintEdge {
  return {
    id: `${sourceId}-${targetId}`,
    sourceId,
    targetId,
    relation: 'handoff',
    handoffKind,
    ...(handoffKind === 'message' ? { message: detail } : { condition: detail }),
    sourceStrokeIds: [],
  };
}

function assignment(nodeId: string): AgentAssignment {
  return {
    id: `assignment-${nodeId}`,
    nodeId,
    agentId: `agent-${nodeId}`,
    status: 'accepted',
    contract: {
      revision: 1,
      goal: `${nodeId} goal`,
      inputNodeIds: [],
      expectedOutputs: [`${nodeId} output`],
      acceptanceCriteria: [`${nodeId} accepted`],
      toolIds: ['basic-movement'],
      evidenceIds: [],
    },
    createdAt: 1,
  };
}

function delivery(nodeId: string, inputArtifactIds: string[] = []): AgentDelivery {
  return {
    id: `delivery-${nodeId}`,
    assignmentId: `assignment-${nodeId}`,
    version: 1,
    summary: `${nodeId} summary`,
    assumptions: [],
    uncertainties: [],
    artifact: {
      schemaId: `lightory.test/${nodeId}`,
      payload: {},
      childSummary: `${nodeId} complete`,
      assumptions: [],
      inputArtifactIds,
      sourceAssignmentId: `assignment-${nodeId}`,
      sourceContractRevision: 1,
    },
    status: 'accepted',
  };
}

function agent(nodeId: string): AgentDefinition {
  return {
    id: `agent-${nodeId}`,
    name: `${nodeId} engineer`,
    capabilityIds: ['basic-movement'],
    knownLimitations: [],
    contextScope: 'assignment-only',
    fallibilityPolicyId: 'test-policy',
  };
}
