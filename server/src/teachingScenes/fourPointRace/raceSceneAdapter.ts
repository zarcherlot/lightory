import type { TeachingTurnOutput } from '../../teaching/schemas.js';
import type { RaceExpertId, RaceTutorMention, RaceTutorRobotAction, RaceTutorTurnResult } from './schemas.js';

/**
 * Four-point race scene boundary.
 *
 * Converts saved tracks, lap results, and race tools into generic teaching
 * context, then maps the teacher's scene-neutral decision back to the existing
 * raceTutor protocol and robot action names.
 */
const raceActions = new Set<RaceTutorRobotAction>(['none', 'record_point', 'run_lap']);
const raceExperts = new Set<RaceExpertId>(['localization', 'motion', 'safety', 'strategy']);

export interface RaceSceneAdapter {
  buildContext(knownFacts?: Record<string, unknown>): Record<string, unknown>;
  buildMemory(knownFacts?: Record<string, unknown>): Record<string, unknown>;
  buildAvailableTools(knownFacts?: Record<string, unknown>): Array<Record<string, unknown>>;
  toRaceTutorOutput(
    turn: TeachingTurnOutput,
    sceneContext?: Record<string, unknown>,
  ): Omit<RaceTutorTurnResult, 'expertReplies' | 'expertNotes'>;
  toRaceExpertMentions(turn: TeachingTurnOutput): RaceTutorMention[];
}

export function createRaceSceneAdapter(): RaceSceneAdapter {
  return {
    buildAvailableTools,
    buildContext,
    buildMemory,
    toRaceExpertMentions,
    toRaceTutorOutput,
  };
}

function buildContext(knownFacts?: Record<string, unknown>): Record<string, unknown> {
  const race = isRecord(knownFacts?.race) ? knownFacts.race : {};
  const track = isRecord(race.track) ? race.track : undefined;
  const recordedPoints = Array.isArray(track?.recordedPoints)
    ? track.recordedPoints.filter((point): point is string => typeof point === 'string')
    : [];
  const latestLap = isRecord(race.latestLap)
    ? race.latestLap
    : isRecord(knownFacts?.lastRaceResult)
      ? knownFacts.lastRaceResult
      : undefined;

  return {
    sceneId: 'four_point_race',
    facts: {
      hasSavedRoute: hasCompleteAbcd(recordedPoints),
      ...(typeof track?.trackId === 'string' && track.trackId.trim()
        ? { savedRouteId: track.trackId.trim() }
        : {}),
      recordedPoints,
      ...(isRecord(race.latestRaceToolResult) ? { latestRaceToolResult: race.latestRaceToolResult } : {}),
      ...(Array.isArray(race.recentRobotEvents) ? { recentRobotEvents: race.recentRobotEvents } : {}),
      ...(typeof latestLap?.status === 'string' ? { latestLapStatus: latestLap.status } : {}),
      ...(typeof latestLap?.elapsedMs === 'number' ? { latestLapElapsedMs: latestLap.elapsedMs } : {}),
      ...(typeof latestLap?.stopReason === 'string' ? { latestLapStopReason: latestLap.stopReason } : {}),
      ...(typeof latestLap?.nearestObstacleMeters === 'number'
        ? { nearestObstacleMeters: latestLap.nearestObstacleMeters }
        : {}),
      ...(typeof latestLap?.thresholdMeters === 'number' ? { thresholdMeters: latestLap.thresholdMeters } : {}),
      childCanUseRemoteControl: knownFacts?.childCanUseRemoteControl === true,
    },
  };
}

function buildMemory(knownFacts?: Record<string, unknown>): Record<string, unknown> {
  const memory = isRecord(knownFacts?.memory) ? knownFacts.memory : {};
  const context = buildContext(knownFacts);
  return {
    ...memory,
    knownActivities: ['four_point_race'],
    raceFacts: context.facts,
  };
}

