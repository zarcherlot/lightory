import type {
  AgentAssignment,
  AgentDefinition,
  AgentDelivery,
  AgentRestatement,
  BlueprintNode,
} from '../domain/types.js';

export function createMockRestatement(
  agent: AgentDefinition,
  assignment: AgentAssignment,
  inputNodes: BlueprintNode[],
): AgentRestatement {
  return {
    summary: `我是${agent.name}。我的任务是：${assignment.contract.goal.trim()}。`,
    understoodInputs: inputNodes.map(({ label }) => label),
    promisedOutputs: assignment.contract.expectedOutputs,
    uncertainties: ['我会按合同工作，但交付仍需要总工程师逐项复核。'],
  };
}

export function createMockDelivery(
  id: string,
  agent: AgentDefinition,
  assignment: AgentAssignment,
  existingDeliveries: AgentDelivery[],
  returnComment?: string,
): AgentDelivery {
  const version =
    Math.max(
      0,
      ...existingDeliveries
        .filter((delivery) => delivery.assignmentId === assignment.id)
        .map(({ version: itemVersion }) => itemVersion),
    ) + 1;
  const isRevision = version > 1;
  const acceptanceCoverage = isRevision
    ? assignment.contract.acceptanceCriteria
    : assignment.contract.acceptanceCriteria.slice(0, -1);

  return {
    id,
    assignmentId: assignment.id,
    version,
    summary: isRevision
      ? `${agent.name}已根据总工程师的退回意见完成第 ${version} 版草案。`
      : `${agent.name}提交了第 1 版草案，请总工程师对照合同逐项验收。`,
    assumptions: [
      `只使用合同允许的 Tool：${assignment.contract.toolIds.join('、')}`,
      ...(returnComment ? [`总工程师的修改意见：${returnComment}`] : []),
    ],
    uncertainties: isRevision
      ? ['修改已写入草案，但是否满足全部条件仍需总工程师复核。']
      : [agent.knownLimitations[0] ?? '可能遗漏任务合同中的一个边界条件。'],
    artifact: {
      goal: assignment.contract.goal,
      outputs: assignment.contract.expectedOutputs,
      toolIds: assignment.contract.toolIds,
      acceptanceCoverage,
      revisionComment: returnComment ?? '',
    },
    status: 'draft',
  };
}
