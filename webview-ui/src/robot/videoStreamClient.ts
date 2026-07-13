import { createRobotApiFailure } from './robotApiClient.js';
import { normalizeRobotHttpBaseUrl } from './robotBaseUrl.js';
import type { RobotApiEnvelope, RobotConnectionConfig, VideoStreamInfo } from './types.js';

export interface VideoStreamClient {
  start(profile: VideoStreamInfo['profile']): Promise<VideoStreamInfo>;
  stop(streamId: string): Promise<void>;
  getState(streamId: string): Promise<VideoStreamInfo | null>;
}

export class HttpVideoStreamClient implements VideoStreamClient {
  private readonly config: RobotConnectionConfig;

  constructor(config: RobotConnectionConfig) {
    this.config = config;
  }

  start(profile: VideoStreamInfo['profile']): Promise<VideoStreamInfo> {
    return this.request<VideoStreamInfo>(
      'POST',
      '/api/video/start',
      { profile },
      `video-${profile}`,
    );
  }

  async stop(streamId: string): Promise<void> {
    await this.request<unknown>('POST', '/api/video/stop', { streamId }, streamId);
  }

  getState(streamId: string): Promise<VideoStreamInfo | null> {
    return this.request<VideoStreamInfo | null>(
      'GET',
      `/api/video/state?streamId=${encodeURIComponent(streamId)}`,
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
      throw createRobotApiFailure('Robot video API is offline.', 'offline', true);
    }

    let envelope: RobotApiEnvelope<T>;
    try {
      envelope = (await response.json()) as RobotApiEnvelope<T>;
    } catch {
      throw createRobotApiFailure(
        'Robot video API returned non-JSON response.',
        'protocol',
        false,
        response.status,
      );
    }

    if (envelope.schemaVersion !== 'robot-api/v1') {
      throw createRobotApiFailure(
        'Robot video API envelope schema mismatch.',
        'protocol',
        false,
        response.status,
      );
    }
    if (!response.ok || !envelope.ok) {
      throw createRobotApiFailure(
        envelope.message || envelope.error?.detail || 'Robot video API request failed.',
        response.status === 401 || response.status === 403 ? 'auth' : 'business',
        Boolean(envelope.error?.retryable),
        response.status,
      );
    }
    return envelope.data;
  }
}

export class MockVideoStreamClient implements VideoStreamClient {
  private streams = new Map<string, VideoStreamInfo>();

  async start(profile: VideoStreamInfo['profile']): Promise<VideoStreamInfo> {
    const stream: VideoStreamInfo = {
      streamId: `mock_video_${Date.now().toString(36)}`,
      profile,
      transport: profile === 'teleop' ? 'webrtc' : 'mjpeg',
      url: profile === 'teleop' ? undefined : 'mock://robot/video.mjpeg',
      signalingUrl: profile === 'teleop' ? 'mock://robot/webrtc-signaling' : undefined,
      token: `mock_video_token_${Date.now().toString(36)}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      resolution: { width: 1280, height: 720 },
      fps: profile === 'snapshot' ? 1 : 15,
      latencyTargetMs: profile === 'teleop' ? 120 : 600,
    };
    this.streams.set(stream.streamId, stream);
    return stream;
  }

  async stop(streamId: string): Promise<void> {
    this.streams.delete(streamId);
  }

  async getState(streamId: string): Promise<VideoStreamInfo | null> {
    return this.streams.get(streamId) ?? null;
  }
}
