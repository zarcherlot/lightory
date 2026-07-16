import type { ExperimentExpectation, SceneDefinition } from '../domain/types.js';
import type { SimulationRun } from './simulationTypes.js';

export interface ExpectationResult {
  expectationId: string;
  kind: ExperimentExpectation['kind'];
  status: 'pending' | 'passed' | 'failed';
  expected: string;
  actual: string;
  differenceEventIndex?: number;
}

export interface ExperimentEvaluation {
  status: 'pending' | 'passed' | 'failed';
  results: ExpectationResult[];
  firstDifferenceEventIndex?: number;
}

export function evaluateExperiment(input: {
  expectations: ExperimentExpectation[];
  run: SimulationRun;
  scene: SceneDefinition;
  playbackIndex: number;
}): ExperimentEvaluation {
  const atEnd = input.run.events.length === 0
    ? input.playbackIndex >= 0
    : input.playbackIndex >= input.run.events.length - 1;
  const visibleEvents = input.run.events.slice(0, Math.max(0, input.playbackIndex + 1));
  const results = input.expectations.map((expectation): ExpectationResult => {
    if (expectation.kind === 'avoid-collision') {
      const collisionIndex = input.run.events.findIndex(({ status }) => status === 'blocked');
      const collision = collisionIndex >= 0 ? input.run.events[collisionIndex] : undefined;
      if (collision && collisionIndex <= input.playbackIndex) {
        return {
          expectationId: expectation.id,
          kind: expectation.kind,
          status: 'failed',
          expected: '小车安全完成，不碰撞也不越界',
          actual: collision.detail,
          differenceEventIndex: collisionIndex,
        };
      }
      return {
        expectationId: expectation.id,
        kind: expectation.kind,
        status: atEnd ? 'passed' : 'pending',
        expected: '小车安全完成，不碰撞也不越界',
        actual: atEnd ? '全过程没有触发安全停止' : '等待实验完成',
      };
    }

    if (expectation.kind === 'say-text') {
      const speechEvents = visibleEvents.filter(({ kind }) => kind === 'speech');
      const matched = speechEvents.some(({ speechText }) => speechText?.trim() === expectation.text);
      if (matched) {
        return {
          expectationId: expectation.id,
          kind: expectation.kind,
          status: 'passed',
          expected: `小车说：“${expectation.text}”`,
          actual: `听到：“${expectation.text}”`,
        };
      }
      if (!atEnd) {
        return {
          expectationId: expectation.id,
          kind: expectation.kind,
          status: 'pending',
          expected: `小车说：“${expectation.text}”`,
          actual: speechEvents.length > 0
            ? `目前听到：“${speechEvents.map(({ speechText }) => speechText).join('、')}”`
            : '等待语音步骤',
        };
      }
      const actualSpeech = input.run.events
        .filter(({ kind }) => kind === 'speech')
        .map(({ speechText }) => speechText)
        .filter(Boolean);
      return {
        expectationId: expectation.id,
        kind: expectation.kind,
        status: 'failed',
        expected: `小车说：“${expectation.text}”`,
        actual: actualSpeech.length > 0 ? `实际说：“${actualSpeech.join('、')}”` : '小车没有说话',
        differenceEventIndex: Math.max(0, input.run.events.length - 1),
      };
    }

    if (expectation.kind === 'speech-after-target') {
      const target = input.scene.entities.find(({ id }) => id === expectation.targetEntityId);
      const targetEventIndex = target
        ? input.run.events.findIndex(({ pose }) => poseReachesTarget(pose, input.run.robotRadiusMeters, target))
        : -1;
      const speechEventIndex = input.run.events.findIndex(
        ({ kind, speechText }) => kind === 'speech' && speechText?.trim() === expectation.text,
      );
      const targetEvent = targetEventIndex >= 0 ? input.run.events[targetEventIndex] : undefined;
      const speechEvent = speechEventIndex >= 0 ? input.run.events[speechEventIndex] : undefined;
      const speechIsAfterTarget = Boolean(
        targetEvent && speechEvent && speechEvent.batchIndex > targetEvent.batchIndex,
      );
      const expected = `到达“${target?.label ?? '目标'}”后再说：“${expectation.text}”`;
      if (speechEventIndex >= 0 && speechEventIndex <= input.playbackIndex && !speechIsAfterTarget) {
        return {
          expectationId: expectation.id,
          kind: expectation.kind,
          status: 'failed',
          expected,
          actual: targetEventIndex < 0
            ? '小车还没到达目标就开始说话'
            : speechEvent?.batchIndex === targetEvent?.batchIndex
              ? '移动和语音在同一批同时发生'
              : '语音发生在到达目标之前',
          differenceEventIndex: speechEventIndex,
        };
      }
      if (speechIsAfterTarget && speechEventIndex <= input.playbackIndex) {
        return {
          expectationId: expectation.id,
          kind: expectation.kind,
          status: 'passed',
          expected,
          actual: `先到达目标，再播报：“${expectation.text}”`,
        };
      }
      if (!atEnd) {
        return {
          expectationId: expectation.id,
          kind: expectation.kind,
          status: 'pending',
          expected,
          actual: targetEventIndex >= 0 && targetEventIndex <= input.playbackIndex ? '已经到达，等待播报' : '等待到达目标',
        };
      }
      return {
        expectationId: expectation.id,
        kind: expectation.kind,
        status: 'failed',
        expected,
        actual: speechEventIndex < 0 ? '没有找到预期的语音' : '实验结束时仍未按预期顺序完成',
        differenceEventIndex: speechEventIndex >= 0 ? speechEventIndex : Math.max(0, input.run.events.length - 1),
      };
    }

    const target = input.scene.entities.find(({ id }) => id === expectation.targetEntityId);
    const expected = `最终到达“${target?.label ?? '已删除的目标'}”`;
    if (!atEnd) {
      return {
        expectationId: expectation.id,
        kind: expectation.kind,
        status: 'pending',
        expected,
        actual: '等待最终位置',
      };
    }
    const passed = input.run.reachedTargetIds.includes(expectation.targetEntityId);
    return {
      expectationId: expectation.id,
      kind: expectation.kind,
      status: passed ? 'passed' : 'failed',
      expected,
      actual: passed
        ? `最终位置在“${target?.label ?? '目标'}”范围内`
        : `最终停在 (${formatNumber(input.run.finalPose.xMeters)}, ${formatNumber(input.run.finalPose.yMeters)}) 米`,
      ...(passed ? {} : { differenceEventIndex: Math.max(0, input.run.events.length - 1) }),
    };
  });

  const firstDifferenceEventIndex = results.reduce<number | undefined>((first, result) => {
    if (result.status !== 'failed' || result.differenceEventIndex === undefined) return first;
    return first === undefined ? result.differenceEventIndex : Math.min(first, result.differenceEventIndex);
  }, undefined);

  return {
    status: results.some(({ status }) => status === 'failed')
      ? 'failed'
      : results.length > 0 && results.every(({ status }) => status === 'passed')
        ? 'passed'
        : 'pending',
    results,
    ...(firstDifferenceEventIndex === undefined ? {} : { firstDifferenceEventIndex }),
  };
}

export function findFirstExperimentDifference(input: {
  expectations: ExperimentExpectation[];
  run: SimulationRun;
  scene: SceneDefinition;
}): number | undefined {
  return evaluateExperiment({
    ...input,
    playbackIndex: Math.max(0, input.run.events.length - 1),
  }).firstDifferenceEventIndex;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function poseReachesTarget(
  pose: { xMeters: number; yMeters: number },
  radius: number,
  target: SceneDefinition['entities'][number],
): boolean {
  const centerX = target.position.x + target.size.width / 2;
  const centerY = target.position.y + target.size.height / 2;
  const angle = (-target.rotation * Math.PI) / 180;
  const dx = pose.xMeters - centerX;
  const dy = pose.yMeters - centerY;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  const closestX = Math.max(-target.size.width / 2, Math.min(localX, target.size.width / 2));
  const closestY = Math.max(-target.size.height / 2, Math.min(localY, target.size.height / 2));
  return (localX - closestX) ** 2 + (localY - closestY) ** 2 <= radius ** 2;
}
