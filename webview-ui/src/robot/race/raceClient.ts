import type { RobotApiClient } from '../types.js';
import {
  buildLidarCheckSafetyPlan,
  buildLidarSnapshotPlan,
  buildLocalizationHealthPlan,
  buildLocalizationStatePlan,
  buildPoiDeletePlan,
  buildPoiGetPlan,
  buildPoiListPlan,
  buildPoiUpsertPlan,
  buildRacePreviewLapPlan,
  buildRaceRunLapPlan,
  buildRaceStatusPlan,
  buildRaceStopPlan,
  buildRaceTrackClearPlan,
  buildRaceTrackGetPlan,
  buildRaceTrackListPlan,
  buildRaceTrackSavePlan,
  buildRecordCurrentPosePlan,
  buildSetInitialPosePlan,
  type RaceBuildContext,
} from './racePlanBuilder.js';
import type {
  LidarCheckSafetyArgs,
  LocalizationInitialPoseArgs,
  PoiUpsertArgs,
  RacePointName,
  RacePreviewArgs,
  RaceRunLapArgs,
  RaceToolPlanResult,
  RaceTrackRef,
  RaceTrackSaveArgs,
} from './types.js';

export interface RaceRobotClient {
  getLocalizationHealth(): Promise<RaceToolPlanResult>;
  getLocalizationState(): Promise<RaceToolPlanResult>;
  setInitialPose(args: LocalizationInitialPoseArgs): Promise<RaceToolPlanResult>;
  recordCurrentPose(name: RacePointName | string): Promise<RaceToolPlanResult>;
  upsertPoi(args: PoiUpsertArgs): Promise<RaceToolPlanResult>;
  listPoi(): Promise<RaceToolPlanResult>;
  getPoi(name: string): Promise<RaceToolPlanResult>;
  deletePoi(name: string): Promise<RaceToolPlanResult>;
  saveTrack(args: RaceTrackSaveArgs): Promise<RaceToolPlanResult>;
  getTrack(args: RaceTrackRef): Promise<RaceToolPlanResult>;
  listTracks(): Promise<RaceToolPlanResult>;
  clearTrack(args: RaceTrackRef): Promise<RaceToolPlanResult>;
  getLidarSnapshot(): Promise<RaceToolPlanResult>;
  checkSafety(args?: LidarCheckSafetyArgs): Promise<RaceToolPlanResult>;
  getRaceStatus(): Promise<RaceToolPlanResult>;
  previewLap(args: RacePreviewArgs): Promise<RaceToolPlanResult>;
  runLap(args: RaceRunLapArgs): Promise<RaceToolPlanResult>;
  stopRace(reason?: string): Promise<RaceToolPlanResult>;
}

export function createRaceClient(api: RobotApiClient, ctx: RaceBuildContext): RaceRobotClient {
  const submit = async (plan: ReturnType<typeof buildRaceRunLapPlan>): Promise<RaceToolPlanResult> => {
    const validation = await api.validatePlan(plan);
    const submitted = await api.submitPlan(plan);
    return { plan, validation, submitted };
  };

  return {
    getLocalizationHealth: () => submit(buildLocalizationHealthPlan(ctx)),
    getLocalizationState: () => submit(buildLocalizationStatePlan(ctx)),
    setInitialPose: (args) => submit(buildSetInitialPosePlan(ctx, args)),
    recordCurrentPose: (name) => submit(buildRecordCurrentPosePlan(ctx, name)),
    upsertPoi: (args) => submit(buildPoiUpsertPlan(ctx, args)),
    listPoi: () => submit(buildPoiListPlan(ctx)),
    getPoi: (name) => submit(buildPoiGetPlan(ctx, name)),
    deletePoi: (name) => submit(buildPoiDeletePlan(ctx, name)),
    saveTrack: (args) => submit(buildRaceTrackSavePlan(ctx, args)),
    getTrack: (args) => submit(buildRaceTrackGetPlan(ctx, args)),
    listTracks: () => submit(buildRaceTrackListPlan(ctx)),
    clearTrack: (args) => submit(buildRaceTrackClearPlan(ctx, args)),
    getLidarSnapshot: () => submit(buildLidarSnapshotPlan(ctx)),
    checkSafety: (args = {}) => submit(buildLidarCheckSafetyPlan(ctx, args)),
    getRaceStatus: () => submit(buildRaceStatusPlan(ctx)),
    previewLap: (args) => submit(buildRacePreviewLapPlan(ctx, args)),
    runLap: (args) => submit(buildRaceRunLapPlan(ctx, args)),
    stopRace: (reason) => submit(buildRaceStopPlan(ctx, reason)),
  };
}
