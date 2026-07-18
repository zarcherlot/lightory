/// <reference lib="dom" />

import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { ClientMessage, ServerMessage } from '../../../core/src/messages.js';
import type { MessageTransport } from '../../../core/src/transport.js';
import { presentRaceTutorOutput } from '../src/robot/education/consolePresenter.js';
import {
  createRaceSessionState,
  detectFourPointRaceIntent,
} from '../src/robot/education/raceSession.js';
import { createRaceTutorRuntime } from '../src/robot/education/tutorRuntime.js';
import {
  getMockRobotTools,
  MockRobotApiClient,
  MockRobotEventBus,
} from '../src/robot/mockRobotApi.js';
import { createRaceClient } from '../src/robot/race/raceClient.js';
import { buildRaceRunLapPlan } from '../src/robot/race/racePlanBuilder.js';
import {
  buildDriveDistancePlan,
  buildMoveToPoiPlan,
  buildPlanForIntent,
  buildRememberPoiPlan,
  normalizeRobotIntent,
  parseRobotIntent,
} from '../src/robot/robotPlanBuilder.js';
import { validateRobotPlanLocally } from '../src/robot/robotPlanSchema.js';
import type { RobotApiEnvelope, RobotEvent, RobotPlan } from '../src/robot/types.js';
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

test('normalizes model-planned robot intents and rejects unsafe values', () => {
  assert.deepEqual(
    normalizeRobotIntent({
      type: 'velocityProfile',
      intent: '前后摆动跳舞',
      segments: [
        { linearX: 0.15, angularZ: 0.4, durationMs: 700 },
        { linearX: -0.15, angularZ: -0.4, durationMs: 700 },
      ],
    }),
    {
      type: 'planned',
      intent: {
        type: 'velocityProfile',
        intent: '前后摆动跳舞',
        segments: [
          { linearX: 0.15, angularZ: 0.4, durationMs: 700 },
          { linearX: -0.15, angularZ: -0.4, durationMs: 700 },
        ],
      },
    },
  );
  const longDrive = normalizeRobotIntent({ type: 'driveDistance', distanceMeters: 3 });
  assert.equal(longDrive.type, 'planned');
  assert.deepEqual(
    longDrive.type === 'planned' && longDrive.intent.type === 'sequence'
      ? longDrive.intent.actions
      : [],
    [
      { type: 'driveDistance', distanceMeters: 2, maxSpeedMps: 0.2 },
      { type: 'driveDistance', distanceMeters: 1, maxSpeedMps: 0.2 },
    ],
  );
  assert.deepEqual(normalizeRobotIntent({ type: 'unsupported', reason: '太危险' }), {
    type: 'unsupported',
    reason: '太危险',
  });
});

test('normalizes compound movement into a multi-step sequence plan', () => {
  const outcome = normalizeRobotIntent({
    type: 'sequence',
    intent: '前进2米、后退1米、旋转1圈',
    confirmationMessage: '请确认周围安全后执行。',
    actions: [
      { type: 'driveDistance', distanceMeters: 2 },
      { type: 'driveDistance', distanceMeters: -1 },
      { type: 'rotateAngle', angleRad: Math.PI * 2 },
    ],
  });

  assert.equal(outcome.type, 'planned');
  assert.equal(outcome.type === 'planned' ? outcome.confirmationMessage : '', '请确认周围安全后执行。');
  const intent = outcome.type === 'planned' ? outcome.intent : null;
  assert.equal(intent?.type, 'sequence');
  const plan = intent ? buildPlanForIntent(ctx, intent) : null;
  assert.deepEqual(
    plan?.steps.map((step) => step.tool),
    [
      'base.driveDistance',
      'base.stop',
      'base.driveDistance',
      'base.stop',
      'base.rotateAngle',
      'base.stop',
    ],
  );
  assert.equal(validateRobotPlanLocally(plan!, getMockRobotTools()).ok, true);
  assert.equal(plan?.steps[0]?.args.maxSpeedMps, 0.2);
  assert.equal(plan?.steps[4]?.args.maxAngularRadps, 0.349066);
});

test('splits long drive distances into safe sequence actions', () => {
  const outcome = normalizeRobotIntent({
    type: 'sequence',
    intent: '前进3米、后退2米、旋转1圈',
    actions: [
      { type: 'driveDistance', distanceMeters: 3 },
      { type: 'driveDistance', distanceMeters: -2 },
      { type: 'rotateAngle', angleRad: Math.PI * 2 },
    ],
  });

  assert.equal(outcome.type, 'planned');
  const intent = outcome.type === 'planned' ? outcome.intent : null;
  assert.equal(intent?.type, 'sequence');
  assert.deepEqual(intent?.type === 'sequence' ? intent.actions : [], [
    { type: 'driveDistance', distanceMeters: 2, maxSpeedMps: 0.2 },
    { type: 'driveDistance', distanceMeters: 1, maxSpeedMps: 0.2 },
    { type: 'driveDistance', distanceMeters: -2, maxSpeedMps: 0.2 },
    { type: 'rotateAngle', angleRad: 6.283185, maxAngularRadps: 0.349066 },
  ]);
});

