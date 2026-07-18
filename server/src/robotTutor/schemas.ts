export type RaceExpertId = 'localization' | 'motion' | 'safety' | 'strategy';
export type RaceTutorRobotAction = 'none' | 'record_point' | 'preview_lap' | 'run_lap';

export interface RaceTutorMention {
  expertId: RaceExpertId;
  question: string;
  context: Record<string, unknown>;
}

export interface TutorTurnOutput {
  publicReply: string;
  mentions: RaceTutorMention[];
  raceDraftPatch?: Record<string, unknown>;
  suggestedRobotAction: RaceTutorRobotAction;
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

export interface RaceTutorTurnResult extends TutorTurnOutput {
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
  state: 'goal' | 'record_points' | 'preview' | 'run' | 'review';
  childFacingHistory: Array<{ role: 'child' | 'tutor' | 'expert'; content: string }>;
  expertNotes: Array<{ expertId: RaceExpertId; note: string }>;
  raceDraft: Record<string, unknown>;
}

const expertIds = new Set<RaceExpertId>(['localization', 'motion', 'safety', 'strategy']);
const robotActions = new Set<RaceTutorRobotAction>(['none', 'record_point', 'preview_lap', 'run_lap']);

export function createRaceTutorSession(sessionId: string): RaceTutorSession {
  return {
    sessionId,
    recordedPoints: [],
    state: 'goal',
    childFacingHistory: [],
    expertNotes: [],
    raceDraft: {},
  };
}

export function parseTutorOutput(raw: unknown): TutorTurnOutput {
  const value = requireRecord(raw, 'Tutor output');
  const publicReply = requireNonEmptyString(value.publicReply, 'publicReply');
  const mentions = parseMentions(value.mentions);
  const suggestedRobotAction = robotActions.has(value.suggestedRobotAction as RaceTutorRobotAction)
    ? (value.suggestedRobotAction as RaceTutorRobotAction)
    : 'none';
  return {
    publicReply,
    mentions,
    ...(isRecord(value.raceDraftPatch) ? { raceDraftPatch: value.raceDraftPatch } : {}),
    suggestedRobotAction,
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

export function parseTutorOutputJson(output: string): TutorTurnOutput {
  return parseTutorOutput(parseJsonObject(output, 'Tutor output'));
}

export function parseExpertOutputJson(output: string): ExpertOutput {
  return parseExpertOutput(parseJsonObject(output, 'Expert output'));
}

function parseMentions(raw: unknown): RaceTutorMention[] {
  if (!Array.isArray(raw)) return [];
  const mentions: RaceTutorMention[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (!expertIds.has(item.expertId as RaceExpertId)) continue;
    const question = typeof item.question === 'string' ? item.question.trim() : '';
    if (!question) continue;
    mentions.push({
      expertId: item.expertId as RaceExpertId,
      question,
      context: isRecord(item.context) ? item.context : {},
    });
  }
  return mentions;
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
