import type {
  AgentAssignment,
  BlueprintCatalog,
  FaultScenario,
  TaskDefinition,
} from '../domain/types.js';

export interface ReviewChallengeRequest {
  task: TaskDefinition;
  catalog: BlueprintCatalog;
  assignments: AgentAssignment[];
  existingDebugSessionCount: number;
}

export interface ReviewChallengeCandidateRequest {
  task: TaskDefinition;
  catalog: BlueprintCatalog;
  assignments: AgentAssignment[];
}

export interface ActiveReviewChallenge {
  mode: 'task-rule';
  fault: FaultScenario;
  simulatorOnly: true;
}

export function listReviewChallengeCandidates(
  request: ReviewChallengeCandidateRequest,
): FaultScenario[] {
  const assignedAgentIds = new Set(request.assignments.map(({ agentId }) => agentId));
  const faultById = new Map(request.catalog.faults.map((fault) => [fault.id, fault]));
  return request.task.faultScenarioIds
    .map((faultId) => faultById.get(faultId))
    .filter((fault): fault is FaultScenario =>
      fault !== undefined && assignedAgentIds.has(fault.agentId),
    );
}

export function selectReviewChallenge(
  request: ReviewChallengeRequest,
): ActiveReviewChallenge | undefined {
  if (request.existingDebugSessionCount > 0) return undefined;
  const fault = listReviewChallengeCandidates(request)[0];
  if (!fault) return undefined;
  return {
    mode: 'task-rule',
    fault,
    simulatorOnly: true,
  };
}
