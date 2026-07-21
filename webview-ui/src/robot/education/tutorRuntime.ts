import type { RaceTutorOutput } from '../../../../core/src/messages.js';
import type { RoleTaskConsoleEntry } from '../../components/roleTaskConsoleTypes.js';
import type { MessageTransport } from '../../transport/types.js';
import { DEFAULT_RACE_ORDER, DEFAULT_RACE_SAFETY, DEFAULT_RACE_STRATEGY } from '../race/types.js';
import type { RobotIntent } from '../robotPlanBuilder.js';
import { presentRaceTutorOutput } from './consolePresenter.js';
import { createRaceSessionState, detectFourPointRaceIntent, type RaceSessionState } from './raceSession.js';

export type RaceTutorSuggestedRobotAction = 'record_point' | 'run_lap';

export interface RaceTutorRuntimeOptions {
  transport: MessageTransport;
  appendEntry: (entry: Omit<RoleTaskConsoleEntry, 'id'>) => void;
  getKnownFacts?: () => Record<string, unknown>;
  onSuggestedRobotAction?: (action: RaceTutorSuggestedRobotAction, message: RaceTutorOutput) => void;
  now?: () => number;
  randomId?: () => string;
}

export interface RaceTutorRuntime {
  handleConsoleInput(content: string): boolean;
  handleTutorInput(content: string): void;
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
    if (message.ok && isActionableRobotSuggestion(message.suggestedRobotAction)) {
      options.onSuggestedRobotAction?.(message.suggestedRobotAction, message);
    }
  });

  return {
    handleConsoleInput(content) {
      const startsRace = detectFourPointRaceIntent(content);
      if (!session && !startsRace) return false;
      sendTutorInput(content);
      return true;
    },
    handleTutorInput(content) {
      sendTutorInput(content);
    },
    dispose() {
      pending.clear();
      unsubscribe();
    },
    getSession() {
      return session;
    },
  };

  function sendTutorInput(content: string): void {
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
      knownFacts: { childCanUseRemoteControl: true, ...(options.getKnownFacts?.() ?? {}) },
    });
  }
}

function isActionableRobotSuggestion(action: string | undefined): action is RaceTutorSuggestedRobotAction {
  return action === 'record_point' || action === 'run_lap';
}

export function createRaceLapIntentFromTutorOutput(
  message: RaceTutorOutput,
  knownFacts?: Record<string, unknown>,
): RobotIntent & { type: 'raceLap' } {
  const runLap = isRecord(message.raceDraftPatch?.runLap) ? message.raceDraftPatch.runLap : {};
  const strategy = isRecord(runLap.strategy) ? runLap.strategy : {};
  const safety = isRecord(runLap.safety) ? runLap.safety : {};
  const knownTrackId = getKnownRaceTrackId(knownFacts);
  const requestedTrackId = typeof runLap.trackId === 'string' && runLap.trackId.trim()
    ? runLap.trackId.trim()
    : undefined;
  return {
    type: 'raceLap',
    trackId: knownTrackId ?? requestedTrackId ?? 'default-abcd',
    order: DEFAULT_RACE_ORDER,
    strategy: {
      maxSpeedMps: finiteOr(strategy.maxSpeedMps, DEFAULT_RACE_STRATEGY.maxSpeedMps),
      ...(Number.isFinite(strategy.lookaheadMeters) ? { lookaheadMeters: Number(strategy.lookaheadMeters) } : {}),
      ...(Number.isFinite(strategy.minTurnSpeedMps)
        ? { minTurnSpeedMps: Number(strategy.minTurnSpeedMps) }
        : {}),
      ...(Number.isFinite(strategy.waypointRadiusMeters)
        ? { waypointRadiusMeters: Number(strategy.waypointRadiusMeters) }
        : {}),
      ...(Number.isFinite(strategy.finishRadiusMeters)
        ? { finishRadiusMeters: Number(strategy.finishRadiusMeters) }
        : {}),
    },
    safety: {
      frontStopDistanceMeters: finiteOr(
        safety.frontStopDistanceMeters,
        DEFAULT_RACE_SAFETY.frontStopDistanceMeters,
      ),
      maxDurationMs: finiteOr(safety.maxDurationMs, DEFAULT_RACE_SAFETY.maxDurationMs),
    },
  };
}

export function createRaceRecordPointIntentFromTutorOutput(
  message: RaceTutorOutput,
): (RobotIntent & { type: 'raceRecordPoint' }) | null {
  const nextPoint = typeof message.raceDraftPatch?.nextPoint === 'string'
    ? message.raceDraftPatch.nextPoint.trim().toUpperCase()
    : '';
  if (!['A', 'B', 'C', 'D'].includes(nextPoint)) return null;
  return {
    type: 'raceRecordPoint',
    name: nextPoint,
  };
}

function getKnownRaceTrackId(knownFacts: Record<string, unknown> | undefined): string | undefined {
  const race = isRecord(knownFacts?.race) ? knownFacts.race : knownFacts;
  const track = isRecord(race?.track) ? race.track : undefined;
  return typeof track?.trackId === 'string' && track.trackId.trim() ? track.trackId.trim() : undefined;
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function appendRaceTutorOutputEntries(
  message: RaceTutorOutput,
  appendEntry: (entry: Omit<RoleTaskConsoleEntry, 'id'>) => void,
): void {
  for (const entry of presentRaceTutorOutput(message)) appendEntry(entry);
}
