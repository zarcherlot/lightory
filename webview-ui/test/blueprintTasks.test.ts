import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  blueprintFixtureCatalog,
  familyTreasureHuntDefinition,
  museumGuideDefinition,
} from '../src/blueprint/fixtures/index.js';
import {
  loadTaskDefinition,
  TaskDefinitionLoadError,
} from '../src/blueprint/tasks/taskDefinitionLoader.js';

test('loads family treasure hunt and museum guide through the same task schema', () => {
  const familyTask = loadTaskDefinition(familyTreasureHuntDefinition, blueprintFixtureCatalog);
  const museumTask = loadTaskDefinition(museumGuideDefinition, blueprintFixtureCatalog);

  assert.equal(familyTask.schemaVersion, 'lightory-task/v1');
  assert.equal(museumTask.schemaVersion, 'lightory-task/v1');
  assert.deepEqual(familyTask.stageGates, museumTask.stageGates);
  assert.deepEqual(familyTask.availableToolIds, ['voice', 'basic-movement']);
  assert.equal(familyTask.id, 'family-treasure-hunt');
  assert.equal(museumTask.id, 'museum-guide');
});

test('rejects malformed schemas and missing catalog references', () => {
  const invalid = {
    ...familyTreasureHuntDefinition,
    schemaVersion: 'lightory-task/v2',
    availableToolIds: ['voice', 'teleport'],
    faultScenarioIds: ['missing-fault'],
  };

  assert.throws(
    () => loadTaskDefinition(invalid, blueprintFixtureCatalog),
    (error: unknown) => {
      assert.equal(error instanceof TaskDefinitionLoadError, true);
      if (!(error instanceof TaskDefinitionLoadError)) return false;
      assert.equal(error.issues.some((issue) => issue.includes('schemaVersion')), true);
      assert.equal(error.issues.some((issue) => issue.includes('missing Tool teleport')), true);
      assert.equal(error.issues.some((issue) => issue.includes('missing fault scenario')), true);
      return true;
    },
  );
});

test('rejects invalid JSON rather than evaluating task content', () => {
  assert.throws(
    () => loadTaskDefinition('{"schemaVersion":', blueprintFixtureCatalog),
    TaskDefinitionLoadError,
  );
});
