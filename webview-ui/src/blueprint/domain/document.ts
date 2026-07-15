import type { BlueprintDocument } from './types.js';

export function createEmptyBlueprintDocument(): BlueprintDocument {
  return {
    schemaVersion: 'blueprint/v1',
    strokes: [],
    nodes: [],
    edges: [],
    planSteps: [],
    assignments: [],
    deliveries: [],
    assignmentReviews: [],
    debugSessions: [],
    revisions: [],
  };
}

export function migrateBlueprintDocument(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 'blueprint/v1') return value;
  const assignments = Array.isArray(value.assignments)
    ? value.assignments.map((assignment) => {
        if (!isRecord(assignment)) return assignment;
        return {
          ...assignment,
          contract: assignment.contract ?? {
            goal: '',
            inputNodeIds: [],
            expectedOutputs: [],
            acceptanceCriteria: [],
            toolIds: [],
          },
          createdAt: assignment.createdAt ?? 0,
        };
      })
    : value.assignments;
  return {
    ...value,
    assignments,
    assignmentReviews: Array.isArray(value.assignmentReviews) ? value.assignmentReviews : [],
  };
}

export function isBlueprintDocument(value: unknown): value is BlueprintDocument {
  return validateBlueprintDocument(value).length === 0;
}

export function validateBlueprintDocument(value: unknown): string[] {
  if (!isRecord(value)) return ['Document must be an object.'];
  if (value.schemaVersion !== 'blueprint/v1') return ['schemaVersion must equal blueprint/v1.'];

  const collectionNames = [
    'strokes',
    'nodes',
    'edges',
    'planSteps',
    'assignments',
    'deliveries',
    'assignmentReviews',
    'debugSessions',
    'revisions',
  ] as const;
  const issues: string[] = [];
  for (const name of collectionNames) {
    if (!Array.isArray(value[name])) issues.push(`${name} must be an array.`);
  }
  if (issues.length > 0) return issues;

  const document = value as unknown as BlueprintDocument;
  validateUniqueIds(document.strokes, 'stroke', issues);
  validateUniqueIds(document.nodes, 'node', issues);
  validateUniqueIds(document.edges, 'edge', issues);
  validateUniqueIds(document.planSteps, 'plan step', issues);
  validateUniqueIds(document.assignments, 'assignment', issues);
  validateUniqueIds(document.deliveries, 'delivery', issues);
  validateUniqueIds(document.assignmentReviews, 'assignment review', issues);
  validateUniqueIds(document.debugSessions, 'debug session', issues);
  validateUniqueIds(document.revisions, 'revision', issues);

  const strokeIds = collectIds(document.strokes);
  const nodeIds = collectIds(document.nodes);
  const assignmentIds = collectIds(document.assignments);
  const deliveryIds = collectIds(document.deliveries);

  for (const stroke of document.strokes) {
    if (
      !isRecord(stroke) ||
      !isNonEmptyString(stroke.id) ||
      !['mouse', 'touch', 'pen'].includes(String(stroke.pointerKind)) ||
      !isFiniteNumber(stroke.createdAt) ||
      !Array.isArray(stroke.points) ||
      !stroke.points.every(isInkPoint)
    ) {
      issues.push(`Stroke ${readId(stroke)} is malformed.`);
    }
  }

  for (const node of document.nodes) {
    if (!isBlueprintNode(node)) {
      issues.push(`Node ${readId(node)} is malformed.`);
      continue;
    }
    if (node.parentId !== undefined && !nodeIds.has(node.parentId)) {
      issues.push(`Node ${node.id} references missing parent ${node.parentId}.`);
    }
    for (const strokeId of node.sourceStrokeIds) {
      if (!strokeIds.has(strokeId))
        issues.push(`Node ${node.id} references missing stroke ${strokeId}.`);
    }
  }

  for (const edge of document.edges) {
    if (!isBlueprintEdge(edge)) {
      issues.push(`Edge ${readId(edge)} is malformed.`);
      continue;
    }
    if (!nodeIds.has(edge.sourceId))
      issues.push(`Edge ${edge.id} has missing source ${edge.sourceId}.`);
    if (!nodeIds.has(edge.targetId))
      issues.push(`Edge ${edge.id} has missing target ${edge.targetId}.`);
    for (const strokeId of edge.sourceStrokeIds) {
      if (!strokeIds.has(strokeId))
        issues.push(`Edge ${edge.id} references missing stroke ${strokeId}.`);
    }
  }

  for (const step of document.planSteps) {
    if (!isRecord(step) || !isNonEmptyString(step.id) || !isStringArray(step.dependsOn)) {
      issues.push(`Plan step ${readId(step)} is malformed.`);
      continue;
    }
    if (!isNonEmptyString(step.nodeId) || !nodeIds.has(step.nodeId)) {
      issues.push(`Plan step ${step.id} references missing node ${String(step.nodeId)}.`);
    }
    if (typeof step.checkpoint !== 'boolean')
      issues.push(`Plan step ${step.id} has invalid checkpoint.`);
  }

  for (const assignment of document.assignments) {
    if (!isAssignment(assignment)) {
      issues.push(`Assignment ${readId(assignment)} is malformed.`);
      continue;
    }
    if (!nodeIds.has(assignment.nodeId)) {
      issues.push(`Assignment ${assignment.id} references missing node ${assignment.nodeId}.`);
    }
  }

  for (const delivery of document.deliveries) {
    if (!isDelivery(delivery)) {
      issues.push(`Delivery ${readId(delivery)} is malformed.`);
      continue;
    }
    if (!assignmentIds.has(delivery.assignmentId)) {
      issues.push(
        `Delivery ${delivery.id} references missing assignment ${delivery.assignmentId}.`,
      );
    }
  }

  for (const review of document.assignmentReviews) {
    if (!isAssignmentReview(review)) {
      issues.push(`Assignment review ${readId(review)} is malformed.`);
      continue;
    }
    if (!assignmentIds.has(review.assignmentId)) {
      issues.push(
        `Assignment review ${review.id} references missing assignment ${review.assignmentId}.`,
      );
    }
    if (!deliveryIds.has(review.deliveryId)) {
      issues.push(
        `Assignment review ${review.id} references missing delivery ${review.deliveryId}.`,
      );
    }
  }

  for (const session of document.debugSessions) {
    if (!isDebugSession(session)) {
      issues.push(`Debug session ${readId(session)} is malformed.`);
      continue;
    }
    if (!deliveryIds.has(session.deliveryId)) {
      issues.push(`Debug session ${session.id} references missing delivery ${session.deliveryId}.`);
    }
  }

  for (const revision of document.revisions) {
    if (
      !isRecord(revision) ||
      !isNonEmptyString(revision.id) ||
      !isFiniteNumber(revision.createdAt) ||
      !isNonEmptyString(revision.reason)
    ) {
      issues.push(`Revision ${readId(revision)} is malformed.`);
    }
  }

  return issues;
}

