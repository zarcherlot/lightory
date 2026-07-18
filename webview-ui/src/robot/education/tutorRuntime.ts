import type { RaceTutorOutput } from '../../../../core/src/messages.js';
import type { RoleTaskConsoleEntry } from '../../components/RoleTaskConsole.js';
import type { MessageTransport } from '../../transport/types.js';
import { presentRaceTutorOutput } from './consolePresenter.js';
import { createRaceSessionState, detectFourPointRaceIntent, type RaceSessionState } from './raceSession.js';

export interface RaceTutorRuntimeOptions {
  transport: MessageTransport;
  appendEntry: (entry: Omit<RoleTaskConsoleEntry, 'id'>) => void;
  now?: () => number;
  randomId?: () => string;
}

export interface RaceTutorRuntime {
  handleConsoleInput(content: string): boolean;
  dispose(): void;
  getSession(): RaceSessionState | null;
}

export function createRaceTutorRuntime(options: RaceTutorRuntimeOptions): RaceTutorRuntime {
  const now = options.now ?? Date.now;
  const randomId = options.randomId ?? (() => Math.random().toString(36).slice(2));
  let session: RaceSessionState | null = null;
  const pending = new Map<string, string>();

  const unsubscribe = options.transport.onMessage((message) => {
    if (message.type !== 'raceTutorOutput') return;
    if (!pending.has(message.requestId)) return;
    pending.delete(message.requestId);
    for (const entry of presentRaceTutorOutput(message)) {
      options.appendEntry(entry);
    }
  });

  return {
    handleConsoleInput(content) {
      const startsRace = detectFourPointRaceIntent(content);
      if (!session && !startsRace) return false;
      if (!session) {
        session = createRaceSessionState(`race-session-${now().toString(36)}-${randomId()}`);
        session.active = true;
      }
      const requestId = `race_tutor_${now().toString(36)}_${randomId()}`;
      pending.set(requestId, session.sessionId);
      options.appendEntry({
        runId: requestId,
        roleId: 'user',
        status: 'done',
        stream: 'system',
        content,
      });
      options.transport.send({
        type: 'raceTutorInput',
        requestId,
        sessionId: session.sessionId,
        content,
        knownFacts: { childCanUseRemoteControl: true },
      });
      return true;
    },
    dispose() {
      pending.clear();
      unsubscribe();
    },
    getSession() {
      return session;
    },
  };
}

export function appendRaceTutorOutputEntries(
  message: RaceTutorOutput,
  appendEntry: (entry: Omit<RoleTaskConsoleEntry, 'id'>) => void,
): void {
  for (const entry of presentRaceTutorOutput(message)) appendEntry(entry);
}
