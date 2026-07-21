import { validateRobotPlanLocally } from './robotPlanSchema.js';
import type {
  PlanValidationResult,
  RobotApiClient,
  RobotApiEnvelope,
  RobotEvent,
  RobotEventClient,
  RobotHealth,
  RobotPlan,
  RobotPlanState,
  RobotToolDefinition,
} from './types.js';

const mockTools: RobotToolDefinition[] = [
  tool('speech.say', 'speech', 'low', false, 5000, '扬声器播报短句'),
  tool('led.setMode', 'led', 'low', false, 2000, '设置 LED 状态'),
  tool('memory.getPoi', 'memory', 'low', false, 2000, '查询 POI'),
  tool('memory.upsertPoi', 'memory', 'medium', false, 3000, '写入 POI'),
  tool('base.state', 'base', 'low', false, 1000, '查询底盘状态'),
  tool('base.stop', 'base', 'critical', false, 1000, '底盘急停'),
  tool('base.driveDistance', 'base', 'high', true, 15000, '按里程计移动指定距离', 'base'),
  tool('base.rotateAngle', 'base', 'high', true, 15000, '按里程计旋转指定角度', 'base'),
  tool('base.velocityProfile', 'base', 'high', true, 20000, '执行受限速度曲线', 'base'),
  tool('base.followPath', 'base', 'high', true, 30000, '低速路径执行', 'base'),
  tool('arm.state', 'arm', 'low', false, 1000, '查询机械臂状态'),
  tool('arm.stop', 'arm', 'critical', false, 1000, '机械臂急停'),
  tool('arm.grasp', 'arm', 'high', true, 15000, '抓取物体', 'arm'),
  tool('arm.place', 'arm', 'high', true, 15000, '放置物体', 'arm'),
  tool('vision.snapshot', 'vision', 'low', false, 2000, '获取低频视觉摘要'),
  tool('reactive.run', 'audio', 'high', true, 120000, '运行受限实时音频反应式协同任务'),
  tool('localization.health', 'localization', 'low', false, 5000, '检查 AMCL、地图、TF 和雷达定位链路'),
  tool('localization.setInitialPose', 'localization', 'medium', false, 5000, '设置 AMCL 初始位姿'),
  tool('localization.state', 'localization', 'low', false, 3000, '读取 map 坐标系中的当前位姿'),
  tool('localization.recordCurrentPose', 'localization', 'medium', false, 3000, '将当前定位记录为赛道点'),
  tool('poi.upsert', 'poi', 'medium', false, 3000, '写入或更新赛道点'),
  tool('poi.get', 'poi', 'low', false, 2000, '读取赛道点'),
  tool('poi.list', 'poi', 'low', false, 2000, '列出赛道点'),
  tool('poi.delete', 'poi', 'medium', false, 3000, '删除赛道点'),
  tool('race.track.save', 'race', 'medium', false, 3000, '保存 A/B/C/D 赛道'),
  tool('race.track.get', 'race', 'low', false, 2000, '读取已保存赛道'),
  tool('race.track.list', 'race', 'low', false, 2000, '列出已保存赛道'),
  tool('race.track.clear', 'race', 'medium', false, 3000, '清空已保存赛道'),
  tool('lidar.snapshot', 'lidar', 'low', false, 3000, '读取雷达扇区最小距离'),
  tool('lidar.checkSafety', 'safety', 'low', false, 3000, '检查前方安全距离'),
  tool('race.status', 'race', 'low', false, 3000, '读取当前竞速赛状态'),
  tool('race.runLap', 'race', 'high', true, 120000, '执行 A-B-C-D-A 连续竞速圈', 'base'),
  tool('race.stop', 'race', 'critical', false, 2000, '停止当前竞速赛', 'base'),
  tool('watchdog.acquire', 'watchdog', 'medium', false, 1000, '获取动作 lease'),
  tool('watchdog.heartbeat', 'watchdog', 'medium', false, 1000, '维持动作 lease'),
  tool('watchdog.release', 'watchdog', 'medium', false, 1000, '释放动作 lease'),
];

export class MockRobotEventBus implements RobotEventClient {
  private handlers = new Set<(event: RobotEvent) => void>();
  private eventSeq = 0;

  async connect(): Promise<void> {
    this.emit({
      type: 'robot.status',
      data: { connected: true, batteryPercent: 88, mode: 'mock' },
    });
  }

  subscribe(handler: (event: RobotEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    this.handlers.clear();
  }

  emit(event: RobotEvent): void {
    const eventWithId = { ...event, eventId: `mock_evt_${++this.eventSeq}` } as RobotEvent;
    for (const handler of this.handlers) handler(eventWithId);
  }
}

export class MockRobotApiClient implements RobotApiClient {
  private plans = new Map<string, { plan: RobotPlan; state: RobotPlanState }>();
  private readonly events: MockRobotEventBus;