function buildAvailableTools(knownFacts?: Record<string, unknown>): Array<Record<string, unknown>> {
  if (Array.isArray(knownFacts?.tools)) {
    return knownFacts.tools.filter(isRecord);
  }
  return [
    { name: 'race.track.list', risk: 'low', purpose: '读取可复用赛道记忆' },
    { name: 'race.track.get', risk: 'low', purpose: '读取指定赛道点位' },
    {
      name: 'race.recordPoint',
      risk: 'medium',
      purpose: '把小车当前定位记录为指定赛道点',
      inputSchema: {
        type: 'object',
        required: ['nextPoint'],
        properties: {
          nextPoint: {
            type: 'string',
            enum: ['A', 'B', 'C', 'D'],
            description: '要记录的赛道点名称；孩子说到了 B 点时必须传 B，不能省略。',
          },
        },
      },
      examples: [
        { label: 'record_a', scenePatch: { nextPoint: 'A' } },
        { label: 'record_b', scenePatch: { nextPoint: 'B' } },
      ],
    },
    {
      name: 'race.runLap',
      risk: 'high',
      purpose: '执行一圈真实小车竞速；可用 strategy 参数做控制变量实验',
      inputSchema: {
        type: 'object',
        required: ['trackId'],
        properties: {
          trackId: { type: 'string', default: 'default-abcd', description: '保存赛道 id' },
          mapId: {
            type: 'string',
            description: '赛道所属地图 id；换场地后必须和已记录点位的 mapId 一致，例如 map_02。',
          },
          order: {
            type: 'array',
            items: { enum: ['A', 'B', 'C', 'D'] },
            default: ['A', 'B', 'C', 'D', 'A'],
            description: '竞速顺序，闭环默认 A-B-C-D-A',
          },
          strategy: {
            type: 'object',
            description: '控制策略参数。比较成绩时一次只改一个变量，并在回复中说明目标值。',
            properties: {
              maxSpeedMps: {
                type: 'number',
                minimum: 0.05,
                maximum: 0.5,
                default: 0.25,
                unit: 'm/s',
                description: '直线/整体最高速度；小场地建议每次只增加 0.03-0.05。',
              },
              minTurnSpeedMps: {
                type: 'number',
                minimum: 0.03,
                maximum: 0.5,
                default: 0.08,
                unit: 'm/s',
                description: '转弯时保留的最低速度。',
              },
              lookaheadMeters: {
                type: 'number',
                minimum: 0.05,
                maximum: 1,
                default: 0.35,
                unit: 'm',
                description: '前视距离；越大越早朝后续点转向，短赛段可小幅调整。',
              },
              waypointRadiusMeters: {
                type: 'number',
                minimum: 0.05,
                maximum: 1,
                default: 0.18,
                unit: 'm',
                description: '经过中间点的判定半径。',
              },
              finishRadiusMeters: {
                type: 'number',
                minimum: 0.05,
                maximum: 1,
                default: 0.22,
                unit: 'm',
                description: '回到终点 A 的完成半径。',
              },
            },
          },
          safety: {
            type: 'object',
            properties: {
              frontStopDistanceMeters: {
                type: 'number',
                minimum: 0.05,
                default: 0.15,
                unit: 'm',
                description: '前方安全停止距离。',
              },
              maxDurationMs: {
                type: 'number',
                minimum: 1000,
                default: 120000,
                unit: 'ms',
                description: '单圈最长运行时间。',
              },
            },
          },
        },
      },
      examples: [
        {
          label: 'baseline',
          scenePatch: { runLap: { trackId: 'default-abcd', strategy: { maxSpeedMps: 0.25 } } },
        },
        {
          label: 'small_speed_increase',
          scenePatch: { runLap: { trackId: 'default-abcd', strategy: { maxSpeedMps: 0.3 } } },
        },
        {
          label: 'earlier_turning',
          scenePatch: { runLap: { trackId: 'default-abcd', strategy: { lookaheadMeters: 0.42 } } },
        },
      ],
    },
  ];
}

