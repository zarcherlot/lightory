import type {
  AgentAssignment,
  AgentDefinition,
  AgentTaskContract,
  BlueprintNode,
  ToolDefinition,
} from '../domain/types.js';

export interface AssignmentContext {
  agent: AgentDefinition;
  node: BlueprintNode;
  availableTools: ToolDefinition[];
}

export function createDraftAssignment(
  id: string,
  context: AssignmentContext,
  createdAt: number,
): AgentAssignment {
  if (context.node.kind !== 'function') {
    throw new Error('Agents can only be assigned to function nodes.');
  }
  const availableToolIds = new Set(context.availableTools.map(({ id }) => id));
  const usableToolIds = context.agent.capabilityIds.filter((id) => availableToolIds.has(id));
  if (usableToolIds.length === 0) {
    throw new Error('This agent has no tool available in the current task.');
  }
  return {
    id,
    nodeId: context.node.id,
    agentId: context.agent.id,
    status: 'draft',
    contract: emptyAgentTaskContract(usableToolIds),
    createdAt,
  };
}

export function emptyAgentTaskContract(toolIds: string[] = []): AgentTaskContract {
  return {
    revision: 1,
    goal: '',
    inputNodeIds: [],
    expectedOutputs: [],
    acceptanceCriteria: [],
    toolIds,
    evidenceIds: [],
  };
}

export function validateAgentTaskContract(
  contract: AgentTaskContract,
  context: AssignmentContext,
): string[] {
  const issues: string[] = [];
  if (!contract.goal.trim()) issues.push('请写清楚 Agent 要完成的局部目标');
  if (contract.expectedOutputs.length === 0) issues.push('请至少填写一项交付结果');
  if (contract.acceptanceCriteria.length === 0) issues.push('请至少填写一项验收标准');
  if (contract.toolIds.length === 0) issues.push('请至少选择一个可用 Tool');

  const allowedToolIds = new Set(
    context.availableTools
      .map(({ id }) => id)
      .filter((id) => context.agent.capabilityIds.includes(id)),
  );
  for (const toolId of contract.toolIds) {
    if (!allowedToolIds.has(toolId)) issues.push(`Agent 不能使用 Tool：${toolId}`);
  }
  return issues;
}
