import type {
  AgentAssignment,
  AgentDelivery,
  AgentWorkflow,
  AgentWorkflowNode,
  BlueprintDocument,
} from '../domain/types.js';

export interface AgentWorkflowAnalysis {
  workflow: AgentWorkflow;
  issues: string[];
}

export function analyzeAgentWorkflow(document: BlueprintDocument): AgentWorkflowAnalysis {
  const issues: string[] = [];
  const assignments = selectAssignmentsByNode(document.assignments);
  const executableNodeIds = new Set(assignments.keys());

  for (const node of document.nodes) {
    if (node.kind === 'function' && !assignments.has(node.id)) {
      issues.push(`模块“${node.label || node.id}”还没有分配 Agent。`);
    }
  }

  const dependencies = new Map<string, string[]>();
  for (const nodeId of executableNodeIds) {
    dependencies.set(
      nodeId,
      findUpstreamExecutableNodes(nodeId, document, executableNodeIds),
    );
  }

  const { batches, cyclicNodeIds } = createTopologicalBatches(dependencies);
  if (cyclicNodeIds.length > 0) {
    issues.push(`交付连接形成循环：${cyclicNodeIds.join('、')}。`);
  }

  const acceptedDeliveryByAssignment = selectAcceptedDeliveries(document.deliveries);
  const workflowNodes = new Map<string, AgentWorkflowNode>();
  const orderedNodeIds = batches.flat();
  for (const cyclicNodeId of cyclicNodeIds) orderedNodeIds.push(cyclicNodeId);

  for (const nodeId of orderedNodeIds) {
    const assignment = assignments.get(nodeId);
    if (!assignment) continue;
    const dependsOnNodeIds = dependencies.get(nodeId) ?? [];
    const upstreamNodes = dependsOnNodeIds
      .map((dependencyId) => workflowNodes.get(dependencyId))
      .filter((node): node is AgentWorkflowNode => node !== undefined);
    const inputDeliveryIds = upstreamNodes
      .filter(({ nodeId }) => hasMessageConnection(document, nodeId, assignment.nodeId))
      .map(({ acceptedDeliveryId }) => acceptedDeliveryId)
      .filter((id): id is string => id !== undefined)
      .sort();
    const acceptedDelivery = acceptedDeliveryByAssignment.get(assignment.id);
    workflowNodes.set(
      nodeId,
      createWorkflowNode(
        assignment,
        acceptedDelivery,
        dependsOnNodeIds,
        upstreamNodes,
        inputDeliveryIds,
        cyclicNodeIds.includes(nodeId),
      ),
    );
  }

  return {
    workflow: {
      blueprintRevisionId: document.revisions.at(-1)?.id ?? '',
      nodes: [...workflowNodes.values()],
      batches,
    },
    issues,
  };
}

function createWorkflowNode(
  assignment: AgentAssignment,
  delivery: AgentDelivery | undefined,
  dependsOnNodeIds: string[],
  upstreamNodes: AgentWorkflowNode[],
  inputDeliveryIds: string[],
  cyclic: boolean,
): AgentWorkflowNode {
  const base = {
    nodeId: assignment.nodeId,
    assignmentId: assignment.id,
    dependsOnNodeIds,
  };
  if (cyclic) return { ...base, status: 'blocked', dirtyReason: '交付连接形成循环。' };

  const upstreamBlocked = upstreamNodes.some(({ status }) => status !== 'accepted');
  if (!delivery) {
    if (upstreamBlocked) return { ...base, status: 'blocked', dirtyReason: '上游交付尚未就绪。' };
    if (assignment.status === 'awaiting-review') return { ...base, status: 'awaiting-review' };
    if (assignment.status === 'working') return { ...base, status: 'ready' };
    return { ...base, status: 'waiting' };
  }

  const artifact = delivery.artifact;
  const contractChanged = artifact.sourceContractRevision !== assignment.contract.revision;
  const inputsChanged = !sameIds(artifact.inputArtifactIds, inputDeliveryIds);
  if (contractChanged || inputsChanged || upstreamBlocked) {
    const reasons = [
      ...(contractChanged ? ['合同已经修改'] : []),
      ...(inputsChanged ? ['上游交付已经变化'] : []),
      ...(upstreamBlocked ? ['上游模块需要重做'] : []),
    ];
    return {
      ...base,
      acceptedDeliveryId: delivery.id,
      status: 'dirty',
      dirtyReason: `${reasons.join('、')}。`,
    };
  }

  return { ...base, acceptedDeliveryId: delivery.id, status: 'accepted' };
}

