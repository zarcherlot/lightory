/// <reference lib="dom" />

import assert from 'node:assert/strict';

import { test } from 'vitest';

import { WAITING_BUBBLE_DURATION_SEC } from '../src/constants.js';
import { OfficeState } from '../src/office/engine/officeState.js';

test('done waiting bubble expires after its timer', () => {
  const officeState = new OfficeState();
  officeState.addAgent(1, 0, 0, undefined, true);

  officeState.showWaitingBubble(1, false);
  officeState.update(WAITING_BUBBLE_DURATION_SEC + 0.1);

  const character = officeState.characters.get(1);
  assert.equal(character?.bubbleType, null);
  assert.equal(character?.bubbleTimer, 0);
});

test('awaiting-input waiting bubble persists across delayed frames', () => {
  const officeState = new OfficeState();
  officeState.addAgent(1, 0, 0, undefined, true);

  officeState.showWaitingBubble(1, true);
  officeState.update(WAITING_BUBBLE_DURATION_SEC + 10);

  const character = officeState.characters.get(1);
  assert.equal(character?.bubbleType, 'waiting');
  assert.equal(character?.waitingAwaitingInput, true);
  assert.equal(character?.bubbleTimer, WAITING_BUBBLE_DURATION_SEC);
});
