import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { BlueprintCommand } from '../src/blueprint/domain/commands.js';
import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import { applyBlueprintCommand } from '../src/blueprint/domain/reducer.js';
import type { ExperimentExpectation, SceneEntity } from '../src/blueprint/domain/types.js';
import {
  evaluateExperiment,
  findFirstExperimentDifference,
} from '../src/blueprint/test-field/experimentEvaluation.js';
import type { SimulationRun } from '../src/blueprint/test-field/simulationTypes.js';

test('stores child-authored expectations in the blueprint and removes a deleted target reference', () => {
  const target = sceneEntity('treasure', 'target-landmark', '宝藏');
  const document = {
    ...createEmptyBlueprintDocument(),
    scene: { ...createEmptyBlueprintDocument().scene, entities: [target] },
  };
  const withExpectation = applyBlueprintCommand(document, command({
    type: 'experiment.expectations-set',
    expectations: [
      { id: 'expect-target', kind: 'reach-target', targetEntityId: target.id },
      { id: 'expect-safe', kind: 'avoid-collision' },
    ],
  }));
  assert.equal(withExpectation.experimentExpectations.length, 2);

  const withoutTarget = applyBlueprintCommand(withExpectation, command({
    type: 'scene.entity-delete', entityId: target.id,
  }));
  assert.deepEqual(withoutTarget.experimentExpectations, [{ id: 'expect-safe', kind: 'avoid-collision' }]);
});

test('keeps evidence pending before playback and passes generic target, speech and safety checks', () => {
  const scene = sceneWithTarget('museum-stop', '一号展品');
  const expectations: ExperimentExpectation[] = [
    { id: 'target', kind: 'reach-target', targetEntityId: 'museum-stop' },
    { id: 'speech', kind: 'say-text', text: '欢迎来到一号展厅' },
    { id: 'safe', kind: 'avoid-collision' },
  ];
  const run = simulationRun({
    reachedTargetIds: ['museum-stop'],
    speechText: '欢迎来到一号展厅',
  });

  assert.equal(evaluateExperiment({ expectations, run, scene, playbackIndex: -1 }).status, 'pending');
  const completed = evaluateExperiment({ expectations, run, scene, playbackIndex: 1 });
  assert.equal(completed.status, 'passed');
  assert.ok(completed.results.every(({ status }) => status === 'passed'));
});

test('pauses at collision as the first observable difference', () => {
  const scene = sceneWithTarget('treasure', '宝藏');
  const expectations: ExperimentExpectation[] = [
    { id: 'target', kind: 'reach-target', targetEntityId: 'treasure' },
    { id: 'safe', kind: 'avoid-collision' },
  ];
  const run = simulationRun({ blockedAt: 0, reachedTargetIds: [] });

  assert.equal(findFirstExperimentDifference({ expectations, run, scene }), 0);
  const evaluation = evaluateExperiment({ expectations, run, scene, playbackIndex: 0 });
  assert.equal(evaluation.status, 'failed');
  assert.match(evaluation.results.find(({ kind }) => kind === 'avoid-collision')?.actual ?? '', /书架/);
});

test('detects speech before target as an observable ordering difference', () => {
  const scene = sceneWithTarget('treasure', '宝藏');
  const expectations: ExperimentExpectation[] = [{
    id: 'order', kind: 'speech-after-target', targetEntityId: 'treasure', text: '找到宝藏',
  }];
  const run = simulationRun({
    reachedTargetIds: ['treasure'], speechText: '找到宝藏', speechFirst: true,
  });

  assert.equal(findFirstExperimentDifference({ expectations, run, scene }), 0);
  const evaluation = evaluateExperiment({ expectations, run, scene, playbackIndex: 0 });
  assert.equal(evaluation.status, 'failed');
  assert.match(evaluation.results[0]?.actual ?? '', /到达目标之前/);
});

