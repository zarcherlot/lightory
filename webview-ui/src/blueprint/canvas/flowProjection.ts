import { type Edge, MarkerType, type Node, type XYPosition } from '@xyflow/react';

import type { BlueprintDocument, BlueprintEdge, BlueprintNode } from '../domain/types.js';

export interface BlueprintFlowNodeData extends Record<string, unknown> {
  label: string;
  kind: BlueprintNode['kind'];
  assignmentStatus?: BlueprintDocument['assignments'][number]['status'];
  controlSummary?: string;
}

export type BlueprintFlowNode = Node<BlueprintFlowNodeData>;
export type BlueprintFlowEdge = Edge<{
  relation: BlueprintEdge['relation'];
  handoffKind: BlueprintEdge['handoffKind'];
}>;

export interface BlueprintFlowProjection {
  nodes: BlueprintFlowNode[];
  edges: BlueprintFlowEdge[];
}

export function projectBlueprintToFlow(
  document: BlueprintDocument,
  scopeId?: string | null,
): BlueprintFlowProjection {
  const scoped = scopeId === undefined
    ? document.nodes
    : document.nodes.filter((node) => (scopeId === null ? !node.parentId : node.parentId === scopeId));
  const visibleIds = new Set(scoped.map(({ id }) => id));
  const orderedNodes = orderParentsBeforeChildren(scoped);
  const assignmentByNode = new Map(
    document.assignments.map((assignment) => [assignment.nodeId, assignment]),
  );
  return {
    nodes: orderedNodes.map((node) => ({
      id: node.id,
      type: node.kind,
      position: scopeId === undefined
        ? toRelativePosition(node, document.nodes)
        : toScopePosition(node, scopeId, document.nodes),
      parentId: scopeId === undefined ? node.parentId : undefined,
      extent: scopeId === undefined && node.parentId ? 'parent' : undefined,
      data: {
        label: node.label,
        kind: node.kind,
        assignmentStatus: assignmentByNode.get(node.id)?.status,
        controlSummary: describeControl(node),
      },
      style: { width: node.size.width, height: node.size.height },
      zIndex: node.kind === 'container' ? 0 : 2,
    })),
    edges: document.edges.filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId)).map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'smoothstep',
      animated: edge.handoffKind === 'completion',
      label: edge.label ?? (edge.handoffKind === 'completion' ? '完成消息' : '交付成果'),
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { relation: edge.relation, handoffKind: edge.handoffKind },
    })),
  };
}

function describeControl(node: BlueprintNode): string | undefined {
  if (node.kind === 'start') {
    return node.control?.handoffInformation.trim() || node.control?.inputInformation.trim() || undefined;
  }
  if (node.kind === 'end') {
    return node.control?.completionCondition.trim() || node.control?.inputInformation.trim() || '完成后安全停车';
  }
  return undefined;
}

export function toScopePosition(
  node: BlueprintNode,
  scopeId: string | null,
  nodes: BlueprintNode[],
): XYPosition {
  if (scopeId === null) return node.position;
  const parent = nodes.find(({ id }) => id === scopeId);
  if (!parent) return node.position;
  return { x: node.position.x - parent.position.x, y: node.position.y - parent.position.y };
}

export function fromScopePosition(
  position: XYPosition,
  scopeId: string | null,
  nodes: BlueprintNode[],
): XYPosition {
  if (scopeId === null) return position;
  const parent = nodes.find(({ id }) => id === scopeId);
  if (!parent) return position;
  return { x: position.x + parent.position.x, y: position.y + parent.position.y };
}

export function toBlueprintPosition(
  nodeId: string,
  flowPosition: XYPosition,
  document: BlueprintDocument,
): XYPosition {
  const node = document.nodes.find(({ id }) => id === nodeId);
  if (!node?.parentId) return flowPosition;
  const parent = document.nodes.find(({ id }) => id === node.parentId);
  if (!parent) return flowPosition;
  return {
    x: flowPosition.x + parent.position.x,
    y: flowPosition.y + parent.position.y,
  };
}

function toRelativePosition(node: BlueprintNode, nodes: BlueprintNode[]): XYPosition {
  if (!node.parentId) return node.position;
  const parent = nodes.find(({ id }) => id === node.parentId);
  if (!parent) return node.position;
  return {
    x: node.position.x - parent.position.x,
    y: node.position.y - parent.position.y,
  };
}

function orderParentsBeforeChildren(nodes: BlueprintNode[]): BlueprintNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const result: BlueprintNode[] = [];
  const visited = new Set<string>();

  const visit = (node: BlueprintNode): void => {
    if (visited.has(node.id)) return;
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) visit(parent);
    }
    visited.add(node.id);
    result.push(node);
  };

  nodes.forEach(visit);
  return result;
}
