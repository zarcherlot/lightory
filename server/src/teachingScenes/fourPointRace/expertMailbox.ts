import type { LlmRoleRunner } from '../../llmRoleExecutor.js';
import type { ExpertOutput, RaceTutorMention } from './schemas.js';
import { parseExpertOutputJson } from './schemas.js';
import { buildExpertPrompt, roleIdForExpert } from './skillPrompts.js';

export interface ExpertMailbox {
  ask(mention: RaceTutorMention): Promise<ExpertOutput>;
}

export function createExpertMailbox(options: { runner: LlmRoleRunner }): ExpertMailbox {
  return {
    async ask(mention) {
      const prompt = buildExpertPrompt(mention);
      const output = await options.runner({
        roleId: roleIdForExpert(mention.expertId),
        prompt,
      });
      return parseExpertOutputJson(output);
    },
  };
}
