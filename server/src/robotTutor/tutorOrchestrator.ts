import type { ExpertMailbox } from './expertMailbox.js';
import type { LlmRoleRunner } from './llmRoleRunner.js';
import {
  createRaceTutorSession,
  parseTutorOutputJson,
  type RaceTutorSession,
  type RaceTutorTurnRequest,
  type RaceTutorTurnResult,
  type TutorTurnOutput,
} from './schemas.js';
import { buildTutorPrompt } from './skillPrompts.js';

export interface RaceTutorOrchestrator {
  handleTurn(request: RaceTutorTurnRequest): Promise<RaceTutorTurnResult>;
  getSession(sessionId: string): RaceTutorSession | undefined;
}

export function createRaceTutorOrchestrator(options: {
  runner: LlmRoleRunner;
  mailbox: ExpertMailbox;
}): RaceTutorOrchestrator {
  const sessions = new Map<string, RaceTutorSession>();
  return createStatefulOrchestrator(sessions, async (request, session) => {
    const output = await options.runner({
      roleId: 'race-ai-tutor',
      prompt: buildTutorPrompt({ session, childMessage: request.childMessage, knownFacts: request.knownFacts }),
    });
    return parseTutorOutputJson(output);
  }, options.mailbox);
}

export function createDeterministicRaceTutorOrchestrator(): RaceTutorOrchestrator {
  const sessions = new Map<string, RaceTutorSession>();
  return createStatefulOrchestrator(
    sessions,
    async (request) => deterministicTutorTurn(request),
    {
      ask: async (mention) => ({
        publicReply:
          mention.expertId === 'localization'
            ? '我是定位工程师。你觉得记录 A 点时，小车要保存地图上的 x、y 位置，还是只记住“这里”这个名字？'
            : '我会先给一个小问题，帮你把想法变成可测试的工程步骤。',
        expertNote: `deterministic note for ${mention.expertId}`,
      }),
    },
  );
}

function createStatefulOrchestrator(
  sessions: Map<string, RaceTutorSession>,
  produceTutorTurn: (
    request: RaceTutorTurnRequest,
    session: RaceTutorSession,
  ) => Promise<TutorTurnOutput>,
  mailbox: ExpertMailbox,
): RaceTutorOrchestrator {
  return {
    async handleTurn(request) {
      const session = getOrCreateSession(sessions, request.sessionId);
      session.childFacingHistory.push({ role: 'child', content: request.childMessage });
      const tutorTurn = await produceTutorTurn(request, session);
      applyTutorPatch(session, tutorTurn);
      session.childFacingHistory.push({ role: 'tutor', content: tutorTurn.publicReply });

      const expertReplies = [];
      for (const mention of tutorTurn.mentions) {
        const expert = await mailbox.ask(mention);
        expertReplies.push({ expertId: mention.expertId, publicReply: expert.publicReply });
        session.childFacingHistory.push({ role: 'expert', content: expert.publicReply });
        if (expert.expertNote) {
          session.expertNotes.push({ expertId: mention.expertId, note: expert.expertNote });
        }
        if (expert.raceDraftPatch) {
          Object.assign(session.raceDraft, expert.raceDraftPatch);
        }
      }

      return {
        ...tutorTurn,
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

function applyTutorPatch(session: RaceTutorSession, turn: TutorTurnOutput): void {
  if (turn.raceDraftPatch) Object.assign(session.raceDraft, turn.raceDraftPatch);
  if (typeof turn.raceDraftPatch?.goal === 'string') session.childGoal = turn.raceDraftPatch.goal;
  if (turn.suggestedRobotAction === 'record_point') session.state = 'record_points';
  if (turn.suggestedRobotAction === 'preview_lap') session.state = 'preview';
  if (turn.suggestedRobotAction === 'run_lap') session.state = 'run';
}

function deterministicTutorTurn(request: RaceTutorTurnRequest): TutorTurnOutput {
  const content = request.childMessage.replace(/\s+/g, '');
  if (/4点|四点|竞速|比赛/u.test(content)) {
    return {
      publicReply:
        '好，我们把它当成一次小小赛车工程任务。先从定位开始：当你用遥控器把小车开到 A 点时，你觉得小车需要记录地图里的哪些信息，才能下次再找到 A 点？',
      mentions: [
        {
          expertId: 'localization',
          question: '孩子想做四点竞速赛，请引导他理解记录 A/B/C/D 点与 map 坐标、AMCL 定位的关系。',
          context: { stage: 'record_points', childCanUseRemoteControl: request.knownFacts?.childCanUseRemoteControl === true },
        },
      ],
      raceDraftPatch: { goal: 'four_point_race', nextPoint: 'A' },
      suggestedRobotAction: 'none',
    };
  }
  return {
    publicReply:
      '我先问一个小问题：你现在想解决的是记录赛道点、让小车预览路线，还是想讨论怎么让成绩更快？',
    mentions: [],
    suggestedRobotAction: 'none',
  };
}
