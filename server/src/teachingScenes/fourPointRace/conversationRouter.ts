import type { LlmRoleRunner } from '../../llmRoleExecutor.js';

export type RaceConversationSpeakerRole = 'child' | 'developer' | 'operator' | 'unknown';
export type RaceConversationRoute =
  | 'ai_tutor'
  | 'robot_execution'
  | 'robot_tool_planning'
  | 'general_robot_intent';

export interface RaceConversationRouteRequest {
  content: string;
  raceSessionActive?: boolean;
  knownFacts?: Record<string, unknown>;
}

export interface RaceConversationRouteDecision {
  speakerRole: RaceConversationSpeakerRole;
  route: RaceConversationRoute;
  confidence: number;
  reason: string;
}

export interface RaceConversationRouter {
  route(request: RaceConversationRouteRequest): Promise<RaceConversationRouteDecision>;
}

const speakerRoles = new Set<RaceConversationSpeakerRole>([
  'child',
  'developer',
  'operator',
  'unknown',
]);
const routes = new Set<RaceConversationRoute>([
  'ai_tutor',
  'robot_execution',
  'robot_tool_planning',
  'general_robot_intent',
]);

export function createRaceConversationRouter(options: {
  runner: LlmRoleRunner;
}): RaceConversationRouter {
  return {
    async route(request) {
      try {
        return normalizeRouteDecision(
          parseRouteDecisionJson(
            await options.runner({
              roleId: 'race-conversation-router',
              prompt: buildRaceConversationRoutePrompt(request),
            }),
          ),
        );
      } catch (error) {
        return {
          speakerRole: 'unknown',
          route: 'ai_tutor',
          confidence: 0,
          reason: `fallback: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  };
}

export function buildRaceConversationRoutePrompt(
  request: RaceConversationRouteRequest,
): string {
  return [
    '你是 Lightory 四点竞速赛 MVP 的 console 语义路由器。',
    '你的任务是根据说话人身份、上下文、教学阶段和真实小车安全风险，判断下一步应该由谁处理。',
    '',
    '路由选项：',
    '- ai_tutor: 孩子/用户提出目标、想玩、想挑战、描述观察、回答导师问题，或意图不明确时。由 AI 导师用苏格拉底式提问推进。',
    '- robot_execution: 开发工程师或操作者明确要求真实小车立即执行，例如使用已有 default-abcd 跑一圈、开发测试模式直接执行。',
    '- robot_tool_planning: 导师或操作者明确要求低/中风险工具步骤，例如记录当前 A 点、检查定位、检查雷达。',
    '- general_robot_intent: 与四点竞速教学无关的一般机器人命令，例如前进 2 米、转身、跳舞。',
    '',
    '重要原则：',
    '- 不要按关键词机械判断；同一句话要结合说话人身份和上下文。',
    '- 孩子说“我想玩一次四点竞速赛”是学习任务开始，不是立即让真实小车跑圈。',
    '- 如果说话人是孩子，并且已经在四点竞速会话中，即使他说“点位录好了，开始跑一圈”，仍然选择 ai_tutor；AI 导师会给出教学引导并通过 suggestedRobotAction 触发工具。',
    '- 如果已经在四点竞速会话中，孩子说“现在在 A 点”“这里是 A 点”“到 A 点了”“记住 A 点”，仍然选择 ai_tutor，让 AI 导师通过 record_point 工具记录赛道点。',
    '- 如果无法判断说话人身份或真实执行风险，选择 ai_tutor 追问。',
    '- 任何真实运动的执行路由仍会在客户端保留安全确认。',
    '',
    'Return JSON only: {"speakerRole":"child|developer|operator|unknown","route":"ai_tutor|robot_execution|robot_tool_planning|general_robot_intent","confidence":number,"reason":string}',
    '',
    `Race session active: ${request.raceSessionActive === true}`,
    `Known facts: ${JSON.stringify(request.knownFacts ?? {})}`,
    `Console input: ${request.content}`,
  ].join('\n');
}

function normalizeRouteDecision(
  decision: RaceConversationRouteDecision,
): RaceConversationRouteDecision {
  if (
    decision.speakerRole === 'child' &&
    (decision.route === 'robot_execution' || decision.route === 'robot_tool_planning')
  ) {
    return {
      ...decision,
      route: 'ai_tutor',
      reason: `${decision.reason} Normalized to AI tutor because child race actions stay teacher-led.`,
    };
  }
  return decision;
}

export function parseRouteDecisionJson(output: string): RaceConversationRouteDecision {
  const value = parseJsonObject(output);
  const speakerRole = speakerRoles.has(value.speakerRole as RaceConversationSpeakerRole)
    ? (value.speakerRole as RaceConversationSpeakerRole)
    : 'unknown';
  const route = routes.has(value.route as RaceConversationRoute)
    ? (value.route as RaceConversationRoute)
    : 'ai_tutor';
  const confidence =
    typeof value.confidence === 'number' && Number.isFinite(value.confidence)
      ? Math.max(0, Math.min(1, value.confidence))
      : 0;
  const reason =
    typeof value.reason === 'string' && value.reason.trim()
      ? value.reason.trim()
      : 'No route reason provided.';
  return { speakerRole, route, confidence, reason };
}

function parseJsonObject(output: string): Record<string, unknown> {
  const trimmed = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Route decision must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}
