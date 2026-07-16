import { createAgentArtifactOutputSchema } from '../domain/artifactSchemas.js';
import type {
  AgentAssignment,
  AgentDefinition,
  AgentDelivery,
  AgentWorkflowNode,
  BlueprintDocument,
} from '../domain/types.js';
import type { AgentRuntimeAdapter, AgentRuntimeArtifactInput } from './agentRuntimeAdapter.js';
import { analyzeAgentWorkflow } from './agentWorkflow.js';

export interface AgentBuildRequest {
  document: BlueprintDocument;
  agents: AgentDefinition[];
  adapter: AgentRuntimeAdapter;
  workspaceId: string;
  createId: (prefix: string) => string;
}

export interface AgentBuildBatchResult {
  nodeIds: string[];
  deliveries: AgentDelivery[];
  message: string;
}

export async function executeNextAgentBuildBatch(
  request: AgentBuildRequest,
): Promise<AgentBuildBatchResult> {
  if (!request.document.workflow) {
    throw new Error('总工程师需要先确认工程队的开工安排。');
  }
  const analysis = analyzeAgentWorkflow(request.document);
  if (analysis.issues.length > 0) {
    throw new Error(analysis.issues[0]);
  }
  const runnableNodes = selectNextRunnableBatch(request.document, analysis.workflow.nodes);
  if (runnableNodes.length === 0) {
    return {
      nodeIds: [],
      deliveries: [],
      message: describeNoRunnableWork(request.document, analysis.workflow.nodes),
    };
  }

  const deliveries = await Promise.all(
    runnableNodes.map((workflowNode) => executeNode(request, workflowNode)),
  );
  return {
    nodeIds: runnableNodes.map(({ nodeId }) => nodeId),
    deliveries,
    message:
      runnableNodes.length > 1
        ? `${runnableNodes.length} 位工程师已同时提交方案，请总工程师逐项验收。`
        : '工程师已提交方案，请总工程师验收。',
  };
}

function selectNextRunnableBatch(
  document: BlueprintDocument,
  workflowNodes: AgentWorkflowNode[],
): AgentWorkflowNode[] {
  const workflowByNode = new Map(workflowNodes.map((node) => [node.nodeId, node]));
  const assignmentById = new Map(document.assignments.map((item) => [item.id, item]));
  for (const batch of document.workflow?.batches ?? []) {
    const runnable = batch
      .map((nodeId) => workflowByNode.get(nodeId))
      .filter((node): node is AgentWorkflowNode => node !== undefined)
      .filter((node) => {
        const assignment = assignmentById.get(node.assignmentId);
        return assignment !== undefined && isRunnable(node, assignment, workflowByNode);
      });
    if (runnable.length > 0) return runnable;
  }
  return [];
}

function isRunnable(
  node: AgentWorkflowNode,
  assignment: AgentAssignment,
  workflowByNode: Map<string, AgentWorkflowNode>,
): boolean {
  if (
    node.dependsOnNodeIds.some(
      (nodeId) => workflowByNode.get(nodeId)?.status !== 'accepted',
    )
  ) {
    return false;
  }
  if (node.status === 'ready') return assignment.status === 'working';
  if (
    node.status !== 'dirty' ||
    (assignment.status !== 'accepted' && assignment.status !== 'working')
  ) return false;
  const delivery = node.acceptedDeliveryId;
  return delivery !== undefined;
}

async function executeNode(
  request: AgentBuildRequest,
  workflowNode: AgentWorkflowNode,
): Promise<AgentDelivery> {
  const assignment = request.document.assignments.find(
    ({ id }) => id === workflowNode.assignmentId,
  );
  if (!assignment) throw new Error(`找不到任务分配：${workflowNode.assignmentId}。`);
  const agent = request.agents.find(({ id }) => id === assignment.agentId);
  if (!agent) throw new Error(`找不到 Agent：${assignment.agentId}。`);
  const visibleArtifacts = collectVisibleArtifacts(request.document, workflowNode);
  const allowedToolIds = assignment.contract.toolIds.filter((toolId) =>
    agent.capabilityIds.includes(toolId),
  );
  if (allowedToolIds.length !== assignment.contract.toolIds.length) {
    throw new Error(`${agent.name}不能使用合同中的全部 Tool。`);
  }
  const outputSchema = createAgentArtifactOutputSchema(assignment.contract);
  const artifact = await request.adapter.execute({
    agentRole: agent.name,
    assignmentId: assignment.id,
    contract: assignment.contract,
    visibleArtifacts,
    allowedToolIds,
    outputSchema,
    workspaceId: request.workspaceId,
  });
  validateArtifactBoundary(artifact, assignment, visibleArtifacts);
  const version =
    Math.max(
      0,
      ...request.document.deliveries
        .filter(({ assignmentId }) => assignmentId === assignment.id)
        .map(({ version: itemVersion }) => itemVersion),
    ) + 1;
  return {
    id: request.createId('delivery'),
    assignmentId: assignment.id,
    version,
    summary: artifact.childSummary,
    assumptions: artifact.assumptions,
    uncertainties: ['结构和安全仍需总工程师验收。'],
    artifact,
    status: 'draft',
  };
}

function collectVisibleArtifacts(
  document: BlueprintDocument,
  workflowNode: AgentWorkflowNode,
): AgentRuntimeArtifactInput[] {
  const workflowByNode = new Map(document.workflow?.nodes.map((node) => [node.nodeId, node]));
  return workflowNode.dependsOnNodeIds.map((nodeId) => {
    const deliveryId = workflowByNode.get(nodeId)?.acceptedDeliveryId;
    const delivery = document.deliveries.find(({ id }) => id === deliveryId);
    if (!delivery) throw new Error(`上游模块 ${nodeId} 没有可用的已验收交付。`);
    return { deliveryId: delivery.id, artifact: delivery.artifact };
  });
}

function validateArtifactBoundary(
  artifact: AgentDelivery['artifact'],
  assignment: AgentAssignment,
  visibleArtifacts: AgentRuntimeArtifactInput[],
): void {
  if (artifact.sourceAssignmentId !== assignment.id) {
    throw new Error('Agent 交付引用了错误的任务合同。');
  }
  if (artifact.sourceContractRevision !== assignment.contract.revision) {
    throw new Error('Agent 交付不是基于当前合同修订生成的。');
  }
  const expectedInputs = visibleArtifacts.map(({ deliveryId }) => deliveryId).sort();
  const actualInputs = [...artifact.inputArtifactIds].sort();
  if (
    expectedInputs.length !== actualInputs.length ||
    expectedInputs.some((id, index) => id !== actualInputs[index])
  ) {
    throw new Error('Agent 读取了交付连接之外的输入，结果已被拒绝。');
  }
}

function describeNoRunnableWork(
  document: BlueprintDocument,
  workflowNodes: AgentWorkflowNode[],
): string {
  if (workflowNodes.every(({ status }) => status === 'accepted')) {
    return '所有工程师都已按当前合同完成工作。';
  }
  const needsConfirmation = workflowNodes.some((node) => {
    const assignment = document.assignments.find(({ id }) => id === node.assignmentId);
    return node.status === 'dirty' && assignment?.status !== 'accepted';
  });
  return needsConfirmation
    ? '有模块修改了合同，请先确认 Agent 的任务复述。'
    : '当前没有可运行模块，请先验收上游方案。';
}
