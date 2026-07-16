import assert from 'node:assert/strict';

import { test } from 'vitest';

import { createEmptySceneDefinition } from '../src/blueprint/domain/scene.js';
import type { SceneDefinition, SceneEntity } from '../src/blueprint/domain/types.js';
import { simulateRobotPlan } from '../src/blueprint/test-field/simulationEngine.js';
import type { RobotPlan, RobotPlanStep } from '../src/robot/types.js';

test('executes movement, stop and speech from the robot start pose', () => {
  const scene = withEntities([
    robotStart(),
    entity('target', 'target-landmark', 1, 3, 0.75, 0.75),
  ]);
  const result = simulate(scene, [
    step('move', 'base.driveDistance', { distanceMeters: 2 }),
    step('stop', 'base.stop', {}, ['move']),
    step('speech', 'speech.say', { text: '找到宝藏啦' }, ['stop']),
  ]);

  assert.equal(result.status, 'completed');
  assert.equal(result.finalPose.xMeters, 1.375);
  assert.ok(Math.abs(result.finalPose.yMeters - 3.375) < 0.000001);
  assert.deepEqual(result.reachedTargetIds, ['target']);
  assert.deepEqual(result.events.map(({ kind }) => kind), ['move', 'stop', 'speech']);
  assert.equal(result.events[2]?.speechText, '找到宝藏啦');
});

test('uses child-visible heading semantics where positive robot angle turns left', () => {
  const result = simulate(withEntities([robotStart()]), [
    step('turn', 'base.rotateAngle', { angleRad: Math.PI / 2 }),
    step('move', 'base.driveDistance', { distanceMeters: 0.5 }, ['turn']),
  ]);

  assert.equal(result.status, 'completed');
  assert.equal(result.events[0]?.title, '左转 90°');
  assert.equal(result.finalPose.headingDegrees, 270);
  assert.ok(result.finalPose.xMeters < result.initialPose.xMeters);
  assert.ok(Math.abs(result.finalPose.yMeters - result.initialPose.yMeters) < 0.000001);
});

test('stops at the first obstacle and records observable collision evidence', () => {
  const scene = withEntities([
    robotStart(),
    entity('bookcase', 'obstacle', 0.5, 4.25, 2, 0.3),
  ]);
  const result = simulate(scene, [step('move', 'base.driveDistance', { distanceMeters: 2 })]);

  assert.equal(result.status, 'blocked');
  assert.equal(result.events[0]?.status, 'blocked');
  assert.equal(result.events[0]?.collisionEntityId, 'bookcase');
  assert.match(result.events[0]?.detail ?? '', /安全系统已停止实验/);
  assert.ok(result.finalPose.yMeters > 4.5);
});

test('stops before crossing the field boundary', () => {
  const start = { ...robotStart(), position: { x: 1, y: 0.25 } };
  const result = simulate(withEntities([start]), [
    step('move', 'base.driveDistance', { distanceMeters: 2 }),
  ]);

  assert.equal(result.status, 'blocked');
  assert.equal(result.issues[0]?.code, 'field_boundary');
  assert.ok(result.finalPose.yMeters >= result.robotRadiusMeters);
});

test('blocks two parallel base actions but allows speech beside movement', () => {
  const scene = withEntities([robotStart()]);
  const conflict = simulate(scene, [
    step('move-a', 'base.driveDistance', { distanceMeters: 0.5 }),
    step('move-b', 'base.rotateAngle', { angleRad: 0.5 }),
  ]);
  assert.equal(conflict.status, 'blocked');
  assert.equal(conflict.issues[0]?.code, 'parallel_base_conflict');

  const allowed = simulate(scene, [
    step('speech', 'speech.say', { text: '出发' }),
    step('move', 'base.driveDistance', { distanceMeters: 0.5 }),
  ]);
  assert.equal(allowed.status, 'completed');
  assert.ok(allowed.events.every(({ parallel }) => parallel));
});

test('reports a missing robot start without inventing a pose', () => {
  const result = simulate(createEmptySceneDefinition(), [
    step('speech', 'speech.say', { text: '你好' }),
  ]);
  assert.equal(result.status, 'invalid');
  assert.equal(result.issues[0]?.code, 'robot_start_missing');
});

function simulate(scene: SceneDefinition, steps: RobotPlanStep[]) {
  let id = 0;
  return simulateRobotPlan({
    scene,
    plan: plan(steps),
    createId: (prefix) => `${prefix}-${++id}`,
  });
}

function plan(steps: RobotPlanStep[]): RobotPlan {
  return {
    schemaVersion: 'robot-plan/v1',
    planId: 'test-plan',
    createdAt: '2026-07-16T00:00:00.000Z',
    createdBy: { padId: 'test', sessionId: 'test', agentRunId: 'test' },
    intent: 'test simulation',
    risk: 'high',
    requiresUserConfirmation: true,
    assumptions: [],
    steps,
    constraints: {
      maxDurationMs: 60_000,
      maxSteps: steps.length,
      allowedTools: [...new Set(steps.map(({ tool }) => tool))],
    },
  };
}

function step(
  id: string,
  tool: string,
  args: Record<string, unknown>,
  dependsOn?: string[],
): RobotPlanStep {
  return { id, tool, args, ...(dependsOn ? { dependsOn } : {}) };
}

function withEntities(entities: SceneEntity[]): SceneDefinition {
  return { ...createEmptySceneDefinition(), entities };
}

function robotStart(): SceneEntity {
  return entity('robot', 'robot-start', 1, 5, 0.75, 0.75);
}

function entity(
  id: string,
  kind: SceneEntity['kind'],
  x: number,
  y: number,
  width: number,
  height: number,
): SceneEntity {
  return {
    id,
    kind,
    label: id,
    meaning: id,
    position: { x, y },
    size: { width, height },
    rotation: 0,
    sourceStrokeIds: [],
  };
}