  constructor(events: MockRobotEventBus) {
    this.events = events;
  }

  async getHealth(): Promise<RobotHealth> {
    return { ok: true, robotId: 'mock-robot-001', softwareVersion: 'mock-0.1.0' };
  }

  async getTools(): Promise<RobotToolDefinition[]> {
    return mockTools;
  }

  async getTool(toolName: string): Promise<RobotToolDefinition> {
    const toolDef = mockTools.find((item) => item.name === toolName);
    if (!toolDef) throw new Error(`Unknown mock tool ${toolName}`);
    return toolDef;
  }

  async validatePlan(plan: RobotPlan): Promise<PlanValidationResult> {
    if (plan.intent.includes('validate-fail')) {
      return {
        ok: false,
        planId: plan.planId,
        errors: [{ code: 'mock_validate_failed', message: 'Mock validation failure.' }],
        warnings: [],
      };
    }
    return validateRobotPlanLocally(plan, mockTools);
  }

  async submitPlan(plan: RobotPlan): Promise<RobotPlanState> {
    const state = createPlanState(plan);
    this.plans.set(plan.planId, { plan, state });
    this.events.emit({ type: 'plan.accepted', planId: plan.planId });
    return state;
  }

  async executePlan(planId: string): Promise<RobotPlanState> {
    const record = this.requirePlan(planId);
    record.state.status = 'running';
    this.events.emit({ type: 'plan.started', planId });
    void this.runPlan(record.plan, record.state);
    return record.state;
  }

  async stopPlan(planId: string, reason: string): Promise<RobotPlanState> {
    const record = this.requirePlan(planId);
    record.state.status = 'stopped';
    for (const step of record.state.steps) {
      if (step.status === 'pending' || step.status === 'running') step.status = 'skipped';
    }
    this.events.emit({ type: 'plan.stopped', planId, reason });
    return record.state;
  }

  async getPlanState(planId: string): Promise<RobotPlanState> {
    return this.requirePlan(planId).state;
  }

  async stopAll(reason: string): Promise<void> {
    for (const [planId, record] of this.plans.entries()) {
      if (record.state.status === 'running') {
        await this.stopPlan(planId, reason);
      }
    }
    this.events.emit({ type: 'safety.blocked', reason });
  }

  private requirePlan(planId: string): { plan: RobotPlan; state: RobotPlanState } {
    const record = this.plans.get(planId);
    if (!record) throw new Error(`Unknown plan ${planId}`);
    return record;
  }

