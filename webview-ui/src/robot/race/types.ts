import type { PlanValidationResult, RobotPlan, RobotPlanState } from '../types.js';

export type RacePointName = 'A' | 'B' | 'C' | 'D';
export type RaceLapOrder = [RacePointName, RacePointName, RacePointName, RacePointName, RacePointName];

export interface RacePose {
  frame: 'map';
  x: number;
  y: number;
  thetaRad: number;
}

export interface RaceStrategy {
  name: 'baseline' | 'careful' | 'fast' | string;
  maxSpeedMps: number;
  minTurnSpeedMps: number;
  lookaheadMeters: number;
  waypointRadiusMeters: number;
  finishRadiusMeters: number;
}

export interface RaceSafety {
  frontStopDistanceMeters: number;
  maxDurationMs: number;
}

export interface RaceRunLapArgs {
  trackId: string;
  mapId?: string;
  order: RaceLapOrder;
  strategy?: Partial<RaceStrategy>;
  safety?: Partial<RaceSafety>;
}

export interface RaceTrackRef {
  trackId: string;
}

export interface RaceTrackSaveArgs extends RaceTrackRef {
  pointNames: RacePointName[];
  mapId?: string;
}

export interface PoiUpsertArgs {
  name: RacePointName | string;
  pose: RacePose;
  mapId?: string;
  aliases?: string[];
  source?: 'child' | 'agent' | 'operator';
}

export interface LocalizationInitialPoseArgs {
  pose: RacePose;
  covariancePreset: 'confident' | 'normal';
}

export interface LocalizationRecordPoseArgs {
  name: RacePointName | string;
  mapId?: string;
}

export interface LidarCheckSafetyArgs {
  frontStopDistanceMeters?: number;
}

export interface RaceToolPlanResult {
  plan: RobotPlan;
  validation: PlanValidationResult;
  submitted: RobotPlanState;
}

export interface LocalizationHealth {
  ok: boolean;
  mapServer?: boolean;
  amcl?: boolean;
  tf?: boolean;
  scan?: boolean;
  message?: string;
}

export interface LidarSnapshot {
  frontMinMeters?: number;
  leftMinMeters?: number;
  rightMinMeters?: number;
  scanAgeMs?: number;
}

export interface RaceResult {
  trackId: string;
  status: 'done' | 'stopped' | 'unsafe' | 'failed';
  elapsedMs?: number;
  stopReason?: string;
}

export const DEFAULT_RACE_ORDER: RaceLapOrder = ['A', 'B', 'C', 'D', 'A'];

export const DEFAULT_RACE_STRATEGY: RaceStrategy = {
  name: 'baseline',
  maxSpeedMps: 0.25,
  minTurnSpeedMps: 0.08,
  lookaheadMeters: 0.35,
  waypointRadiusMeters: 0.18,
  finishRadiusMeters: 0.22,
};

export const DEFAULT_RACE_SAFETY: RaceSafety = {
  frontStopDistanceMeters: 0.15,
  maxDurationMs: 120000,
};
