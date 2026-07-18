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

    if (message.type === 'raceTutorInput') {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'raceTutorOutput',
            requestId: message.requestId,
            sessionId: message.sessionId,
            ok: true,
            publicReply:
              '我们先从定位开始：当你用遥控器把小车开到 A 点时，你觉得小车要记录地图里的什么信息，才能下次再找到 A 点？',
            expertReplies: [
              {
                expertId: 'localization',
                publicReply:
                  '我是定位工程师。小车记录的不是一句“这里是 A”，而是 map 坐标系里的位置和朝向。',
              },
            ],
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
