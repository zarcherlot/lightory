import type { ClientMessage, ServerMessage } from '../../../core/src/messages.js';
import type { MessageTransport } from './types.js';

export class BrowserMockTransport implements MessageTransport {
  send(message: ClientMessage): void {
    console.debug('[BrowserMockTransport] client message ignored', message);
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    const listener = (event: MessageEvent) => handler(event.data as ServerMessage);
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }

  dispose(): void {
    // No resources to release.
  }
}
