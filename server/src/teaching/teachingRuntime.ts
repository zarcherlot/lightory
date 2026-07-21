import type { LlmRoleRunner } from '../llmRoleExecutor.js';
import {
  createTeachingStudentModel,
  mergeTeachingStudentModel,
  parseTeachingTurnOutputJson,
  type TeachingStudentModel,
  type TeachingStudentModelPatch,
  type TeachingTurnOutput,
} from './schemas.js';
import { buildTeachingSkillPrompt } from './teachingSkill.js';

/**
 * Generic AI teacher runtime.
 *
 * This layer owns pedagogy: student model, teaching move pacing, and structured
 * teacher output. It does not know about robot races, WebSocket messages, or
 * scene-specific tools; scenes adapt those facts at the boundary.
 */
export interface TeachingTurnRequest {
  sessionId: string;
  childMessage: string;
  availableTools: Array<Record<string, unknown>>;
  memory: Record<string, unknown>;
  sceneContext: Record<string, unknown>;
  conversationHistory: Array<{ role: string; content: string }>;
  studentModelPatch?: TeachingStudentModelPatch;
}

export interface TeachingTurnResult extends TeachingTurnOutput {
  studentModel: TeachingStudentModel;
}

export interface TeachingRuntime {
  handleTurn(request: TeachingTurnRequest): Promise<TeachingTurnResult>;
  getStudentModel(sessionId: string): TeachingStudentModel | undefined;
}

export function createTeachingRuntime(options: { runner: LlmRoleRunner }): TeachingRuntime {
  const studentModels = new Map<string, TeachingStudentModel>();

  return {
    async handleTurn(request) {
      const current = mergeTeachingStudentModel(
        studentModels.get(request.sessionId) ?? createTeachingStudentModel(),
        request.studentModelPatch,
      );
      const prompt = buildTeachingSkillPrompt({
        studentModel: current,
        availableTools: request.availableTools,
        memory: request.memory,
        sceneContext: request.sceneContext,
        conversationHistory: request.conversationHistory,
        childMessage: request.childMessage,
      });
      const firstOutput = parseTeachingTurnOutputJson(
        await options.runner({
          roleId: 'ai-teacher-agent',
          prompt,
        }),
      );
      const output = await repairTeachingTurnIfNeeded(firstOutput, prompt, options.runner);
      const nextModel = mergeTeachingStudentModel(current, output.studentModelPatch);
      studentModels.set(request.sessionId, nextModel);
      return { ...output, studentModel: nextModel };
    },
    getStudentModel(sessionId) {
      return studentModels.get(sessionId);
    },
  };
}

async function repairTeachingTurnIfNeeded(
  output: TeachingTurnOutput,
  originalPrompt: string,
  runner: LlmRoleRunner,
): Promise<TeachingTurnOutput> {
  const violation = validateTeachingTurnContract(output);
  if (!violation) return output;
  return parseTeachingTurnOutputJson(
    await runner({
      roleId: 'ai-teacher-agent',
      prompt: [
        originalPrompt,
        '',
        'Your previous JSON violated the teaching runtime contract.',
        `Violation: ${violation}`,
        `Previous JSON: ${JSON.stringify(output)}`,
        '重新输出 JSON。不要由 runtime 替你选择工具；如果你进入 experiment_turn，请你自己决定 suggestedAction 和参数。',
        '如果你决定不调用工具，必须保留 suggestedAction.action="none" 并写出 noToolReason。',
      ].join('\n'),
    }),
  );
}

function validateTeachingTurnContract(output: TeachingTurnOutput): string | null {
  if (output.turnKind === 'question_turn' && !output.childQuestion) {
    return 'question_turn requires childQuestion.';
  }
  if (
    output.turnKind === 'experiment_turn' &&
    output.suggestedAction.action === 'none' &&
    !output.noToolReason
  ) {
    return 'experiment_turn with no tool action requires noToolReason.';
  }
  return null;
}
