import assert from 'node:assert/strict';

import { test } from 'vitest';

import { compileAcceptedBlueprint } from '../src/blueprint/compiler/blueprintCompiler.js';
import {
  MOVEMENT_ARTIFACT_SCHEMA_ID,
  SPEECH_ARTIFACT_SCHEMA_ID,
} from '../src/blueprint/domain/artifactSchemas.js';
import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import type {
  AgentAssignment,
  AgentDelivery,
  BlueprintDocument,
  BlueprintEdge,
  BlueprintNode,
} from '../src/blueprint/domain/types.js';
import { getMockRobotTools } from '../src/robot/mockRobotApi.js';

test('preserves a child-authored move-to-speech dependency in RobotPlan', () => {
  const result = compileDocument(
    document(
      [node('move', '移动模块'), node('speech', '语音模块')],
      [edge('move', 'speech')],
      [
        artifactDelivery('move', MOVEMENT_ARTIFACT_SCHEMA_ID, {
          actions: [{ type: 'driveDistance', distanceMeters: 1 }],
          acceptanceCoverage: [],
        }),
        artifactDelivery('speech', SPEECH_ARTIFACT_SCHEMA_ID, {
          text: '找到宝藏啦',
          trigger: 'after-input',
          acceptanceCoverage: [],
        }, ['delivery-move']),
      ],
    ),
  );

  assert.equal(result.ok, true);
  const move = result.plan?.steps.find(({ tool }) => tool === 'base.driveDistance');
  const stop = result.plan?.steps.find(({ tool }) => tool === 'base.stop');
  const speech = result.plan?.steps.find(({ tool }) => tool === 'speech.say');
  assert.deepEqual(stop?.dependsOn, [move?.id]);
  assert.deepEqual(speech?.dependsOn, [stop?.id]);
  assert.deepEqual(result.preview[1]?.dependsOnNodeIds, ['move']);
});

test('keeps unconnected movement and speech modules parallel', () => {
  const result = compileDocument(
    document(
      [node('move'), node('speech')],
      [],
      [
        artifactDelivery('move', MOVEMENT_ARTIFACT_SCHEMA_ID, {
          actions: [{ type: 'rotateAngle', angleRad: Math.PI / 2 }],
          acceptanceCoverage: [],
        }),
        artifactDelivery('speech', SPEECH_ARTIFACT_SCHEMA_ID, {
          text: '出发',
          trigger: 'start',
          acceptanceCoverage: [],
        }),
      ],
    ),
  );

  assert.equal(result.ok, true);
  assert.equal(result.plan?.steps.find(({ tool }) => tool === 'base.rotateAngle')?.dependsOn, undefined);
  assert.equal(result.plan?.steps.find(({ tool }) => tool === 'speech.say')?.dependsOn, undefined);
});

test('compiles a safe but incomplete movement-only blueprint', () => {
  const result = compileDocument(
    document(
      [node('move')],
      [],
      [artifactDelivery('move', MOVEMENT_ARTIFACT_SCHEMA_ID, {
        actions: [{ type: 'driveDistance', distanceMeters: 3 }],
        acceptanceCoverage: [],
      })],
    ),
  );

  assert.equal(result.ok, true);
  assert.equal(result.plan?.steps.filter(({ tool }) => tool === 'base.driveDistance').length, 2);
  assert.equal(result.plan?.requiresUserConfirmation, true);
  assert.equal(result.plan?.risk, 'high');
});

test('uses an end module completion condition and adds a final safety stop', () => {
  const end: BlueprintNode = {
    ...node('end', '任务完成'),
    kind: 'end',
    control: {
      trigger: 'manual',
      inputInformation: '收到移动结果',
      handoffInformation: '',
      completionCondition: '到达宝藏位置',
      finishAction: 'stop',
    },
  };
  const result = compileDocument(document(
    [node('move', '移动模块'), end],
    [edge('move', 'end')],
    [artifactDelivery('move', MOVEMENT_ARTIFACT_SCHEMA_ID, {
      actions: [{ type: 'driveDistance', distanceMeters: 1 }],
      acceptanceCoverage: [],
    })],
  ));

  assert.equal(result.ok, true);
  assert.equal(result.preview.at(-1)?.description, '完成“到达宝藏位置”后安全停车');
  assert.equal(result.plan?.steps.at(-1)?.tool, 'base.stop');
  assert.ok(result.plan?.steps.at(-1)?.dependsOn?.length);
});

