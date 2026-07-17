import type { RobotPlan } from '../../robot/types.js';
import type { SceneDefinition } from '../domain/types.js';

export interface SimulationPose {
  xMeters: number;
  yMeters: number;
  headingDegrees: number;
}

export interface SimulationPathPoint extends SimulationPose {
  stepId?: string;
}

export type SimulationEventKind = 'move' | 'turn' | 'stop' | 'speech';

export interface SimulationEvent {
  id: string;
  stepId: string;
  batchIndex: number;
  parallel: boolean;
  kind: SimulationEventKind;
  status: 'completed' | 'blocked';
  title: string;
  detail: string;
  pose: SimulationPose;
  pathEndIndex: number;
  durationMs?: number;
  speechText?: string;
  collisionEntityId?: string;
}

export interface SimulationIssue {
  code: string;
  message: string;
  stepId?: string;
}

export interface SimulationRun {
  id: string;
  planId: string;
  status: 'completed' | 'blocked' | 'invalid';
  initialPose: SimulationPose;
  finalPose: SimulationPose;
  robotRadiusMeters: number;
  events: SimulationEvent[];
  path: SimulationPathPoint[];
  reachedTargetIds: string[];
  issues: SimulationIssue[];
}

export interface SimulationInput {
  plan: RobotPlan;
  scene: SceneDefinition;
  createId?: (prefix: string) => string;
}