test('does not mistake same-batch speech and movement for ordered execution', () => {
  const scene = sceneWithTarget('treasure', '宝藏');
  const expectations: ExperimentExpectation[] = [{
    id: 'order', kind: 'speech-after-target', targetEntityId: 'treasure', text: '找到宝藏',
  }];
  const run = simulationRun({ reachedTargetIds: ['treasure'], speechText: '找到宝藏' });
  run.events[1]!.batchIndex = run.events[0]!.batchIndex;
  run.events[1]!.parallel = true;
  run.events[0]!.parallel = true;

  const evaluation = evaluateExperiment({ expectations, run, scene, playbackIndex: 1 });
  assert.equal(evaluation.status, 'failed');
  assert.match(evaluation.results[0]?.actual ?? '', /同一批同时发生/);
});

test('uses the same evaluator for arbitrary task labels without task-id branches', () => {
  for (const [targetId, label, speech] of [
    ['family-target', '卧室宝箱', '找到宝藏'],
    ['museum-target', '恐龙化石', '这是恐龙化石'],
  ]) {
    const expectations: ExperimentExpectation[] = [
      { id: `${targetId}-target`, kind: 'reach-target', targetEntityId: targetId },
      { id: `${targetId}-speech`, kind: 'say-text', text: speech },
    ];
    const result = evaluateExperiment({
      expectations,
      run: simulationRun({ reachedTargetIds: [targetId], speechText: speech }),
      scene: sceneWithTarget(targetId, label),
      playbackIndex: 1,
    });
    assert.equal(result.status, 'passed');
  }
});

function simulationRun(input: {
  reachedTargetIds: string[];
  speechText?: string;
  blockedAt?: number;
  speechFirst?: boolean;
}): SimulationRun {
  const moveBlocked = input.blockedAt === 0;
  return {
    id: 'run',
    planId: 'plan',
    status: moveBlocked ? 'blocked' : 'completed',
    initialPose: { xMeters: 1, yMeters: 5, headingDegrees: 0 },
    finalPose: { xMeters: 1, yMeters: 3, headingDegrees: 0 },
    robotRadiusMeters: 0.375,
    path: [],
    reachedTargetIds: input.reachedTargetIds,
    issues: moveBlocked ? [{ code: 'obstacle_collision', message: '碰到书架' }] : [],
    events: [
      ...(input.speechFirst && input.speechText ? [speechEvent(input.speechText, 0)] : []),
      {
        id: 'move', stepId: 'move', batchIndex: input.speechFirst ? 1 : 0, parallel: false, kind: 'move',
        status: moveBlocked ? 'blocked' : 'completed', title: '前进',
        detail: moveBlocked ? '小车将碰到“书架”，安全系统已停止实验。' : '到达目标。',
        pose: { xMeters: 1, yMeters: 3, headingDegrees: 0 }, pathEndIndex: 0,
      },
      ...(!moveBlocked && input.speechText && !input.speechFirst ? [speechEvent(input.speechText, 1)] : []),
    ],
  };
}

function speechEvent(text: string, batchIndex: number) {
  return {
    id: 'speech', stepId: 'speech', batchIndex, parallel: false, kind: 'speech' as const,
    status: 'completed' as const, title: '播报', detail: '语音播报完成。',
    pose: batchIndex === 0
      ? { xMeters: 1, yMeters: 5, headingDegrees: 0 }
      : { xMeters: 1, yMeters: 3, headingDegrees: 0 },
    pathEndIndex: 0, speechText: text,
  };
}

function sceneWithTarget(id: string, label: string) {
  return {
    ...createEmptyBlueprintDocument().scene,
    entities: [sceneEntity(id, 'target-landmark', label)],
  };
}

function sceneEntity(
  id: string,
  kind: SceneEntity['kind'],
  label: string,
): SceneEntity {
  return {
    id, kind, label, meaning: label, position: { x: 0.625, y: 2.625 },
    size: { width: 0.75, height: 0.75 }, rotation: 0, sourceStrokeIds: [],
  };
}

function command(input: Record<string, unknown>): BlueprintCommand {
  return {
    ...input,
    revision: { id: `revision-${String(input.type)}`, createdAt: 1, reason: String(input.type) },
  } as BlueprintCommand;
}
