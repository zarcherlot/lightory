export type TeachingDomain =
  | 'physics'
  | 'math'
  | 'science'
  | 'technology'
  | 'engineering'
  | 'general';

export type TeachingMoveKind =
  | 'diagnostic_question'
  | 'socratic_question'
  | 'brief_explanation_then_question'
  | 'analogy_then_question'
  | 'experiment_prompt'
  | 'review_prompt'
  | 'direct_safety_intervention';

export type TeachingTurnKind =
  | 'question_turn'
  | 'explain_turn'
  | 'experiment_turn'
  | 'review_turn'
  | 'safety_turn';

export interface TeachingStudentModel {
  confirmedFacts: string[];
  masteredConcepts: string[];
  misconceptions: string[];
  frustrationSignals: string[];
  recentQuestionKeys: string[];
}

export interface TeachingKnowledgePoint {
  domain: TeachingDomain;
  concept: string;
}

export interface TeachingLearnerDiagnosis {
  observedNeed: string;
  confidence: number;
}

export interface TeachingMove {
  kind: TeachingMoveKind;
  purpose: string;
  hintLevel: number;
}

export interface TeachingSuggestedAction {
  action: string;
  evidence: string[];
}

export interface TeachingStudentModelPatch {
  confirmedFacts?: string[];
  masteredConcepts?: string[];
  misconceptions?: string[];
  frustrationSignals?: string[];
  recentQuestionKeys?: string[];
}

export interface TeachingExpertMention {
  expertId: string;
  question: string;
  context: Record<string, unknown>;
}

export interface TeachingTurnOutput {
  turnKind: TeachingTurnKind;
  childFacingReply: string;
  knowledgePoint: TeachingKnowledgePoint;
  learnerDiagnosis: TeachingLearnerDiagnosis;
  teachingMove: TeachingMove;
  childQuestion?: string;
  suggestedAction: TeachingSuggestedAction;
  noToolReason?: string;
  studentModelPatch?: TeachingStudentModelPatch;
  scenePatch?: Record<string, unknown>;
  expertMentions?: TeachingExpertMention[];
}

export function createTeachingStudentModel(): TeachingStudentModel {
  return {
    confirmedFacts: [],
    masteredConcepts: [],
    misconceptions: [],
    frustrationSignals: [],
    recentQuestionKeys: [],
  };
}

export function parseTeachingTurnOutput(raw: unknown): TeachingTurnOutput {
  const value = requireRecord(raw, 'Teaching turn output');
  const knowledgePoint = requireRecord(value.knowledgePoint, 'knowledgePoint');
  const learnerDiagnosis = requireRecord(value.learnerDiagnosis, 'learnerDiagnosis');
  const teachingMove = requireRecord(value.teachingMove, 'teachingMove');
  const suggestedAction = requireRecord(value.suggestedAction, 'suggestedAction');

  return {
    turnKind: parseTurnKind(value.turnKind, teachingMove.kind),
    childFacingReply: requireNonEmptyString(value.childFacingReply, 'childFacingReply'),
    knowledgePoint: {
      domain: parseDomain(knowledgePoint.domain),
      concept: requireNonEmptyString(knowledgePoint.concept, 'knowledgePoint.concept'),
    },
    learnerDiagnosis: {
      observedNeed: requireNonEmptyString(
        learnerDiagnosis.observedNeed,
        'learnerDiagnosis.observedNeed',
      ),
      confidence: clamp01(
        typeof learnerDiagnosis.confidence === 'number' ? learnerDiagnosis.confidence : 0,
      ),
    },
    teachingMove: {
      kind: parseTeachingMoveKind(teachingMove.kind),
      purpose: requireNonEmptyString(teachingMove.purpose, 'teachingMove.purpose'),
      hintLevel: clampHintLevel(
        typeof teachingMove.hintLevel === 'number' ? teachingMove.hintLevel : 0,
      ),
    },
    ...(typeof value.childQuestion === 'string' && value.childQuestion.trim()
      ? { childQuestion: value.childQuestion.trim() }
      : {}),
    suggestedAction: {
      action:
        typeof suggestedAction.action === 'string' && suggestedAction.action.trim()
          ? suggestedAction.action.trim()
          : 'none',
      evidence: parseStringList(suggestedAction.evidence) ?? [],
    },
    ...(typeof value.noToolReason === 'string' && value.noToolReason.trim()
      ? { noToolReason: value.noToolReason.trim() }
      : {}),
    ...(isRecord(value.studentModelPatch)
      ? { studentModelPatch: parseStudentModelPatch(value.studentModelPatch) }
      : {}),
    ...(isRecord(value.scenePatch) ? { scenePatch: value.scenePatch } : {}),
    ...(Array.isArray(value.expertMentions)
      ? { expertMentions: parseExpertMentions(value.expertMentions) }
      : {}),
  };
}