function selectAssignmentsByNode(assignments: AgentAssignment[]): Map<string, AgentAssignment> {
  const result = new Map<string, AgentAssignment>();
  for (const assignment of assignments) {
    const current = result.get(assignment.nodeId);
    if (!current || assignment.createdAt >= current.createdAt) {
      result.set(assignment.nodeId, assignment);
    }
  }
  return result;
}

function selectAcceptedDeliveries(deliveries: AgentDelivery[]): Map<string, AgentDelivery> {
  const result = new Map<string, AgentDelivery>();
  for (const delivery of deliveries) {
    if (delivery.status !== 'accepted') continue;
    const current = result.get(delivery.assignmentId);
    if (!current || delivery.version > current.version) result.set(delivery.assignmentId, delivery);
  }
  return result;
}

function findUpstreamExecutableNodes(
  targetId: string,
  document: BlueprintDocument,
  executableNodeIds: Set<string>,
): string[] {
  const incoming = new Map<string, string[]>();
  for (const edge of document.edges) {
    const sources = incoming.get(edge.targetId) ?? [];
    sources.push(edge.sourceId);
    incoming.set(edge.targetId, sources);
  }
  const result = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string): void => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const sourceId of incoming.get(nodeId) ?? []) {
      if (executableNodeIds.has(sourceId)) result.add(sourceId);
      else visit(sourceId);
    }
  };
  visit(targetId);
  return [...result].sort();
}

function hasMessageConnection(
  document: BlueprintDocument,
  sourceNodeId: string,
  targetNodeId: string,
): boolean {
  const visited = new Set<string>();
  const visit = (nodeId: string, sawMessage: boolean): boolean => {
    const key = `${nodeId}:${sawMessage}`;
    if (visited.has(key)) return false;
    visited.add(key);
    for (const edge of document.edges.filter(({ targetId }) => targetId === nodeId)) {
      const nextSawMessage = sawMessage || edge.handoffKind === 'message';
      if (edge.sourceId === sourceNodeId) return nextSawMessage;
      const sourceNode = document.nodes.find(({ id }) => id === edge.sourceId);
      if (sourceNode?.kind !== 'function' && visit(edge.sourceId, nextSawMessage)) return true;
    }
    return false;
  };
  return visit(targetNodeId, false);
}

function createTopologicalBatches(dependencies: Map<string, string[]>): {
  batches: string[][];
  cyclicNodeIds: string[];
} {
  const remaining = new Map(
    [...dependencies].map(([nodeId, dependencyIds]) => [nodeId, new Set(dependencyIds)]),
  );
  const batches: string[][] = [];
  while (remaining.size > 0) {
    const batch = [...remaining]
      .filter(([, dependencyIds]) => dependencyIds.size === 0)
      .map(([nodeId]) => nodeId)
      .sort();
    if (batch.length === 0) break;
    batches.push(batch);
    for (const nodeId of batch) remaining.delete(nodeId);
    for (const dependencyIds of remaining.values()) {
      for (const nodeId of batch) dependencyIds.delete(nodeId);
    }
  }
  return { batches, cyclicNodeIds: [...remaining.keys()].sort() };
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  return sortedLeft.every((id, index) => id === right[index]);
}
