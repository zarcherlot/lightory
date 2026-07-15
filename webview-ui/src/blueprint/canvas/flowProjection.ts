import { type Edge, MarkerType, type Node, type XYPosition } from '@xyflow/react';

import type { BlueprintDocument, BlueprintEdge, BlueprintNode } from '../domain/types.js';

export interface BlueprintFlowNodeData extends Record<string, unknown> {
  label: string;
  kind: BlueprintNode['kind'];
}

export type BlueprintFlowNode = Node<BlueprintFlowNodeData>;
export type BlueprintFlowEdge = Edge<{ relation: BlueprintEdge['relation'] }>;

export interface BlueprintFlowProjection {
  nodes: BlueprintFlowNode[];
  edges: BlueprintFlowEdge[];
}

export function projectBlueprintToFlow(document: BlueprintDocument): BlueprintFlowProjection {
  const orderedNodes = orderParentsBeforeChildren(document.nodes);
  return {
    nodes: orderedNodes.map((node) => ({
      id: node.id,
      type: node.kind,
      position: toRelativePosition(node, document.nodes),
      parentId: node.parentId,
      extent: node.parentId ? 'parent' : undefined,
      data: { label: node.label, kind: node.kind },
      style: { width: node.size.width, height: node.size.height },
      zIndex: node.kind === 'container' ? 0 : 2,
    })),
    edges: document.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'smoothstep',
      animated: edge.relation === 'trigger',
      label: edge.label ?? (edge.relation === 'trigger' ? '触发' : '数据'),
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { relation: edge.relation },
    })),
  };
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
