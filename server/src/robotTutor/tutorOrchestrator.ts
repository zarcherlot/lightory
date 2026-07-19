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
  const lastRaceResult = isRecord(request.knownFacts?.lastRaceResult)
    ? request.knownFacts.lastRaceResult
    : undefined;
  if (lastRaceResult && /停|成绩|改进|复盘|为什么|怎么/u.test(content)) {
    const nearest = typeof lastRaceResult.nearestObstacleMeters === 'number'
      ? lastRaceResult.nearestObstacleMeters.toFixed(3)
      : '未知';
    const threshold = typeof lastRaceResult.thresholdMeters === 'number'
      ? lastRaceResult.thresholdMeters.toFixed(2)
      : '0.35';
    return {
      publicReply:
        `这次小车不是乱停，它看到前方大约 ${nearest} 米，已经接近安全线 ${threshold} 米。` +
        '我们先像工程师一样只改一个变量：你觉得下一次应该先改变安全距离、路线位置，还是过弯速度？为什么？',
      mentions: [
        {
          expertId: 'safety',
          question: '孩子看到 race.runLap 因 front_obstacle_too_close 停止，请用安全工程师视角引导他理解雷达阈值和安全停车。',
          context: { stage: 'review_lidar_stop', lastRaceResult },
        },
        {
          expertId: 'strategy',
          question: '孩子想改进成绩，请引导他选择一个变量做下一圈对比实验。',
          context: { stage: 'choose_one_variable', lastRaceResult },
        },
      ],
      raceDraftPatch: { reviewFocus: 'choose_one_variable', lastRaceResult },
      suggestedRobotAction: 'none',
    };
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
