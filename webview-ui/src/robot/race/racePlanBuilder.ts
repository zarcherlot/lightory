import type { RobotPlan, RobotPlanStep, RobotRisk } from '../types.js';
import {
  DEFAULT_RACE_ORDER,
  DEFAULT_RACE_SAFETY,
  DEFAULT_RACE_STRATEGY,
  type LidarCheckSafetyArgs,
  type LocalizationInitialPoseArgs,
  type LocalizationRecordPoseArgs,
  type PoiUpsertArgs,
  type RacePreviewArgs,
  type RaceRunLapArgs,
  type RaceTrackRef,
  type RaceTrackSaveArgs,
} from './types.js';

export interface RaceBuildContext {
  padId: string;
  sessionId: string;
}

export function buildRaceRunLapPlan(ctx: RaceBuildContext, args: RaceRunLapArgs): RobotPlan {
  const normalized = normalizeRunLapArgs(args);
  return createRacePlan(
    ctx,
    'plan_race_run_lap',
    `四点竞速赛 ${normalized.trackId} 跑一圈`,
    'high',
    true,
    [
      {
        id: 's1',
        tool: 'race.runLap',
        args: normalized,
        timeoutMs: normalized.safety.maxDurationMs + 1000,
        safety: {
          requiresLease: 'base',
          stopOnObstacle: true,
          maxSpeedMps: normalized.strategy.maxSpeedMps,
        },
      },
      {
        id: 's2',
        tool: 'race.stop',
        dependsOn: ['s1'],
        args: { reason: 'plan-finished' },
        safety: { requiresLease: 'base' },
      },
    ],
    normalized.safety.maxDurationMs + 2000,
    ['A/B/C/D 赛道点已记录在 map 坐标系', '小车前方与赛道区域已由操作者确认安全'],
  );
}

export function buildRacePreviewLapPlan(ctx: RaceBuildContext, args: RacePreviewArgs): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_race_preview', `预览四点赛道 ${args.trackId}`, 'race.previewLap', {
    trackId: args.trackId,
    order: args.order ?? DEFAULT_RACE_ORDER,
    ...(args.strategy ? { strategy: { ...DEFAULT_RACE_STRATEGY, ...args.strategy } } : {}),
  });
}

export function buildLocalizationHealthPlan(ctx: RaceBuildContext): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_localization_health', '检查定位状态', 'localization.health', {});
}

export function buildLocalizationStatePlan(ctx: RaceBuildContext): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_localization_state', '读取当前定位', 'localization.state', {});
}

export function buildSetInitialPosePlan(
  ctx: RaceBuildContext,
  args: LocalizationInitialPoseArgs,
): RobotPlan {
  return createRaceToolPlan(
    ctx,
    'plan_localization_initial_pose',
    '设置小车初始位姿',
    'localization.setInitialPose',
    args,
    'medium',
  );
}

export function buildRecordCurrentPosePlan(
  ctx: RaceBuildContext,
  name: LocalizationRecordPoseArgs['name'],
): RobotPlan {
  return createRaceToolPlan(
    ctx,
    'plan_localization_record_pose',
    `记录赛道点 ${name}`,
    'localization.recordCurrentPose',
    { name },
    'medium',
  );
}

export function buildPoiListPlan(ctx: RaceBuildContext): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_poi_list', '列出赛道点', 'poi.list', {});
}

export function buildPoiUpsertPlan(ctx: RaceBuildContext, args: PoiUpsertArgs): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_poi_upsert', `保存赛道点 ${args.name}`, 'poi.upsert', args, 'medium');
}

export function buildPoiGetPlan(ctx: RaceBuildContext, name: string): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_poi_get', `读取赛道点 ${name}`, 'poi.get', { name });
}

export function buildPoiDeletePlan(ctx: RaceBuildContext, name: string): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_poi_delete', `删除赛道点 ${name}`, 'poi.delete', { name }, 'medium');
}

export function buildRaceTrackSavePlan(ctx: RaceBuildContext, args: RaceTrackSaveArgs): RobotPlan {
  return createRaceToolPlan(
    ctx,
    'plan_race_track_save',
    `保存四点赛道 ${args.trackId}`,
    'race.track.save',
    args,
    'medium',
  );
}

export function buildRaceTrackGetPlan(ctx: RaceBuildContext, args: RaceTrackRef): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_race_track_get', `读取四点赛道 ${args.trackId}`, 'race.track.get', args);
}

export function buildRaceTrackListPlan(ctx: RaceBuildContext): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_race_track_list', '列出四点赛道', 'race.track.list', {});
}

export function buildRaceTrackClearPlan(ctx: RaceBuildContext, args: RaceTrackRef): RobotPlan {
  return createRaceToolPlan(
    ctx,
    'plan_race_track_clear',
    `清空四点赛道 ${args.trackId}`,
    'race.track.clear',
    args,
    'medium',
  );
}

export function buildLidarSnapshotPlan(ctx: RaceBuildContext): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_lidar_snapshot', '读取雷达扇区距离', 'lidar.snapshot', {});
}

export function buildLidarCheckSafetyPlan(
  ctx: RaceBuildContext,
  args: LidarCheckSafetyArgs = {},
): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_lidar_check_safety', '检查赛道前方安全距离', 'lidar.checkSafety', args);
}

export function buildRaceStatusPlan(ctx: RaceBuildContext): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_race_status', '读取竞速赛状态', 'race.status', {});
}

export function buildRaceStopPlan(ctx: RaceBuildContext, reason = 'pad-requested'): RobotPlan {
  return createRaceToolPlan(ctx, 'plan_race_stop', '停止竞速赛', 'race.stop', { reason }, 'critical');
}

function createRaceToolPlan(
  ctx: RaceBuildContext,
  kind: string,
  intent: string,
  tool: string,
  args: Record<string, unknown>,
  risk: RobotRisk = 'low',
): RobotPlan {
  return createRacePlan(
    ctx,
    kind,
    intent,
    risk,
    false,
    [{ id: 's1', tool, args, ...(tool === 'race.stop' ? { safety: { requiresLease: 'base' as const } } : {}) }],
    5000,
    [],
  );
}

function createRacePlan(
  ctx: RaceBuildContext,
  kind: string,
  intent: string,
  risk: RobotRisk,
  requiresUserConfirmation: boolean,
  steps: RobotPlanStep[],
  maxDurationMs: number,
  assumptions: string[],
): RobotPlan {
  const now = Date.now();
  return {
    schemaVersion: 'robot-plan/v1',
    planId: `${kind}_${slugify(intent)}_${now.toString(36)}`,
    createdAt: new Date(now).toISOString(),
    createdBy: {
      padId: ctx.padId,
      sessionId: ctx.sessionId,
      agentRunId: `agent_${now.toString(36)}`,
    },
    intent,
    risk,
    requiresUserConfirmation,
    assumptions,
    steps,
    constraints: {
      maxDurationMs,
      maxSteps: Math.max(steps.length, 1),
      allowedTools: [...new Set(steps.map((step) => step.tool))],
    },
  };
}

function normalizeRunLapArgs(args: RaceRunLapArgs): Required<RaceRunLapArgs> {
  return {
    trackId: args.trackId.trim(),
    order: args.order ?? DEFAULT_RACE_ORDER,
    strategy: { ...DEFAULT_RACE_STRATEGY, ...args.strategy },
    safety: { ...DEFAULT_RACE_SAFETY, ...args.safety },
  };
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36) || 'plan'
  );
}
