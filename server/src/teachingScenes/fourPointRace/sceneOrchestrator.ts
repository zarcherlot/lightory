import type { LlmRoleRunner } from '../../llmRoleExecutor.js';
import { createTeachingRuntime, type TeachingRuntime } from '../../teaching/teachingRuntime.js';
import type { ExpertMailbox } from './expertMailbox.js';
import { createRaceSceneAdapter } from './raceSceneAdapter.js';
import {
  createRaceTutorSession,
  type RaceTutorSession,
  type RaceTutorTurnRequest,
  type RaceTutorTurnResult,
} from './schemas.js';

/**
 * Four-point race scene adapter around the generic teaching runtime.
 *
 * The AI teacher lives in `server/src/teaching`. This orchestrator only keeps
 * race-scene session state and maps the generic teaching turn to the existing
 * raceTutor WebSocket contract.
 */
export interface FourPointRaceTeachingOrchestrator {
  handleTurn(request: RaceTutorTurnRequest): Promise<RaceTutorTurnResult>;
  getSession(sessionId: string): RaceTutorSession | undefined;
}

export function createFourPointRaceTeachingOrchestrator(options: {
  runner: LlmRoleRunner;
  mailbox: ExpertMailbox;
}): FourPointRaceTeachingOrchestrator {
  return createFourPointRaceTeachingOrchestratorFromRuntime({
    mailbox: options.mailbox,
    runtime: createTeachingRuntime({ runner: options.runner }),
  });
}

export function createFourPointRaceTeachingOrchestratorFromRuntime(options: {
  runtime: TeachingRuntime;
  mailbox: ExpertMailbox;
}): FourPointRaceTeachingOrchestrator {
  const sessions = new Map<string, RaceTutorSession>();
  const adapter = createRaceSceneAdapter();

  return {
    async handleTurn(request) {
      const session = getOrCreateSession(sessions, request.sessionId);
      session.childFacingHistory.push({ role: 'child', content: request.childMessage });

      const sceneContext = adapter.buildContext(request.knownFacts);
      const teachingTurn = await options.runtime.handleTurn({
        sessionId: request.sessionId,
        childMessage: request.childMessage,
        availableTools: adapter.buildAvailableTools(request.knownFacts),
        memory: adapter.buildMemory(request.knownFacts),
        sceneContext,
        conversationHistory: session.childFacingHistory,
      });
      const raceTurn = adapter.toRaceTutorOutput(teachingTurn, sceneContext);

      applyRaceSessionPatch(session, raceTurn);
      session.studentModel = teachingTurn.studentModel;
      session.childFacingHistory.push({ role: 'tutor', content: raceTurn.publicReply });

      const expertResults = await Promise.all(
        raceTurn.mentions.map(async (mention) => ({
          expert: await options.mailbox.ask(mention),
          mention,
        })),
      );
      const expertReplies = expertResults.map(({ expert, mention }) => {
        if (expert.expertNote) session.expertNotes.push({ expertId: mention.expertId, note: expert.expertNote });
        if (expert.raceDraftPatch) Object.assign(session.raceDraft, expert.raceDraftPatch);
        return { expertId: mention.expertId, publicReply: expert.publicReply };
      });

      return {
        ...raceTurn,
        expertReplies,
        expertNotes: [...session.expertNotes],
      };
    },
    getSession(sessionId) {
      return sessions.get(sessionId);
    },
  };
}

function getOrCreateSession(
  sessions: Map<string, RaceTutorSession>,
  sessionId: string,
): RaceTutorSession {
  const existing = sessions.get(sessionId);
  if (existing) return existing;
  const created = createRaceTutorSession(sessionId);
  sessions.set(sessionId, created);
  return created;
}

function applyRaceSessionPatch(
  session: RaceTutorSession,
  turn: Omit<RaceTutorTurnResult, 'expertReplies' | 'expertNotes'>,
): void {
  if (turn.raceDraftPatch) Object.assign(session.raceDraft, turn.raceDraftPatch);
  if (typeof turn.raceDraftPatch?.goal === 'string') session.childGoal = turn.raceDraftPatch.goal;
  if (turn.suggestedRobotAction === 'record_point') session.state = 'record_points';
  if (turn.suggestedRobotAction === 'run_lap') session.state = 'run';
}