test('normalizes requested movement speeds to configured limits', () => {
  const outcome = normalizeRobotIntent({
    type: 'sequence',
    intent: '快速前进再快速转圈',
    actions: [
      { type: 'driveDistance', distanceMeters: 1, maxSpeedMps: 0.9 },
      { type: 'rotateAngle', angleRad: Math.PI * 2, maxAngularRadps: 2 },
    ],
  });

  assert.equal(outcome.type, 'planned');
  const intent = outcome.type === 'planned' ? outcome.intent : null;
  assert.deepEqual(intent?.type === 'sequence' ? intent.actions : [], [
    { type: 'driveDistance', distanceMeters: 1, maxSpeedMps: 0.5 },
    { type: 'rotateAngle', angleRad: 6.283185, maxAngularRadps: 0.785398 },
  ]);
});

test('normalizes reactive graph intents into a safe robot plan', () => {
  const outcome = normalizeRobotIntent({
    type: 'reactive',
    intent: '跟着音乐跳舞并闪灯',
    confirmationMessage: '我会跟着音乐控制底盘和灯光，请确认小车已架空或周围安全。',
    graph: {
      durationMs: 30_000,
      sources: [{ id: 'mic', type: 'audio.microphone', args: { sampleRateHz: 16000 } }],
      processors: [{ id: 'beat', type: 'audio.beatTracker', input: 'mic', args: {} }],
      outputs: [
        {
          id: 'base',
          type: 'base.motionReactive',
          input: 'beat',
          args: { style: 'dance', maxSpeedMps: 0.9, maxAngularRadps: 2 },
        },
        {
          id: 'led',
          type: 'led.reactivePattern',
          input: 'beat',
          args: { style: 'cheerful' },
        },
      ],
      safety: { startupNoInputMs: 5000, stopOnSilenceMs: 5000 },
    },
  });

  assert.equal(outcome.type, 'planned');
  assert.equal(
    outcome.type === 'planned' ? outcome.confirmationMessage : '',
    '我会跟着音乐控制底盘和灯光，请确认小车已架空或周围安全。',
  );
  const intent = outcome.type === 'planned' ? outcome.intent : null;
  assert.equal(intent?.type, 'reactive');
  assert.equal(
    intent?.type === 'reactive' ? intent.graph.outputs[0]?.args.maxSpeedMps : undefined,
    0.5,
  );
  assert.equal(
    intent?.type === 'reactive' ? intent.graph.outputs[0]?.args.maxAngularRadps : undefined,
    0.785398,
  );
  assert.equal(intent?.type === 'reactive' ? intent.graph.safety?.startupNoInputMs : undefined, 5000);
  assert.equal(intent?.type === 'reactive' ? intent.graph.safety?.stopOnSilenceMs : undefined, 5000);

  const plan = intent ? buildPlanForIntent(ctx, intent) : null;
  assert.deepEqual(
    plan?.steps.map((step) => step.tool),
    ['reactive.run', 'base.stop'],
  );
  assert.equal(plan?.risk, 'high');
  assert.equal(plan?.requiresUserConfirmation, true);
  assert.equal(plan?.steps[0]?.safety?.requiresLease, 'base');
  assert.equal(plan?.schemaVersion, 'robot-plan/v1');
  assert.deepEqual(
    Object.keys(plan?.steps[0]?.args ?? {}).sort(),
    ['durationMs', 'outputs', 'processors', 'safety', 'sources'],
  );
  assert.equal(validateRobotPlanLocally(plan!, getMockRobotTools()).ok, true);
});

