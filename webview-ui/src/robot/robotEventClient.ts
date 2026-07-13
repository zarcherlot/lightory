import { normalizeRobotWsBaseUrl } from './robotBaseUrl.js';
import type { RobotConnectionConfig, RobotEvent, RobotEventClient } from './types.js';

export class WebSocketRobotEventClient implements RobotEventClient {
  private readonly config: RobotConnectionConfig;
  private readonly handlers = new Set<(event: RobotEvent) => void>();
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private lastEventId = '';
  private closed = false;

  constructor(config: RobotConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.closed = false;
    this.openSocket();
  }

  subscribe(handler: (event: RobotEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  private openSocket(): void {
    const url = new URL('/api/events', normalizeRobotWsBaseUrl(this.config.baseUrl));
    if (this.lastEventId) url.searchParams.set('lastEventId', this.lastEventId);
    if (this.config.token) url.searchParams.set('token', this.config.token);
    this.socket = new WebSocket(url);
    this.socket.onmessage = (message) => {
      const event = JSON.parse(String(message.data)) as RobotEvent;
      if ('eventId' in event && event.eventId) this.lastEventId = event.eventId;
      for (const handler of this.handlers) handler(event);
    };
    this.socket.onclose = () => this.scheduleReconnect();
    this.socket.onerror = () => this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.closed || this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, 1200);
  }
}
