/// <reference lib="dom" />

import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  getMockRobotTools,
  MockRobotApiClient,
  MockRobotEventBus,
} from '../src/robot/mockRobotApi.js';
import {
  buildDriveDistancePlan,
  buildMoveToPoiPlan,
  buildRememberPoiPlan,
  parseRobotIntent,
} from '../src/robot/robotPlanBuilder.js';
import { validateRobotPlanLocally } from '../src/robot/robotPlanSchema.js';
import type { RobotApiEnvelope, RobotEvent } from '../src/robot/types.js';
import { HttpVideoStreamClient, MockVideoStreamClient } from '../src/robot/videoStreamClient.js';

const ctx = { padId: 'test-pad', sessionId: 'test-session' };

test('builds and validates a robot-plan/v1 memory plan', () => {
  const plan = buildRememberPoiPlan(ctx, '主卧');
  const validation = validateRobotPlanLocally(plan, getMockRobotTools());

  assert.equal(plan.schemaVersion, 'robot-plan/v1');
  assert.equal(plan.steps[1]?.tool, 'memory.upsertPoi');
  assert.equal(validation.ok, true);
});

test('local validation catches missing tools', () => {
  const plan = buildRememberPoiPlan(ctx, '主卧');
  const validation = validateRobotPlanLocally(
    {
      ...plan,
      steps: [{ id: 's1', tool: 'missing.tool', args: {} }],
      constraints: { ...plan.constraints, allowedTools: ['missing.tool'] },
    },
    getMockRobotTools(),
  );

  assert.equal(validation.ok, false);
  assert.equal(validation.errors[0]?.code, 'missing_tool');
});

test('local validation requires confirmation for high-risk movement', () => {
  const plan = buildMoveToPoiPlan(ctx, '主卧');
  const validation = validateRobotPlanLocally(
    { ...plan, requiresUserConfirmation: false },
    getMockRobotTools(),
  );

  assert.equal(validation.ok, false);
  assert.equal(
    validation.errors.some((error) => error.code === 'confirmation_required'),
    true,
  );
});

test('parses distance, rotation, and velocity profile robot intents', () => {
  assert.deepEqual(parseRobotIntent('让小车前进2m'), {
    type: 'driveDistance',
    distanceMeters: 2,
  });
  assert.deepEqual(parseRobotIntent('让小车旋转1圈'), {
    type: 'rotateAngle',
    angleRad: Math.PI * 2,
  });

  const backward = parseRobotIntent('控制小车加点速度后退1s');
  assert.equal(backward?.type, 'velocityProfile');
  assert.equal(
    backward?.type === 'velocityProfile'
      ? backward.segments.reduce((sum, segment) => sum + segment.durationMs, 0)
      : 0,
    1000,
  );

  const figureEight = parseRobotIntent('让小车画个八字');
  assert.equal(figureEight?.type, 'velocityProfile');
  assert.equal(figureEight?.type === 'velocityProfile' ? figureEight.segments.length : 0, 2);
});

test('builds header-safe plan ids for Chinese intents', () => {
  const plan = buildDriveDistancePlan(ctx, 2);
  assert.match(plan.planId, /^[a-z0-9_-]+$/);
});

test('mock robot emits step and done events while executing a plan', async () => {
  const events = new MockRobotEventBus();
  const api = new MockRobotApiClient(events);
  const seen: RobotEvent['type'][] = [];
  events.subscribe((event) => seen.push(event.type));

  const plan = buildRememberPoiPlan(ctx, '主卧');
  const validation = await api.validatePlan(plan);
  assert.equal(validation.ok, true);

  await api.submitPlan(plan);
  await api.executePlan(plan.planId);
  await waitFor(() => seen.includes('plan.done'));

  assert.deepEqual(
    seen.filter((type) => type === 'plan.step.started' || type === 'plan.step.done'),
    ['plan.step.started', 'plan.step.done', 'plan.step.started', 'plan.step.done'],
  );
  assert.equal((await api.getPlanState(plan.planId)).status, 'done');
});