test('local validation rejects frontend-incompatible reactive DSL shapes', () => {
  const validOutcome = normalizeRobotIntent({
    type: 'reactive',
    intent: '跟着音乐跳舞',
    graph: {
      durationMs: 30_000,
      sources: [{ id: 'mic', type: 'audio.microphone', args: {} }],
      processors: [{ id: 'beat', type: 'audio.beatTracker', input: 'mic', args: {} }],
      outputs: [{ id: 'base', type: 'base.motionReactive', input: 'beat', args: {} }],
    },
  });
  assert.equal(validOutcome.type, 'planned');
  const validPlan = buildPlanForIntent(
    ctx,
    validOutcome.type === 'planned' ? validOutcome.intent : { type: 'speech', text: '' },
  );
  const invalidPlan: RobotPlan = {
    ...validPlan,
    schemaVersion: 'robot-plan/v1',
    steps: [
      {
        ...validPlan.steps[0]!,
        args: {
          durationMs: 30_000,
          inputs: [{ id: 'mic', type: 'microphone', device: 'plughw:2,0' }],
          graph: [{ id: 'beat_to_motion', type: 'beatToMotion', input: 'mic' }],
          outputs: [{ id: 'motion', type: 'motion', maxSpeedMps: 0.08 }],
        },
      },
      validPlan.steps[1]!,
    ],
  };

  const validation = validateRobotPlanLocally(invalidPlan, getMockRobotTools());

  assert.equal(validation.ok, false);
  assert.deepEqual(
    validation.errors.map((error) => error.code).filter((code) => code.startsWith('reactive_')),
    [
      'reactive_sources_required',
      'reactive_processors_required',
      'reactive_output_type',
      'reactive_output_input',
    ],
  );
});

test('rejects invalid reactive graph wiring', () => {
  assert.deepEqual(
    normalizeRobotIntent({
      type: 'reactive',
      intent: '跟着音乐做不存在的输出',
      graph: {
        durationMs: 30_000,
        sources: [{ id: 'mic', type: 'audio.microphone', args: {} }],
        processors: [{ id: 'beat', type: 'audio.beatTracker', input: 'mic', args: {} }],
        outputs: [{ id: 'unknown', type: 'base.flyReactive', input: 'beat', args: {} }],
      },
    }),
    { type: 'error', message: 'reactive output type is unsupported.' },
  );

  assert.deepEqual(
    normalizeRobotIntent({
      type: 'reactive',
      intent: '跟着音乐跳舞',
      graph: {
        durationMs: 30_000,
        sources: [{ id: 'mic', type: 'audio.microphone', args: {} }],
        processors: [{ id: 'beat', type: 'audio.beatTracker', input: 'missing', args: {} }],
        outputs: [{ id: 'base', type: 'base.motionReactive', input: 'beat', args: {} }],
      },
    }),
    { type: 'error', message: 'reactive processor input is invalid.' },
  );
});

test('builds and validates a high-risk four-point race lap plan', () => {
  const plan = buildRaceRunLapPlan(ctx, {
    trackId: 'default-abcd',
    order: ['A', 'B', 'C', 'D', 'A'],
    strategy: {
      name: 'baseline',
      maxSpeedMps: 0.25,
      minTurnSpeedMps: 0.08,
      lookaheadMeters: 0.35,
      waypointRadiusMeters: 0.18,
      finishRadiusMeters: 0.22,
    },
    safety: {
      frontStopDistanceMeters: 0.35,
      maxDurationMs: 120000,
    },
  });

  assert.equal(plan.schemaVersion, 'robot-plan/v1');
  assert.equal(plan.intent, '四点竞速赛 default-abcd 跑一圈');
  assert.equal(plan.risk, 'high');
  assert.equal(plan.requiresUserConfirmation, true);
  assert.deepEqual(plan.constraints.allowedTools, ['race.runLap', 'race.stop']);
  assert.deepEqual(
    plan.steps.map((step) => step.tool),
    ['race.runLap', 'race.stop'],
  );
  assert.equal(plan.steps[0]?.safety?.requiresLease, 'base');
  assert.equal(plan.steps[0]?.safety?.stopOnObstacle, true);
  assert.equal(plan.steps[0]?.safety?.maxSpeedMps, 0.25);
  assert.equal(plan.steps[0]?.args.trackId, 'default-abcd');
  assert.deepEqual(plan.steps[0]?.args.order, ['A', 'B', 'C', 'D', 'A']);
  assert.equal(validateRobotPlanLocally(plan, getMockRobotTools()).ok, true);
});