function toRaceTutorOutput(
  turn: TeachingTurnOutput,
  sceneContext?: Record<string, unknown>,
): Omit<RaceTutorTurnResult, 'expertReplies' | 'expertNotes'> {
  const requestedAction = toRaceAction(turn.suggestedAction.action);
  const normalizedPatch = normalizeRaceDraftPatch(turn.scenePatch, requestedAction, sceneContext);
  const hasInvalidRecordPoint = requestedAction === 'record_point' && !hasRacePoint(normalizedPatch?.nextPoint);
  const action = hasInvalidRecordPoint ? 'none' : requestedAction;
  const raceDraftPatch = hasInvalidRecordPoint ? undefined : normalizedPatch;

  return {
    publicReply: turn.childFacingReply,
    mentions: toRaceExpertMentions(turn),
    ...(raceDraftPatch ? { raceDraftPatch } : {}),
    suggestedRobotAction: action,
    decision: {
      learnerIntent: turn.learnerDiagnosis.observedNeed,
      activityState: typeof raceDraftPatch?.activityState === 'string' ? raceDraftPatch.activityState : 'unknown',
      teachingMove: { ...turn.teachingMove },
      ...(action === 'none'
        ? {}
        : { toolCandidate: { action, evidence: turn.suggestedAction.evidence } }),
      responsePlan: {
        ...(turn.childQuestion ? { childQuestion: turn.childQuestion } : {}),
        knowledgePoint: turn.knowledgePoint,
      },
    },
    ...(turn.studentModelPatch ? { studentModelPatch: turn.studentModelPatch } : {}),
  };
}

function toRaceAction(action: string): RaceTutorRobotAction {
  if (action === 'race.recordPoint') return 'record_point';
  if (action === 'race.runLap') return 'run_lap';
  return raceActions.has(action as RaceTutorRobotAction) ? (action as RaceTutorRobotAction) : 'none';
}

function toRaceExpertMentions(turn: TeachingTurnOutput): RaceTutorMention[] {
  return (turn.expertMentions ?? [])
    .filter((mention) => raceExperts.has(mention.expertId as RaceExpertId))
    .map((mention) => ({
      expertId: mention.expertId as RaceExpertId,
      question: mention.question,
      context: mention.context,
    }));
}

function normalizeRaceDraftPatch(
  scenePatch: Record<string, unknown> | undefined,
  action: RaceTutorRobotAction,
  sceneContext: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const patch = isRecord(scenePatch) ? { ...scenePatch } : {};
  if (action === 'record_point') {
    const nextPoint = normalizeRacePoint(patch.nextPoint)
      ?? normalizeRacePoint(isRecord(patch.recordPoint) ? patch.recordPoint.nextPoint : undefined)
      ?? normalizeRacePoint(isRecord(patch.recordPoint) ? patch.recordPoint.name : undefined);
    if (!nextPoint) return undefined;
    return { ...patch, nextPoint };
  }
  if (action !== 'run_lap') return Object.keys(patch).length > 0 ? patch : undefined;
  if (isRecord(patch.runLap)) return patch;

  const trackId = getTrackId(patch) ?? getTrackId(isRecord(sceneContext?.facts) ? sceneContext.facts : {});
  if (!trackId) return Object.keys(patch).length > 0 ? patch : undefined;
  return {
    ...patch,
    runLap: { trackId },
  };
}

function getTrackId(value: Record<string, unknown>): string | undefined {
  if (typeof value.trackId === 'string' && value.trackId.trim()) return value.trackId.trim();
  if (typeof value.routeId === 'string' && value.routeId.trim()) return value.routeId.trim();
  if (typeof value.savedRouteId === 'string' && value.savedRouteId.trim()) return value.savedRouteId.trim();
  return undefined;
}

function hasCompleteAbcd(points: string[]): boolean {
  const names = new Set(points.map((point) => point.toUpperCase()));
  return ['A', 'B', 'C', 'D'].every((point) => names.has(point));
}

function hasRacePoint(value: unknown): value is 'A' | 'B' | 'C' | 'D' {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

function normalizeRacePoint(value: unknown): 'A' | 'B' | 'C' | 'D' | undefined {
  if (typeof value !== 'string') return undefined;
  const point = value.trim().toUpperCase();
  return hasRacePoint(point) ? point : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