  private async runPlan(plan: RobotPlan, state: RobotPlanState): Promise<void> {
    for (const step of state.steps) {
      if (state.status !== 'running') return;
      state.currentStepId = step.id;
      step.status = 'running';
      step.startedAt = new Date().toISOString();
      this.events.emit({ type: 'plan.step.started', planId: plan.planId, stepId: step.id });
      await delay(420);
      if (plan.intent.includes('step-fail') && step.id === 's2') {
        step.status = 'failed';
        state.status = 'failed';
        const result = envelope(false, `Step ${step.id} failed`);
        step.result = result;
        this.events.emit({
          type: 'plan.step.failed',
          planId: plan.planId,
          stepId: step.id,
          result,
        });
        this.events.emit({
          type: 'plan.failed',
          planId: plan.planId,
          error: { code: 'mock_step_failed', retryable: false },
        });
        return;
      }
      step.status = 'done';
      step.endedAt = new Date().toISOString();
      const planStep = plan.steps.find((item) => item.id === step.id);
      const result = envelope(true, `${step.tool} done`, planStep ? mockStepData(planStep) : {});
      step.result = result;
      this.events.emit({ type: 'plan.step.done', planId: plan.planId, stepId: step.id, result });
    }
    state.currentStepId = undefined;
    state.status = 'done';
    this.events.emit({ type: 'plan.done', planId: plan.planId });
  }
}

export function getMockRobotTools(): RobotToolDefinition[] {
  return mockTools;
}

function tool(
  name: RobotToolDefinition['name'],
  category: RobotToolDefinition['category'],
  risk: RobotToolDefinition['risk'],
  requiresConfirmation: boolean,
  timeoutMs: number,
  description: string,
  requiresLease?: RobotToolDefinition['requiresLease'],
): RobotToolDefinition {
  return {
    name,
    version: '1.0.0',
    category,
    description,
    inputSchema: inputSchemaForTool(name),
    outputSchema: { type: 'object' },
    risk,
    requiresConfirmation,
    requiresLease,
    timeoutMs,
  };
}

function inputSchemaForTool(name: RobotToolDefinition['name']): Record<string, unknown> {
  if (name === 'base.driveDistance') {
    return {
      type: 'object',
      required: ['distanceMeters'],
      properties: {
        distanceMeters: { type: 'number' },
        maxSpeedMps: { type: 'number', default: 0.2, minimum: 0, maximum: 0.5 },
      },
      additionalProperties: false,
    };
  }
  if (name === 'base.rotateAngle') {
    return {
      type: 'object',
      required: ['angleRad'],
      properties: {
        angleRad: { type: 'number' },
        maxAngularRadps: { type: 'number', default: 0.349066, minimum: 0, maximum: 0.785398 },
      },
      additionalProperties: false,
    };
  }
  if (name === 'base.velocityProfile') {
    return {
      type: 'object',
      required: ['segments'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            required: ['linearX', 'angularZ', 'durationMs'],
            properties: {
              linearX: { type: 'number', minimum: -0.5, maximum: 0.5 },
              angularZ: { type: 'number', minimum: -0.785398, maximum: 0.785398 },
              durationMs: { type: 'number', exclusiveMinimum: 0 },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    };
  }
  if (name === 'race.runLap') {
    return {
      type: 'object',
      required: ['trackId', 'order'],
      properties: {
        trackId: { type: 'string', default: 'default-abcd' },
        mapId: { type: 'string', default: 'map_01' },
        order: {
          type: 'array',
          items: { enum: ['A', 'B', 'C', 'D'] },
          default: ['A', 'B', 'C', 'D', 'A'],
        },
        strategy: {
          type: 'object',
          properties: {
            maxSpeedMps: { type: 'number', default: 0.25, minimum: 0.05, maximum: 0.5 },
            minTurnSpeedMps: { type: 'number', default: 0.08, minimum: 0.03, maximum: 0.5 },
            lookaheadMeters: { type: 'number', default: 0.35, minimum: 0.05, maximum: 1 },
            waypointRadiusMeters: { type: 'number', default: 0.18, minimum: 0.05, maximum: 1 },
            finishRadiusMeters: { type: 'number', default: 0.22, minimum: 0.05, maximum: 1 },
          },
          additionalProperties: true,
        },
        safety: {
          type: 'object',
          properties: {
            frontStopDistanceMeters: { type: 'number', default: 0.15, minimum: 0.05 },
            maxDurationMs: { type: 'number', default: 120000, minimum: 1000 },
          },
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    };
  }
  if (name === 'reactive.run') {
    return {
      type: 'object',
      required: ['durationMs', 'sources', 'processors', 'outputs'],
      properties: {
        durationMs: { type: 'number', minimum: 250, maximum: 120000 },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'args'],
            properties: {
              id: { type: 'string' },
              type: { const: 'audio.microphone' },
              args: { type: 'object' },
            },
            additionalProperties: false,
          },
        },
        processors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'input', 'args'],
            properties: {
              id: { type: 'string' },
              type: { enum: ['audio.beatTracker', 'audio.onsetDetector', 'audio.moodEstimator'] },
              input: { type: 'string' },
              args: { type: 'object' },
            },
            additionalProperties: false,
          },
        },
        outputs: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'input', 'args'],
            properties: {
              id: { type: 'string' },
              type: { enum: ['base.motionReactive', 'led.reactivePattern', 'speech.reactiveCue'] },
              input: { type: 'string' },
              args: { type: 'object' },
            },
            additionalProperties: false,
          },
        },
        safety: { type: 'object' },
      },
      additionalProperties: false,
    };
  }
  return { type: 'object' };
}

function createPlanState(plan: RobotPlan): RobotPlanState {
  return {
    planId: plan.planId,
    status: 'pending',
    steps: plan.steps.map((step) => ({
      id: step.id,
      tool: step.tool,
      status: 'pending',
    })),
  };
}

function mockStepData(step: RobotPlan['steps'][number]): unknown {
  if (step.tool === 'race.track.list') {
    return {
      tracks: [
        {
          trackId: 'default-abcd',
          name: 'ABCD timed race',
          order: ['A', 'B', 'C', 'D'],
          points: {
            A: { name: 'A' },
            B: { name: 'B' },
            C: { name: 'C' },
            D: { name: 'D' },
          },
        },
      ],
    };
  }
  if (step.tool === 'race.runLap') {
    return { status: 'done', elapsedMs: 12345 };
  }
  return {};
}

function envelope(ok: boolean, message: string, data: unknown = {}): RobotApiEnvelope {
  const now = new Date().toISOString();
  return {
    schemaVersion: 'robot-api/v1',
    ok,
    requestId: `mock_req_${Date.now().toString(36)}`,
    status: ok ? 'done' : 'hardware_error',
    message,
    data,
    timing: { startedAt: now, endedAt: now, durationMs: 0 },
    robot: { robotId: 'mock-robot-001', hostname: 'mock-robot', softwareVersion: 'mock-0.1.0' },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
