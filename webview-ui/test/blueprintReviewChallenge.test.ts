import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { AgentAssignment } from '../src/blueprint/domain/types.js';
import {
  blueprintFixtureCatalog,
  familyTreasureHuntDefinition,
  museumGuideDefinition,
} from '../src/blueprint/fixtures/index.js';
import {
  listReviewChallengeCandidates,
  selectReviewChallenge,
} from '../src/blueprint/simulation/reviewChallengeEngine.js';
import { loadTaskDefinition } from '../src/blueprint/tasks/taskDefinitionLoader.js';

test('lists task-compatible small-agent mistakes in task priority order', () => {
  const task = loadTaskDefinition(familyTreasureHuntDefinition, blueprintFixtureCatalog);
  const candidates = listReviewChallengeCandidates({
    task,
    catalog: blueprintFixtureCatalog,
    assignments: [assignment('move', 'route-engineer'), assignment('voice', 'voice-engineer')],
  });

  assert.deepEqual(candidates.map(({ id }) => id), [
    'family-route-low-speed',
    'family-route-wrong-distance',
  ]);
});

test('activates only one challenge per project using the first compatible task fault', () => {
  const task = loadTaskDefinition(familyTreasureHuntDefinition, blueprintFixtureCatalog);
  const challenge = selectReviewChallenge({
    task,
    catalog: blueprintFixtureCatalog,
    assignments: [assignment('move', 'route-engineer'), assignment('voice', 'voice-engineer')],
    existingDebugSessionCount: 0,
  });

  assert.equal(challenge?.fault.id, 'family-route-low-speed');
  assert.equal(challenge?.mode, 'task-rule');
  assert.equal(challenge?.simulatorOnly, true);
});

test('does not activate another small-agent mistake after a project already has a review challenge', () => {
  const task = loadTaskDefinition(familyTreasureHuntDefinition, blueprintFixtureCatalog);
  const challenge = selectReviewChallenge({
    task,
    catalog: blueprintFixtureCatalog,
    assignments: [assignment('move', 'route-engineer'), assignment('voice', 'voice-engineer')],
    existingDebugSessionCount: 1,
  });

  assert.equal(challenge, undefined);
});

test('ignores faults for agents that are not assigned in the current project', () => {
  const task = loadTaskDefinition(museumGuideDefinition, blueprintFixtureCatalog);
  const candidates = listReviewChallengeCandidates({
    task,
    catalog: blueprintFixtureCatalog,
    assignments: [assignment('move', 'route-engineer')],
  });

  assert.deepEqual(candidates, []);
});

function assignment(nodeId: string, agentId: string): AgentAssignment {
  return {
    id: `assignment-${nodeId}`,
    nodeId,
    agentId,
    status: 'accepted',
    contract: {
      revision: 1,
      goal: `${nodeId} goal`,
      inputNodeIds: [],
      expectedOutputs: [`${nodeId} output`],
      acceptanceCriteria: [`${nodeId} accepted`],
      toolIds: agentId === 'voice-engineer' ? ['voice'] : ['basic-movement'],
      evidenceIds: [],
    },
    createdAt: 1,
  };
}