test('blocks unsafe speed instead of silently correcting it', () => {
  const result = compileDocument(
    document(
      [node('move')],
      [],
      [artifactDelivery('move', MOVEMENT_ARTIFACT_SCHEMA_ID, {
        actions: [{ type: 'driveDistance', distanceMeters: 1, maxSpeedMps: 0.8 }],
        acceptanceCoverage: [],
      })],
    ),
  );

  assert.equal(result.ok, false);
  assert.match(result.errors[0]?.message ?? '', /0.5/);
  assert.equal(result.plan, undefined);
});

test('requires accepted current artifacts and supported schemas', () => {
  const dirty = document(
    [node('move')],
    [],
    [artifactDelivery('move', MOVEMENT_ARTIFACT_SCHEMA_ID, { actions: [], acceptanceCoverage: [] })],
  );
  dirty.assignments[0]!.contract.revision = 2;
  const dirtyResult = compileDocument(dirty);
  assert.equal(dirtyResult.ok, false);
  assert.ok(dirtyResult.errors.some(({ code }) => code === 'artifact_not_accepted'));

  const legacyResult = compileDocument(
    document([node('move')], [], [artifactDelivery('move', 'legacy/output', {})]),
  );
  assert.equal(legacyResult.ok, false);
  assert.ok(legacyResult.errors.some(({ code }) => code === 'unsupported_artifact'));
});

function compileDocument(value: BlueprintDocument) {
  let id = 0;
  return compileAcceptedBlueprint({
    document: value,
    robotTools: getMockRobotTools(),
    padId: 'test-pad',
    sessionId: 'test-session',
    createId: (prefix) => `${prefix}-${++id}`,
    now: () => new Date('2026-07-16T00:00:00.000Z'),
  });
}

function document(
  nodes: BlueprintNode[],
  edges: BlueprintEdge[],
  deliveries: AgentDelivery[],
): BlueprintDocument {
  const assignments = nodes.filter(({ kind }) => kind === 'function').map(({ id }) => assignment(id));
  return {
    ...createEmptyBlueprintDocument(),
    nodes,
    edges,
    assignments,
    deliveries,
    revisions: [{ id: 'child-revision', createdAt: 1, reason: 'child blueprint' }],
  };
}

function node(id: string, label = id): BlueprintNode {
  return {
    id,
    kind: 'function',
    label,
    position: { x: 0, y: 0 },
    size: { width: 180, height: 120 },
    sourceStrokeIds: [],
    recognition: { source: 'manual' },
  };
}

function edge(sourceId: string, targetId: string): BlueprintEdge {
  return {
    id: `${sourceId}-${targetId}`,
    sourceId,
    targetId,
    relation: 'handoff',
    handoffKind: 'artifact',
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
      acceptanceCriteria: [],
      toolIds: [nodeId === 'speech' ? 'voice' : 'basic-movement'],
      evidenceIds: [],
    },
    createdAt: 1,
  };
}

function artifactDelivery(
  nodeId: string,
  schemaId: string,
  payload: Record<string, unknown>,
  inputArtifactIds: string[] = [],
): AgentDelivery {
  return {
    id: `delivery-${nodeId}`,
    assignmentId: `assignment-${nodeId}`,
    version: 1,
    summary: `${nodeId} complete`,
    assumptions: [],
    uncertainties: [],
    artifact: {
      schemaId,
      payload,
      childSummary: `${nodeId} complete`,
      assumptions: [],
      inputArtifactIds,
      sourceAssignmentId: `assignment-${nodeId}`,
      sourceContractRevision: 1,
    },
    status: 'accepted',
  };
}