function isBlueprintNode(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const recognition = value.recognition;
  return (
    isNonEmptyString(value.id) &&
    ['start', 'function', 'artifact', 'container'].includes(String(value.kind)) &&
    typeof value.label === 'string' &&
    isPoint(value.position) &&
    isSize(value.size) &&
    (value.parentId === undefined || isNonEmptyString(value.parentId)) &&
    isStringArray(value.sourceStrokeIds) &&
    isRecord(recognition) &&
    ['web', 'android-mlkit', 'manual'].includes(String(recognition.source)) &&
    (recognition.confidence === undefined || isFiniteNumber(recognition.confidence))
  );
}

function isBlueprintEdge(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.sourceId) &&
    isNonEmptyString(value.targetId) &&
    ['data', 'trigger'].includes(String(value.relation)) &&
    (value.label === undefined || typeof value.label === 'string') &&
    isStringArray(value.sourceStrokeIds)
  );
}

function isAssignment(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.nodeId) &&
    isNonEmptyString(value.agentId) &&
    [
      'draft',
      'awaiting-confirmation',
      'working',
      'awaiting-review',
      'accepted',
      'returned',
    ].includes(String(value.status)) &&
    isAgentTaskContract(value.contract) &&
    (value.restatement === undefined || isAgentRestatement(value.restatement)) &&
    isFiniteNumber(value.createdAt)
  );
}

function isAgentTaskContract(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.goal === 'string' &&
    isStringArray(value.inputNodeIds) &&
    isStringArray(value.expectedOutputs) &&
    isStringArray(value.acceptanceCriteria) &&
    isStringArray(value.toolIds)
  );
}

function isAgentRestatement(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.summary) &&
    isStringArray(value.understoodInputs) &&
    isStringArray(value.promisedOutputs) &&
    isStringArray(value.uncertainties)
  );
}

function isDelivery(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.assignmentId) &&
    Number.isInteger(value.version) &&
    Number(value.version) > 0 &&
    typeof value.summary === 'string' &&
    isStringArray(value.assumptions) &&
    isStringArray(value.uncertainties) &&
    isRecord(value.artifact) &&
    ['draft', 'accepted', 'returned'].includes(String(value.status))
  );
}

function isAssignmentReview(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.assignmentId) &&
    isNonEmptyString(value.deliveryId) &&
    ['accepted', 'returned'].includes(String(value.decision)) &&
    typeof value.comment === 'string' &&
    (value.decision !== 'returned' || isNonEmptyString(value.comment)) &&
    isFiniteNumber(value.createdAt)
  );
}

function isDebugSession(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.deliveryId) &&
    isRecord(value.expected) &&
    (value.actual === undefined || isRecord(value.actual)) &&
    isStringArray(value.evidence) &&
    (value.correction === undefined || typeof value.correction === 'string') &&
    (value.retestPassed === undefined || typeof value.retestPassed === 'boolean')
  );
}

function isInkPoint(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.t) &&
    isFiniteNumber(value.pressure) &&
    value.pressure >= 0 &&
    value.pressure <= 1
  );
}

function isPoint(value: unknown): boolean {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isSize(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.width) &&
    value.width > 0 &&
    isFiniteNumber(value.height) &&
    value.height > 0
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateUniqueIds(items: unknown[], label: string, issues: string[]): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (!isRecord(item) || !isNonEmptyString(item.id)) continue;
    if (ids.has(item.id)) issues.push(`Duplicate ${label} id ${item.id}.`);
    ids.add(item.id);
  }
}

function collectIds(items: unknown[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (isRecord(item) && isNonEmptyString(item.id)) ids.add(item.id);
  }
  return ids;
}

function readId(value: unknown): string {
  return isRecord(value) && typeof value.id === 'string' ? value.id : '<unknown>';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
