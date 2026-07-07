import type { ClientMessage, ServerMessage } from './messages.js';

/**
 * Transport-agnostic message layer between the browser UI and server.
 *
 * Implementations:
 * - WebSocketTransport: standalone browser
 */
export interface MessageTransport {
  /** Send a message to the server. */
  send(message: ClientMessage): void;
  /** Subscribe to messages from the server. Returns unsubscribe function. */
  onMessage(handler: (message: ServerMessage) => void): () => void;
  /** Clean up resources (WebSocket close, etc.). */
  dispose(): void;
}
