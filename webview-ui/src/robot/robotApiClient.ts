import { normalizeRobotHttpBaseUrl } from './robotBaseUrl.js';
import type {
  PlanValidationResult,
  RobotApiClient,
  RobotApiEnvelope,
  RobotApiFailure,
  RobotConnectionConfig,
  RobotHealth,
  RobotPlan,
  RobotPlanState,
  RobotToolDefinition,
  VideoStreamInfo,
} from './types.js';

export function createRobotApiFailure(
  message: string,
  category: RobotApiFailure['category'],
  retryable: boolean,
  status?: number,
): RobotApiFailure {
  const error = new Error(message) as RobotApiFailure;
  error.category = category;
  error.retryable = retryable;
  error.status = status;
  return error;
}

export class HttpRobotApiClient implements RobotApiClient {
  private readonly config: RobotConnectionConfig;

  constructor(config: RobotConnectionConfig) {
    this.config = config;
  }

  getHealth(): Promise<RobotHealth> {
    return this.request<RobotHealth>('GET', '/api/health');
  }

  getTools(): Promise<RobotToolDefinition[]> {
    return this.request<RobotToolDefinition[]>('GET', '/api/tools');
  }

  getTool(toolName: string): Promise<RobotToolDefinition> {
    return this.request<RobotToolDefinition>('GET', `/api/tools/${encodeURIComponent(toolName)}`);
  }

  validatePlan(plan: RobotPlan): Promise<PlanValidationResult> {
    return this.request<PlanValidationResult>('POST', '/api/plans/validate', plan, plan.planId);
  }

  submitPlan(plan: RobotPlan): Promise<RobotPlanState> {
    return this.request<RobotPlanState>('POST', '/api/plans', plan, plan.planId);
  }

  executePlan(planId: string): Promise<RobotPlanState> {
    return this.request<RobotPlanState>(
      'POST',
      `/api/plans/${encodeURIComponent(planId)}/execute`,
      undefined,
      planId,
    );
  }

  stopPlan(planId: string, reason: string): Promise<RobotPlanState> {
    return this.request<RobotPlanState>(
      'POST',
      `/api/plans/${encodeURIComponent(planId)}/stop`,
      { reason },
      planId,
    );
  }

  getPlanState(planId: string): Promise<RobotPlanState> {
    return this.request<RobotPlanState>('GET', `/api/plans/${encodeURIComponent(planId)}`);
  }

  async stopAll(reason: string): Promise<void> {
    await this.request<unknown>(
      'POST',
      '/api/watchdog/stop-all',
      { reason },
      `stop-all-${Date.now()}`,
    );
  }

  startVideo(profile: VideoStreamInfo['profile']): Promise<VideoStreamInfo> {
    return this.request<VideoStreamInfo>(
      'POST',
      '/api/video/start',
      { profile },
      `video-${profile}`,
    );
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const requestId = crypto.randomUUID();
    const url = new URL(path, normalizeRobotHttpBaseUrl(this.config.baseUrl));
    url.searchParams.set('requestId', requestId);
    if (idempotencyKey) url.searchParams.set('idempotencyKey', idempotencyKey);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
          ...(this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw createRobotApiFailure('Robot API is offline.', 'offline', true);
    }

    let envelope: RobotApiEnvelope<T>;
    try {
      envelope = (await response.json()) as RobotApiEnvelope<T>;
    } catch {
      throw createRobotApiFailure(
        'Robot API returned non-JSON response.',
        'protocol',
        false,
        response.status,
      );
    }

    if (envelope.schemaVersion !== 'robot-api/v1') {
      throw createRobotApiFailure(
        'Robot API envelope schema mismatch.',
        'protocol',
        false,
        response.status,
      );
    }
    if (!response.ok || !envelope.ok) {
      const category = classifyFailure(response.status, envelope.status);
      throw createRobotApiFailure(
        envelope.message || envelope.error?.detail || 'Robot API request failed.',
        category,
        Boolean(envelope.error?.retryable),
        response.status,
      );
    }
    return envelope.data;
  }
}

function classifyFailure(
  status: number,
  apiStatus: RobotApiEnvelope['status'],
): RobotApiFailure['category'] {
  if (status === 401 || status === 403) return 'auth';
  if (apiStatus === 'invalid_request') return 'validation';
  if (apiStatus === 'unsafe' || apiStatus === 'blocked') return 'business';
  if (status >= 500 || apiStatus === 'unavailable' || apiStatus === 'timeout') return 'offline';
  return 'business';
}
