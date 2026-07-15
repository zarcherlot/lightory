import type { BlueprintCommand } from './commands.js';
import type { BlueprintDocument, BlueprintNode } from './types.js';

export interface BlueprintHistoryState {
  past: BlueprintDocument[];
  present: BlueprintDocument;
  future: BlueprintDocument[];
}

export type BlueprintHistoryAction =
  | { type: 'command'; command: BlueprintCommand }
  | { type: 'document.replace'; document: BlueprintDocument }
  | { type: 'history.undo' }
  | { type: 'history.redo' };

export function createBlueprintHistoryState(document: BlueprintDocument): BlueprintHistoryState {
  return { past: [], present: document, future: [] };
}

export function blueprintHistoryReducer(
  state: BlueprintHistoryState,
  action: BlueprintHistoryAction,
): BlueprintHistoryState {
  if (action.type === 'document.replace') {
    return createBlueprintHistoryState(action.document);
  }

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
    case 'stroke.add':
      assertUniqueId(document.strokes, command.stroke.id, 'stroke');
      next = { ...document, strokes: [...document.strokes, command.stroke] };
      break;
    case 'stroke.delete':
      assertItemExists(document.strokes, command.strokeId, 'stroke');
      next = {
        ...document,
        strokes: document.strokes.filter((stroke) => stroke.id !== command.strokeId),
        nodes: document.nodes.map((node) => ({
          ...node,
          sourceStrokeIds: node.sourceStrokeIds.filter((id) => id !== command.strokeId),
        })),
        edges: document.edges.map((edge) => ({
          ...edge,
          sourceStrokeIds: edge.sourceStrokeIds.filter((id) => id !== command.strokeId),
        })),
      };
      break;
    case 'stroke.replace': {
      const replacementBySource = new Map(
        command.replacements.map((replacement) => [replacement.sourceStrokeId, replacement]),
      );
      for (const replacement of command.replacements) {
        assertItemExists(document.strokes, replacement.sourceStrokeId, 'stroke');
      }
      const replacementIds = command.replacements.flatMap(({ strokes }) =>
        strokes.map(({ id }) => id),
      );
      if (new Set(replacementIds).size !== replacementIds.length) {
        throw new Error('Replacement stroke ids must be unique.');
      }

      next = {
        ...document,
        strokes: document.strokes.flatMap(
          (stroke) => replacementBySource.get(stroke.id)?.strokes ?? [stroke],
        ),
        nodes: document.nodes.map((node) => ({
          ...node,
          sourceStrokeIds: replaceStrokeReferences(node.sourceStrokeIds, replacementBySource),
        })),
        edges: document.edges.map((edge) => ({
          ...edge,
          sourceStrokeIds: replaceStrokeReferences(edge.sourceStrokeIds, replacementBySource),
        })),
      };
      break;
    }
    case 'document.clear':
      next = {
        ...document,
        strokes: [],
        nodes: [],
        edges: [],
        planSteps: [],
        assignments: [],
        deliveries: [],
        assignmentReviews: [],
        debugSessions: [],
      };
      break;
    case 'node.create':
      assertUniqueId(document.nodes, command.node.id, 'node');
      validateNodeParent(document.nodes, command.node.id, command.node.parentId);
      next = { ...document, nodes: [...document.nodes, command.node] };
      break;
    case 'node.update': {
      assertNonEmpty(command.label, 'Node label');
      const changingFromContainer =
        document.nodes.find((node) => node.id === command.nodeId)?.kind === 'container' &&
        command.kind !== 'container';
      next = {
        ...document,
        nodes: replaceNode(document.nodes, command.nodeId, (node) => ({
          ...node,
          label: command.label.trim(),
          kind: command.kind,
        })).map((node) =>
          changingFromContainer && node.parentId === command.nodeId ? withoutParent(node) : node,
        ),
      };
      break;
    }
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
    case 'node.resize':
      if (command.size.width < 96 || command.size.height < 72) {
        throw new Error('Blueprint nodes cannot be smaller than 96 × 72.');
      }
      next = {
        ...document,
        nodes: replaceNode(document.nodes, command.nodeId, (node) => ({
          ...node,
          size: command.size,
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
    case 'assignment.create': {
      assertUniqueId(document.assignments, command.assignment.id, 'assignment');
      const node = document.nodes.find(({ id }) => id === command.assignment.nodeId);
      if (!node) throw new Error(`Unknown node: ${command.assignment.nodeId}.`);
      if (node.kind !== 'function')
        throw new Error('Agents can only be assigned to function nodes.');
      if (command.assignment.status !== 'draft') throw new Error('A new assignment must be draft.');
      const duplicate = document.assignments.some(
        (assignment) =>
          assignment.nodeId === command.assignment.nodeId &&
          assignment.agentId === command.assignment.agentId &&
          assignment.status !== 'accepted',
      );
      if (duplicate) throw new Error('This agent already has an active assignment on this node.');
      next = { ...document, assignments: [...document.assignments, command.assignment] };
      break;
    }
    case 'assignment.contract-update':
      next = {
        ...document,
        assignments: replaceAssignment(document.assignments, command.assignmentId, (assignment) => {
          assertAssignmentStatus(assignment.status, ['draft', 'awaiting-confirmation']);
          return {
            ...assignment,
            contract: command.contract,
            status: 'draft',
            restatement: undefined,
          };
        }),
      };
      break;
    case 'assignment.restatement-submit':
      next = {
        ...document,
        assignments: replaceAssignment(document.assignments, command.assignmentId, (assignment) => {
          assertAssignmentStatus(assignment.status, ['draft']);
          assertCompleteContract(assignment.contract);
          return {
            ...assignment,
            restatement: command.restatement,
            status: 'awaiting-confirmation',
          };
        }),
      };
      break;
    case 'assignment.confirm':
      next = {
        ...document,
        assignments: replaceAssignment(document.assignments, command.assignmentId, (assignment) => {
          assertAssignmentStatus(assignment.status, ['awaiting-confirmation']);
          if (!assignment.restatement)
            throw new Error('Agent restatement is required before confirmation.');
          return { ...assignment, status: 'working' };
        }),
      };
      break;
    case 'assignment.reopen':
      next = {
        ...document,
        assignments: replaceAssignment(document.assignments, command.assignmentId, (assignment) => {
          assertAssignmentStatus(assignment.status, ['accepted']);
          return { ...assignment, status: 'draft', restatement: undefined };
        }),
      };
      break;
    case 'assignment.delivery-submit':
      assertUniqueId(document.deliveries, command.delivery.id, 'delivery');
      if (command.delivery.assignmentId !== command.assignmentId) {
        throw new Error('Delivery assignment does not match command assignment.');
      }
      next = {
        ...document,
        assignments: replaceAssignment(document.assignments, command.assignmentId, (assignment) => {
          assertAssignmentStatus(assignment.status, ['working']);
          return { ...assignment, status: 'awaiting-review' };
        }),
        deliveries: [...document.deliveries, command.delivery],
      };
      break;
    case 'assignment.accept':
      next = reviewDelivery(
        document,
        command.assignmentId,
        command.deliveryId,
        command.review,
        'accepted',
      );
      break;
    case 'assignment.return':
      if (!command.review.comment.trim()) throw new Error('Return comment cannot be empty.');
      next = reviewDelivery(
        document,
        command.assignmentId,
        command.deliveryId,
        command.review,
        'returned',
      );
      break;
    case 'assignment.resubmit':
      next = {
        ...document,
        assignments: replaceAssignment(document.assignments, command.assignmentId, (assignment) => {
          assertAssignmentStatus(assignment.status, ['returned']);
          return { ...assignment, restatement: command.restatement, status: 'working' };
        }),
      };
      break;
  }

  return { ...next, revisions: [...next.revisions, command.revision] };
}

function replaceStrokeReferences(
  sourceIds: string[],
  replacementBySource: Map<string, { strokes: Array<{ id: string }> }>,
): string[] {
  return sourceIds.flatMap(
    (id) => replacementBySource.get(id)?.strokes.map((stroke) => stroke.id) ?? [id],
  );
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
    edges: document.edges.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId),
    planSteps: document.planSteps.filter((step) => step.nodeId !== nodeId),
    assignments: document.assignments.filter((assignment) => !assignmentIds.has(assignment.id)),
    deliveries: document.deliveries.filter((delivery) => !deliveryIds.has(delivery.id)),
    assignmentReviews: document.assignmentReviews.filter(
      (review) => !assignmentIds.has(review.assignmentId),
    ),
    debugSessions: document.debugSessions.filter((session) => !deliveryIds.has(session.deliveryId)),
  };
}

function reviewDelivery(
  document: BlueprintDocument,
  assignmentId: string,
  deliveryId: string,
  review: BlueprintDocument['assignmentReviews'][number],
  decision: 'accepted' | 'returned',
): BlueprintDocument {
  assertUniqueId(document.assignmentReviews, review.id, 'assignment review');
  if (
    review.assignmentId !== assignmentId ||
    review.deliveryId !== deliveryId ||
    review.decision !== decision
  ) {
    throw new Error('Assignment review does not match the reviewed delivery.');
  }
  const delivery = document.deliveries.find(({ id }) => id === deliveryId);
  if (!delivery || delivery.assignmentId !== assignmentId) {
    throw new Error(`Unknown delivery: ${deliveryId}.`);
  }
  const latestVersion = Math.max(
    ...document.deliveries
      .filter((item) => item.assignmentId === assignmentId)
      .map(({ version }) => version),
  );
  if (delivery.version !== latestVersion || delivery.status !== 'draft') {
    throw new Error('Only the latest draft delivery can be reviewed.');
  }
  return {
    ...document,
    assignments: replaceAssignment(document.assignments, assignmentId, (assignment) => {
      assertAssignmentStatus(assignment.status, ['awaiting-review']);
      return { ...assignment, status: decision };
    }),
    deliveries: document.deliveries.map((item) =>
      item.id === deliveryId ? { ...item, status: decision } : item,
    ),
    assignmentReviews: [...document.assignmentReviews, review],
  };
}

function replaceAssignment(
  assignments: BlueprintDocument['assignments'],
  assignmentId: string,
  transform: (
    assignment: BlueprintDocument['assignments'][number],
  ) => BlueprintDocument['assignments'][number],
): BlueprintDocument['assignments'] {
  assertItemExists(assignments, assignmentId, 'assignment');
  return assignments.map((assignment) =>
    assignment.id === assignmentId ? transform(assignment) : assignment,
  );
}

function assertAssignmentStatus(
  status: BlueprintDocument['assignments'][number]['status'],
  allowed: Array<BlueprintDocument['assignments'][number]['status']>,
): void {
  if (!allowed.includes(status)) {
    throw new Error(`Assignment status ${status} cannot perform this transition.`);
  }
}

function assertCompleteContract(
  contract: BlueprintDocument['assignments'][number]['contract'],
): void {
  if (
    !contract.goal.trim() ||
    contract.expectedOutputs.length === 0 ||
    contract.acceptanceCriteria.length === 0 ||
    contract.toolIds.length === 0
  ) {
    throw new Error('Assignment contract is incomplete.');
  }
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
