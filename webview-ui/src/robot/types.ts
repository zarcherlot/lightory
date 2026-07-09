export type RobotRisk = 'low' | 'medium' | 'high' | 'critical';
export type RobotResource = 'base' | 'arm';

export interface RobotConnectionConfig {
  mode: 'mock' | 'real';
  baseUrl: string;
  robotId: string;
  token: string;
  certificateFingerprint: string;
}

export interface RobotToolDefinition {
  name: string;
  version: string;
  category: 'base' | 'arm' | 'vision' | 'audio' | 'speech' | 'led' | 'memory' | 'watchdog';
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  risk: RobotRisk;
  requiresConfirmation: boolean;
  requiresLease?: RobotResource;
  timeoutMs: number;
  rateLimit?: {
    maxCalls: number;
    perSeconds: number;
  };
}

export interface RobotPlan {
  schemaVersion: 'robot-plan/v1';
  planId: string;
  createdAt: string;
  createdBy: {
    padId: string;
    sessionId: string;
    agentRunId: string;
  };
  intent: string;
  risk: RobotRisk;
  requiresUserConfirmation: boolean;
  assumptions: string[];
  steps: RobotPlanStep[];
  constraints: RobotPlanConstraints;
}

export interface RobotPlanStep {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  dependsOn?: string[];
  condition?: RobotPlanCondition;
  timeoutMs?: number;
  safety?: {
    requiresLease?: RobotResource;
    stopOnObstacle?: boolean;
    maxSpeedMps?: number;
    noGoZones?: string[];
  };
}

export interface RobotPlanConstraints {
  maxDurationMs: number;
  maxSteps: number;
  allowedTools: string[];
  forbiddenTools?: string[];
}

export interface RobotPlanCondition {
  sourceStepId: string;
  path: string;
  equals?: unknown;
  exists?: boolean;
}

export interface PlanValidationIssue {
  code: string;
  message: string;
  stepId?: string;
}

export interface PlanValidationResult {
  ok: boolean;
  planId: string;
  normalizedPlan?: RobotPlan;
  errors: PlanValidationIssue[];
  warnings: PlanValidationIssue[];
}

export interface RobotApiEnvelope<T = unknown> {
  schemaVersion: 'robot-api/v1';
  ok: boolean;
  requestId: string;
  status: RobotApiStatus;
  message: string;
  data: T;
  error?: RobotApiError;
  timing: {
    startedAt: string;
    endedAt: string;
    durationMs: number;
  };
  robot: {
    robotId: string;
    hostname: string;
    softwareVersion: string;
  };
}

export type RobotApiStatus =
  | 'done'
  | 'accepted'
  | 'running'
  | 'blocked'
  | 'timeout'
  | 'cancelled'
  | 'unsafe'
  | 'invalid_request'
  | 'hardware_error'
  | 'unavailable';

export interface RobotApiError {
  code: string;
  retryable: boolean;
  detail?: string;
}

export interface RobotPlanState {
  planId: string;
  status: 'pending' | 'validating' | 'running' | 'done' | 'failed' | 'stopped';
  currentStepId?: string;
  steps: Array<{
    id: string;
    tool: string;
    status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
    startedAt?: string;
    endedAt?: string;
    result?: RobotApiEnvelope;
  }>;
}

export interface RobotStatus {
  connected: boolean;
  batteryPercent?: number;
  mode?: string;
}

export interface VideoStreamInfo {
  streamId: string;
  profile: 'teleop' | 'monitor' | 'snapshot';
  transport: 'webrtc' | 'rtsp' | 'hls' | 'mjpeg';
  url?: string;
  signalingUrl?: string;
  token?: string;
  expiresAt: string;
  resolution: { width: number; height: number };
  fps: number;
  latencyTargetMs: number;
}

export type RobotEvent =
  | { type: 'robot.status'; data: RobotStatus; eventId?: string }
  | { type: 'plan.accepted'; planId: string; eventId?: string }
  | { type: 'plan.started'; planId: string; eventId?: string }
  | { type: 'plan.step.started'; planId: string; stepId: string; eventId?: string }
  | {
      type: 'plan.step.done';
      planId: string;
      stepId: string;
      result: RobotApiEnvelope;
      eventId?: string;
    }
  | {
      type: 'plan.step.failed';
      planId: string;
      stepId: string;
      result: RobotApiEnvelope;
      eventId?: string;
    }
  | { type: 'plan.done'; planId: string; eventId?: string }
  | { type: 'plan.failed'; planId: string; error: RobotApiError; eventId?: string }
  | { type: 'plan.stopped'; planId: string; reason: string; eventId?: string }
  | { type: 'watchdog.lease.expired'; leaseId: string; resource: string; eventId?: string }
  | { type: 'safety.blocked'; planId?: string; reason: string; eventId?: string }
  | { type: 'video.state'; data: VideoStreamInfo; eventId?: string };

export interface RobotHealth {
  ok: boolean;
  robotId: string;
  softwareVersion: string;
}

export interface RobotApiClient {
  getHealth(): Promise<RobotHealth>;
  getTools(): Promise<RobotToolDefinition[]>;
  getTool(toolName: string): Promise<RobotToolDefinition>;
  validatePlan(plan: RobotPlan): Promise<PlanValidationResult>;
  submitPlan(plan: RobotPlan): Promise<RobotPlanState>;
  executePlan(planId: string): Promise<RobotPlanState>;
  stopPlan(planId: string, reason: string): Promise<RobotPlanState>;
  getPlanState(planId: string): Promise<RobotPlanState>;
  stopAll(reason: string): Promise<void>;
}

export interface RobotEventClient {
  connect(): Promise<void>;
  subscribe(handler: (event: RobotEvent) => void): () => void;
  close(): void;
}

export interface RobotApiFailure extends Error {
  category: 'offline' | 'auth' | 'protocol' | 'validation' | 'business';
  status?: number;
  retryable: boolean;
}