test('race client submits typed race and localization tool plans', async () => {
  const events = new MockRobotEventBus();
  const api = new MockRobotApiClient(events);
  const raceClient = createRaceClient(api, ctx);

  const localizationState = await raceClient.getLocalizationState();
  assert.equal(localizationState.plan.steps[0]?.tool, 'localization.state');
  assert.equal(localizationState.validation.ok, true);
  assert.equal(localizationState.submitted.status, 'pending');

  const recordPoint = await raceClient.recordCurrentPose('A');
  assert.equal(recordPoint.plan.steps[0]?.tool, 'localization.recordCurrentPose');
  assert.deepEqual(recordPoint.plan.steps[0]?.args, { name: 'A' });
  assert.equal(recordPoint.validation.ok, true);

  const upsertPoint = await raceClient.upsertPoi({
    name: 'A',
    pose: { frame: 'map', x: 0, y: 0, thetaRad: 0 },
  });
  assert.equal(upsertPoint.plan.steps[0]?.tool, 'poi.upsert');
  assert.equal(upsertPoint.validation.ok, true);

  const preview = await raceClient.previewLap({
    trackId: 'default-abcd',
    order: ['A', 'B', 'C', 'D', 'A'],
  });
  assert.equal(preview.plan.steps[0]?.tool, 'race.previewLap');
  assert.equal(preview.validation.ok, true);

  const runLap = await raceClient.runLap({
    trackId: 'default-abcd',
    order: ['A', 'B', 'C', 'D', 'A'],
  });
  assert.equal(runLap.plan.steps[0]?.tool, 'race.runLap');
  assert.equal(runLap.plan.requiresUserConfirmation, true);
  assert.equal(runLap.validation.ok, true);
});

test('detects four-point race session intent from child console input', () => {
  assert.equal(detectFourPointRaceIntent('我今天想完成4点竞速赛'), true);
  assert.equal(detectFourPointRaceIntent('我们让小车在ABCD四个点跑计时赛'), true);
  assert.equal(detectFourPointRaceIntent('让小车前进2m'), false);
});

test('presents only child-facing race tutor and expert replies', () => {
  const entries = presentRaceTutorOutput({
    requestId: 'req-1',
    sessionId: 'race-session-1',
    ok: true,
    publicReply: '先想想：记录 A 点时，小车要保存什么？',
    expertReplies: [
      {
        expertId: 'localization',
        publicReply: '我是定位工程师。地图坐标能帮小车再找到 A 点。',
      },
    ],
    suggestedRobotAction: 'record_point',
    raceDraftPatch: { nextPoint: 'A', raw: '{"debug":true}' },
    expertNotes: [{ expertId: 'localization', note: 'hidden note' }],
  });

  assert.deepEqual(
    entries.map((entry) => entry.content),
    [
      '先想想：记录 A 点时，小车要保存什么？',
      '我是定位工程师。地图坐标能帮小车再找到 A 点。',
      '赛道草稿：下一步记录 A 点。',
    ],
  );
  assert.equal(entries.some((entry) => entry.content.includes('hidden note')), false);
  assert.equal(entries.some((entry) => entry.content.includes('debug')), false);
});

test('race tutor runtime sends active session turns to tutor instead of robot intent planner', async () => {
  const transport = new TestTransport();
  const entries: Array<{ content: string; roleId: string }> = [];
  const runtime = createRaceTutorRuntime({
    transport,
    appendEntry: (entry) => entries.push({ content: entry.content, roleId: entry.roleId }),
    now: () => 1000,
    randomId: () => 'fixed',
  });

  assert.equal(runtime.handleConsoleInput('我今天想完成4点竞速赛'), true);
  assert.equal(transport.sent[0]?.type, 'raceTutorInput');
  assert.equal(
    transport.sent[0]?.type === 'raceTutorInput' ? transport.sent[0].content : '',
    '我今天想完成4点竞速赛',
  );

  transport.emit({
    type: 'raceTutorOutput',
    requestId: transport.sent[0]?.type === 'raceTutorInput' ? transport.sent[0].requestId : '',
    sessionId: 'race-session-1000-fixed',
    ok: true,
    publicReply: '我们先记录 A 点。你觉得定位要用地图还是只靠轮子？',
    expertReplies: [{ expertId: 'localization', publicReply: '定位工程师：AMCL 会把雷达和地图对齐。' }],
    suggestedRobotAction: 'none',
  });

  await waitFor(() => entries.some((entry) => entry.content.includes('AMCL')));
  assert.deepEqual(entries.map((entry) => entry.roleId), ['user', 'race-tutor', 'race-localization']);
});

test('race tutor runtime ignores non-race input before a race session is active', () => {
  const transport = new TestTransport();
  const runtime = createRaceTutorRuntime({
    transport,
    appendEntry: () => {},
  });

  assert.equal(runtime.handleConsoleInput('让小车前进2m'), false);
  assert.equal(transport.sent.length, 0);
  assert.deepEqual(createRaceSessionState('s1').recordedPoints, []);
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

class TestTransport implements MessageTransport {
  sent: ClientMessage[] = [];
  private handlers = new Set<(message: ServerMessage) => void>();

  send(message: ClientMessage): void {
    this.sent.push(message);
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(message: ServerMessage): void {
    for (const handler of this.handlers) handler(message);
  }

  dispose(): void {
    this.handlers.clear();
  }
}
