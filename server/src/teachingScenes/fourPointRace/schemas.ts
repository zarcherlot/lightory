import type { TeachingStudentModel, TeachingStudentModelPatch } from '../../teaching/schemas.js';
import { createTeachingStudentModel } from '../../teaching/schemas.js';

export type RaceExpertId = 'localization' | 'motion' | 'safety' | 'strategy';
export type RaceTutorRobotAction = 'none' | 'record_point' | 'run_lap';

export interface RaceTutorMention {
  expertId: RaceExpertId;
  question: string;
  context: Record<string, unknown>;
}

export interface RaceTutorDecision {
  learnerIntent: string;
  activityState: string;
  teachingMove: Record<string, unknown>;
  toolCandidate?: {
    action: RaceTutorRobotAction;
    evidence: string[];
  };
  responsePlan?: Record<string, unknown>;
}

export interface ExpertOutput {
  publicReply: string;
  expertNote: string;
  raceDraftPatch?: Record<string, unknown>;
}

export interface ExpertPublicReply {
  expertId: RaceExpertId;
  publicReply: string;
}

export interface RaceTutorTurnResult {
  publicReply: string;
  mentions: RaceTutorMention[];
  raceDraftPatch?: Record<string, unknown>;
  suggestedRobotAction: RaceTutorRobotAction;
  decision?: RaceTutorDecision;
  studentModelPatch?: TeachingStudentModelPatch;
  expertReplies: ExpertPublicReply[];
  expertNotes?: Array<{ expertId: RaceExpertId; note: string }>;
}

export interface RaceTutorTurnRequest {
  sessionId: string;
  childMessage: string;
  knownFacts?: Record<string, unknown>;
}

export interface RaceTutorSession {
  sessionId: string;
  childGoal?: string;
  recordedPoints: string[];
  state: 'goal' | 'record_points' | 'run' | 'review';
  childFacingHistory: Array<{ role: 'child' | 'tutor' | 'expert'; content: string }>;
  expertNotes: Array<{ expertId: RaceExpertId; note: string }>;
  raceDraft: Record<string, unknown>;
  studentModel: TeachingStudentModel;
}

export function createRaceTutorSession(sessionId: string): RaceTutorSession {
  return {
    sessionId,
    recordedPoints: [],
    state: 'goal',
    childFacingHistory: [],
    expertNotes: [],
    raceDraft: {},
    studentModel: createTeachingStudentModel(),
  };
}

export function parseExpertOutput(raw: unknown): ExpertOutput {
  const value = requireRecord(raw, 'Expert output');
  return {
    publicReply: requireNonEmptyString(value.publicReply, 'publicReply'),
    expertNote:
      typeof value.expertNote === 'string' && value.expertNote.trim()
        ? value.expertNote.trim()
        : '',
    ...(isRecord(value.raceDraftPatch) ? { raceDraftPatch: value.raceDraftPatch } : {}),
  };
}

export function parseExpertOutputJson(output: string): ExpertOutput {
  return parseExpertOutput(parseJsonObject(output, 'Expert output'));
}

function parseJsonObject(output: string, label: string): Record<string, unknown> {
  const trimmed = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return requireRecord(parsed, label);
  } catch (error) {
    throw new Error(`${label} must be JSON object: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