function parseTurnKind(raw: unknown, moveKind: unknown): TeachingTurnKind {
  if (
    raw === 'question_turn' ||
    raw === 'explain_turn' ||
    raw === 'experiment_turn' ||
    raw === 'review_turn' ||
    raw === 'safety_turn'
  ) {
    return raw;
  }
  if (moveKind === 'experiment_prompt') return 'experiment_turn';
  if (moveKind === 'review_prompt') return 'review_turn';
  if (moveKind === 'direct_safety_intervention') return 'safety_turn';
  if (moveKind === 'brief_explanation_then_question' || moveKind === 'analogy_then_question') {
    return 'question_turn';
  }
  return 'question_turn';
}

export function parseTeachingTurnOutputJson(output: string): TeachingTurnOutput {
  return parseTeachingTurnOutput(parseJsonObject(output, 'Teaching turn output'));
}

export function mergeTeachingStudentModel(
  current: TeachingStudentModel,
  patch: TeachingStudentModelPatch | undefined,
): TeachingStudentModel {
  if (!patch) return current;
  const repeatedQuestionSignals = (patch.recentQuestionKeys ?? [])
    .filter((key) => current.recentQuestionKeys.includes(key))
    .map((key) => `repeated_question:${key}`);

  return {
    confirmedFacts: mergeStringLists(current.confirmedFacts, patch.confirmedFacts),
    masteredConcepts: mergeStringLists(current.masteredConcepts, patch.masteredConcepts),
    misconceptions: mergeStringLists(current.misconceptions, patch.misconceptions),
    frustrationSignals: mergeStringLists(current.frustrationSignals, [
      ...(patch.frustrationSignals ?? []),
      ...repeatedQuestionSignals,
    ]),
    recentQuestionKeys: mergeStringLists(current.recentQuestionKeys, patch.recentQuestionKeys).slice(-6),
  };
}

function parseDomain(raw: unknown): TeachingDomain {
  return raw === 'physics' ||
    raw === 'math' ||
    raw === 'science' ||
    raw === 'technology' ||
    raw === 'engineering'
    ? raw
    : 'general';
}

function parseTeachingMoveKind(raw: unknown): TeachingMoveKind {
  const value = typeof raw === 'string' ? raw : '';
  if (
    value === 'diagnostic_question' ||
    value === 'socratic_question' ||
    value === 'brief_explanation_then_question' ||
    value === 'analogy_then_question' ||
    value === 'experiment_prompt' ||
    value === 'review_prompt' ||
    value === 'direct_safety_intervention'
  ) {
    return value;
  }
  return 'brief_explanation_then_question';
}

function parseStudentModelPatch(raw: Record<string, unknown>): TeachingStudentModelPatch {
  return {
    confirmedFacts: parseStringList(raw.confirmedFacts),
    masteredConcepts: parseStringList(raw.masteredConcepts),
    misconceptions: parseStringList(raw.misconceptions),
    frustrationSignals: parseStringList(raw.frustrationSignals),
    recentQuestionKeys: parseStringList(raw.recentQuestionKeys),
  };
}

function parseExpertMentions(raw: unknown[]): TeachingExpertMention[] {
  return raw
    .map((item) => {
      if (!isRecord(item)) return null;
      const expertId = typeof item.expertId === 'string' ? item.expertId.trim() : '';
      const question = typeof item.question === 'string' ? item.question.trim() : '';
      if (!expertId || !question) return null;
      return {
        expertId,
        question,
        context: isRecord(item.context) ? item.context : {},
      };
    })
    .filter((item): item is TeachingExpertMention => item !== null);
}

function parseStringList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const values = raw.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  return values.length > 0 ? values.map((item) => item.trim()) : undefined;
}

function mergeStringLists(current: string[], patch: string[] | undefined): string[] {
  if (!patch) return current;
  return [...new Set([...current, ...patch].map((item) => item.trim()).filter(Boolean))];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampHintLevel(value: number): number {
  return Math.max(0, Math.min(4, Math.round(value)));
}

function parseJsonObject(output: string, label: string): Record<string, unknown> {
  const trimmed = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return requireRecord(parsed, label);
  } catch (error) {
    throw new Error(
      `${label} must be JSON object: ${error instanceof Error ? error.message : String(error)}`,
    );
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