test('mock video stream client exposes stream metadata lifecycle', async () => {
  const video = new MockVideoStreamClient();
  const stream = await video.start('monitor');

  assert.equal(stream.profile, 'monitor');
  assert.equal(stream.transport, 'mjpeg');
  assert.deepEqual(await video.getState(stream.streamId), stream);

  await video.stop(stream.streamId);
  assert.equal(await video.getState(stream.streamId), null);
});

test('http video stream client starts video through robot-api/v1 envelope', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const stream = {
    streamId: 'video-1',
    profile: 'teleop' as const,
    transport: 'webrtc' as const,
    signalingUrl: 'wss://robot.local/video',
    token: 'video-token',
    expiresAt: '2026-07-09T10:05:00.000Z',
    resolution: { width: 1280, height: 720 },
    fps: 15,
    latencyTargetMs: 120,
  };
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    const envelope: RobotApiEnvelope<typeof stream> = {
      schemaVersion: 'robot-api/v1',
      ok: true,
      requestId: 'req-1',
      status: 'done',
      message: 'video started',
      data: stream,
      timing: {
        startedAt: '2026-07-09T10:00:00.000Z',
        endedAt: '2026-07-09T10:00:00.010Z',
        durationMs: 10,
      },
      robot: { robotId: 'robot-1', hostname: 'robot.local', softwareVersion: '0.1.0' },
    };
    return new Response(JSON.stringify(envelope), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const client = new HttpVideoStreamClient({
      mode: 'real',
      baseUrl: 'https://robot.local',
      robotId: 'robot-1',
      token: 'session-token',
      certificateFingerprint: 'sha256/test',
    });

    assert.deepEqual(await client.start('teleop'), stream);
    assert.equal(new URL(requests[0]?.url ?? '').pathname, '/api/video/start');
    assert.equal(requests[0]?.init?.method, 'POST');
    assert.equal(
      (requests[0]?.init?.headers as Record<string, string>).Authorization,
      'Bearer session-token',
    );
    assert.equal(requests[0]?.init?.body, JSON.stringify({ profile: 'teleop' }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('http video stream client queries and stops active video streams', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const stream = {
    streamId: 'video-2',
    profile: 'monitor' as const,
    transport: 'mjpeg' as const,
    url: 'https://robot.local/video/video-2.mjpeg',
    expiresAt: '2026-07-09T10:05:00.000Z',
    resolution: { width: 1280, height: 720 },
    fps: 15,
    latencyTargetMs: 600,
  };
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    const isStateRequest = String(url).includes('/api/video/state');
    const envelope: RobotApiEnvelope<typeof stream | null> = {
      schemaVersion: 'robot-api/v1',
      ok: true,
      requestId: 'req-2',
      status: 'done',
      message: isStateRequest ? 'video state' : 'video stopped',
      data: isStateRequest ? stream : null,
      timing: {
        startedAt: '2026-07-09T10:00:00.000Z',
        endedAt: '2026-07-09T10:00:00.010Z',
        durationMs: 10,
      },
      robot: { robotId: 'robot-1', hostname: 'robot.local', softwareVersion: '0.1.0' },
    };
    return new Response(JSON.stringify(envelope), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const client = new HttpVideoStreamClient({
      mode: 'real',
      baseUrl: 'https://robot.local',
      robotId: 'robot-1',
      token: 'session-token',
      certificateFingerprint: 'sha256/test',
    });

    assert.deepEqual(await client.getState('video-2'), stream);
    await client.stop('video-2');

    assert.equal(new URL(requests[0]?.url ?? '').pathname, '/api/video/state');
    assert.equal(new URL(requests[0]?.url ?? '').searchParams.get('streamId'), 'video-2');
    assert.equal(requests[0]?.init?.method, 'GET');
    assert.equal(new URL(requests[1]?.url ?? '').pathname, '/api/video/stop');
    assert.equal(requests[1]?.init?.method, 'POST');
    assert.equal(requests[1]?.init?.body, JSON.stringify({ streamId: 'video-2' }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail('Timed out waiting for condition');
}
