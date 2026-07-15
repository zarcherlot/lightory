import type { BlueprintCommand } from './commands.js';
import type { BlueprintDocument, BlueprintNode } from './types.js';

export interface BlueprintHistoryState {
  past: BlueprintDocument[];
  present: BlueprintDocument;
  future: BlueprintDocument[];
}

export type BlueprintHistoryAction =
  | { type: 'command'; command: BlueprintCommand }
  | { type: 'history.undo' }
  | { type: 'history.redo' };

export function createBlueprintHistoryState(document: BlueprintDocument): BlueprintHistoryState {
  return { past: [], present: document, future: [] };
}

export function blueprintHistoryReducer(
  state: BlueprintHistoryState,
  action: BlueprintHistoryAction,
): BlueprintHistoryState {
  if (action.type === 'history.undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }

  if (action.type === 'history.redo') {
    const next = state.future[0];
    if (!next) return state;
    return {
      past: [...state.past, state.present],
      present: next,
      future: state.future.slice(1),
    };
  }

  const nextDocument = applyBlueprintCommand(state.present, action.command);
  return {
    past: [...state.past, state.present],
    present: nextDocument,
    future: [],
  };
}

export function applyBlueprintCommand(
  document: BlueprintDocument,
  command: BlueprintCommand,
): BlueprintDocument {
  let next: BlueprintDocument;

  switch (command.type) {
    case 'node.create':
      assertUniqueId(document.nodes, command.node.id, 'node');
      validateNodeParent(document.nodes, command.node.id, command.node.parentId);
      next = { ...document, nodes: [...document.nodes, command.node] };
      break;
    case 'node.rename':
      assertNonEmpty(command.label, 'Node label');
      next = {
        ...document,
        nodes: replaceNode(document.nodes, command.nodeId, (node) => ({
          ...node,
          label: command.label.trim(),
        })),
      };
      break;
    case 'node.move':
      next = {
        ...document,
        nodes: replaceNode(document.nodes, command.nodeId, (node) => ({
          ...node,
          position: command.position,
        })),
      };
      break;
    case 'node.set-parent':
      validateNodeParent(document.nodes, command.nodeId, command.parentId);
      next = {
        ...document,
        nodes: replaceNode(document.nodes, command.nodeId, (node) => {
          if (command.parentId === undefined) {
            return withoutParent(node);
          }
          return { ...node, parentId: command.parentId };
        }),
      };
      break;
    case 'node.delete':
      next = deleteNode(document, command.nodeId);
      break;
    case 'edge.create':
      assertUniqueId(document.edges, command.edge.id, 'edge');
      assertNodeExists(document.nodes, command.edge.sourceId);
      assertNodeExists(document.nodes, command.edge.targetId);
      if (command.edge.sourceId === command.edge.targetId) {
        throw new Error('A blueprint edge cannot connect a node to itself.');
      }
      next = { ...document, edges: [...document.edges, command.edge] };
      break;
    case 'edge.delete':
      assertItemExists(document.edges, command.edgeId, 'edge');
      next = { ...document, edges: document.edges.filter((edge) => edge.id !== command.edgeId) };
      break;
  }

  return { ...next, revisions: [...next.revisions, command.revision] };
}

function deleteNode(document: BlueprintDocument, nodeId: string): BlueprintDocument {
  assertNodeExists(document.nodes, nodeId);
  const assignmentIds = new Set(
    document.assignments.filter((assignment) => assignment.nodeId === nodeId).map(({ id }) => id),
  );
  const deliveryIds = new Set(
    document.deliveries
      .filter((delivery) => assignmentIds.has(delivery.assignmentId))
      .map(({ id }) => id),
  );

  return {
    ...document,
    nodes: document.nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => (node.parentId === nodeId ? withoutParent(node) : node)),
    edges: document.edges.filter(
      (edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId,
    ),
    planSteps: document.planSteps.filter((step) => step.nodeId !== nodeId),
    assignments: document.assignments.filter((assignment) => !assignmentIds.has(assignment.id)),
    deliveries: document.deliveries.filter((delivery) => !deliveryIds.has(delivery.id)),
    debugSessions: document.debugSessions.filter(
      (session) => !deliveryIds.has(session.deliveryId),
    ),
  };
}

function validateNodeParent(nodes: BlueprintNode[], nodeId: string, parentId?: string): void {
  if (parentId === undefined) return;
  if (nodeId === parentId) throw new Error('A node cannot contain itself.');
  const parent = nodes.find((node) => node.id === parentId);
  if (!parent) throw new Error(`Unknown parent node: ${parentId}.`);
  if (parent.kind !== 'container') throw new Error(`Parent node ${parentId} is not a container.`);

  let cursor: BlueprintNode | undefined = parent;
  while (cursor?.parentId) {
    if (cursor.parentId === nodeId) throw new Error('Container relationship would create a cycle.');
    cursor = nodes.find((node) => node.id === cursor?.parentId);
  }
}

function replaceNode(
  nodes: BlueprintNode[],
  nodeId: string,
  transform: (node: BlueprintNode) => BlueprintNode,
): BlueprintNode[] {
  assertNodeExists(nodes, nodeId);
  return nodes.map((node) => (node.id === nodeId ? transform(node) : node));
}

function withoutParent(node: BlueprintNode): BlueprintNode {
  const result = { ...node };
  delete result.parentId;
  return result;
}

function assertNodeExists(nodes: BlueprintNode[], nodeId: string): void {
  assertItemExists(nodes, nodeId, 'node');
}

function assertItemExists(items: Array<{ id: string }>, id: string, kind: string): void {
  if (!items.some((item) => item.id === id)) throw new Error(`Unknown ${kind}: ${id}.`);
}

function assertUniqueId(items: Array<{ id: string }>, id: string, kind: string): void {
  if (items.some((item) => item.id === id)) throw new Error(`Duplicate ${kind} id: ${id}.`);
}

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} cannot be empty.`);
}
