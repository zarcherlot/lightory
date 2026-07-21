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

    if (message.type === 'planRobotIntent') {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'robotIntentPlanResult',
            requestId: message.requestId,
            ok: false,
            error:
              'Dev mock cannot call the model. Run the Lightory standalone server to test robot intent planning.',
          },
        }),
      );
      return;
    }

    if (message.type === 'raceConversationRouteInput') {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'raceConversationRouteResult',
            requestId: message.requestId,
            ok: true,
            speakerRole: 'child',
            route: 'ai_tutor',
            confidence: 0.8,
            reason: 'Dev mock routes race conversation starts to the AI tutor.',
          },
        }),
      );
      return;
    }

    if (message.type === 'raceTutorInput') {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'raceTutorOutput',
            requestId: message.requestId,
            sessionId: message.sessionId,
            ok: true,
            publicReply:
              '好，我们先把它当成一次赛车工程实验。第一步先定 A 点：你想把小车停在赛道的哪个位置当起点？',
            expertReplies: [],
            suggestedRobotAction: 'none',
            raceDraftPatch: { nextPoint: 'A' },
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
