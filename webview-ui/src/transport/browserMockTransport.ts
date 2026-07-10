import type { ClientMessage, ServerMessage } from '../../../core/src/messages.js';
import type { MessageTransport } from './types.js';

export class BrowserMockTransport implements MessageTransport {
  send(message: ClientMessage): void {
    if (message.type === 'startRoleTask') {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'roleTaskConsole',
            runId: `${message.roleId}-${Date.now().toString(36)}`,
            roleId: message.roleId,
            status: 'error',
            stream: 'stderr',
            content:
              'Dev mock cannot call the model. Run the Lightory standalone server and open its URL to test @role chat with a real provider.',
          },
        }),
      );
      return;
    }

    if (message.type === 'consoleUserInput') {
      const content = message.content.trim();
      if (!content) return;
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'roleTaskConsole',
            runId: `console-${Date.now().toString(36)}`,
            roleId: message.roleId?.trim() || 'user',
            status: 'done',
            stream: 'system',
            content,
          },
        }),
      );
      return;
    }

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
