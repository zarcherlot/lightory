import { createEmptySceneDefinition } from './scene.js';
import type { BlueprintDocument } from './types.js';

export function createEmptyBlueprintDocument(): BlueprintDocument {
  return {
    schemaVersion: 'blueprint/v1',
    strokes: [],
    nodes: [],
    edges: [],
    intentEvidence: [],
    assignments: [],
    deliveries: [],
    assignmentReviews: [],
    scene: createEmptySceneDefinition(),
    experimentExpectations: [],
    debugSessions: [],
    revisions: [],
  };
}

export function migrateBlueprintDocument(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 'blueprint/v1') return value;
  const edges = Array.isArray(value.edges)
    ? value.edges.map((edge) => {
        if (!isRecord(edge)) return edge;
        if (edge.relation === 'handoff') return edge;
        if (edge.relation !== 'data' && edge.relation !== 'trigger') return edge;
        return {
          ...edge,
          relation: 'handoff',
          handoffKind: edge.relation === 'data' ? 'artifact' : 'completion',
        };
      })
    : value.edges;
  const assignments = Array.isArray(value.assignments)
    ? value.assignments.map((assignment) => {
        if (!isRecord(assignment)) return assignment;
        return {
          ...assignment,
          contract: migrateContract(assignment.contract),
          createdAt: assignment.createdAt ?? 0,
        };
      })
    : value.assignments;
  const deliveries = Array.isArray(value.deliveries)
    ? value.deliveries.map((delivery) => {
        if (!isRecord(delivery)) return delivery;
        const assignment = Array.isArray(assignments)
          ? assignments.find(
              (item) => isRecord(item) && item.id === delivery.assignmentId,
            )
          : undefined;
        const contractRevision =
          isRecord(assignment) && isRecord(assignment.contract)
            ? Number(assignment.contract.revision) || 1
            : 1;
        return {
          ...delivery,
          artifact: migrateArtifact(
            delivery.artifact,
            String(delivery.assignmentId ?? ''),
            contractRevision,
            String(delivery.summary ?? ''),
          ),
        };
      })
    : value.deliveries;
  const nodes = Array.isArray(value.nodes)
    ? value.nodes.map((node) => migrateControlNode(node))
    : value.nodes;
  const migrated: Record<string, unknown> = {
    ...value,
    nodes,
    edges,
    intentEvidence: Array.isArray(value.intentEvidence) ? value.intentEvidence : [],
    assignments,
    deliveries,
    assignmentReviews: Array.isArray(value.assignmentReviews) ? value.assignmentReviews : [],
    scene: migrateScene(value.scene),
    experimentExpectations: Array.isArray(value.experimentExpectations)
      ? value.experimentExpectations
      : [],
  };
  delete migrated.planSteps;
  return migrated;
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
    'intentEvidence',
    'assignments',
    'deliveries',
    'assignmentReviews',
    'experimentExpectations',
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
  validateUniqueIds(document.intentEvidence, 'intent evidence', issues);
  validateUniqueIds(document.assignments, 'assignment', issues);
  validateUniqueIds(document.deliveries, 'delivery', issues);
  validateUniqueIds(document.assignmentReviews, 'assignment review', issues);
  validateUniqueIds(document.experimentExpectations, 'experiment expectation', issues);
  validateUniqueIds(document.scene.entities, 'scene entity', issues);
  validateUniqueIds(document.debugSessions, 'debug session', issues);
  validateUniqueIds(document.revisions, 'revision', issues);

  if (!isSceneDefinition(document.scene)) issues.push('scene must be a valid SceneDefinition.');
  for (const expectation of document.experimentExpectations) {
    if (!isExperimentExpectation(expectation)) {
      issues.push(`Experiment expectation ${readId(expectation)} is malformed.`);
      continue;
    }
    if (
      (expectation.kind === 'reach-target' || expectation.kind === 'speech-after-target') &&
      !document.scene.entities.some(
        (entity) => entity.id === expectation.targetEntityId && entity.kind === 'target-landmark',
      )
    ) {
      issues.push(`Experiment expectation ${expectation.id} references a missing target.`);
    }
  }
  if (document.workflow !== undefined && !isAgentWorkflow(document.workflow)) {
    issues.push('workflow must be a valid AgentWorkflow.');
  }

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

  for (const evidence of document.intentEvidence) {
    if (!isChildIntentEvidence(evidence)) {
      issues.push(`Intent evidence ${readId(evidence)} is malformed.`);
    }
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
    if (delivery.artifact.sourceAssignmentId !== delivery.assignmentId) {
      issues.push(`Delivery ${delivery.id} artifact source does not match its assignment.`);
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
    ['start', 'end', 'function', 'artifact', 'container'].includes(String(value.kind)) &&
    typeof value.label === 'string' &&
    isPoint(value.position) &&
    isSize(value.size) &&
    (value.parentId === undefined || isNonEmptyString(value.parentId)) &&
    isStringArray(value.sourceStrokeIds) &&
    isRecord(recognition) &&
    ['web', 'android-mlkit', 'manual'].includes(String(recognition.source)) &&
    (recognition.confidence === undefined || isFiniteNumber(recognition.confidence)) &&
    (value.control === undefined || isBlueprintControlSettings(value.control))
  );
}

function isBlueprintControlSettings(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.trigger === 'manual' &&
    typeof value.inputInformation === 'string' &&
    typeof value.handoffInformation === 'string' &&
    typeof value.completionCondition === 'string' &&
    value.finishAction === 'stop'
  );
}

function migrateControlNode(value: unknown): unknown {
  if (!isRecord(value) || (value.kind !== 'start' && value.kind !== 'end')) return value;
  if (isBlueprintControlSettings(value.control)) return value;
  return {
    ...value,
    control: {
      trigger: 'manual',
      inputInformation: '',
      handoffInformation: '',
      completionCondition: '',
      finishAction: 'stop',
    },
  };
}

function isBlueprintEdge(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.sourceId) &&
    isNonEmptyString(value.targetId) &&
    value.relation === 'handoff' &&
    ['artifact', 'completion'].includes(String(value.handoffKind)) &&
    (value.label === undefined || typeof value.label === 'string') &&
    (value.sourcePortId === undefined || isNonEmptyString(value.sourcePortId)) &&
    (value.targetPortId === undefined || isNonEmptyString(value.targetPortId)) &&
    (value.artifactSchemaId === undefined || isNonEmptyString(value.artifactSchemaId)) &&
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
    Number.isInteger(value.revision) &&
    Number(value.revision) > 0 &&
    typeof value.goal === 'string' &&
    isStringArray(value.inputNodeIds) &&
    isStringArray(value.expectedOutputs) &&
    isStringArray(value.acceptanceCriteria) &&
    isStringArray(value.toolIds) &&
    isStringArray(value.evidenceIds)
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
    isAgentArtifact(value.artifact) &&
    ['draft', 'accepted', 'returned'].includes(String(value.status))
  );
}

function isAgentArtifact(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.schemaId) &&
    isRecord(value.payload) &&
    typeof value.childSummary === 'string' &&
    isStringArray(value.assumptions) &&
    isStringArray(value.inputArtifactIds) &&
    isNonEmptyString(value.sourceAssignmentId) &&
    Number.isInteger(value.sourceContractRevision) &&
    Number(value.sourceContractRevision) > 0
  );
}

function isChildIntentEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    ['text', 'speech-transcript', 'canvas-reference'].includes(String(value.kind)) &&
    (value.rawText === undefined || typeof value.rawText === 'string') &&
    (value.sceneEntityIds === undefined || isStringArray(value.sceneEntityIds))
  );
}

function isSceneDefinition(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.schemaVersion === 'lightory-scene/v1' &&
    isFiniteNumber(value.widthMeters) &&
    Number(value.widthMeters) > 0 &&
    Number(value.widthMeters) <= 100 &&
    isFiniteNumber(value.heightMeters) &&
    Number(value.heightMeters) > 0 &&
    Number(value.heightMeters) <= 100 &&
    isFiniteNumber(value.gridSizeMeters) &&
    Number(value.gridSizeMeters) > 0 &&
    Number(value.gridSizeMeters) <= Math.min(Number(value.widthMeters), Number(value.heightMeters)) &&
    Array.isArray(value.entities) &&
    value.entities.every((entity) =>
      isSceneEntity(entity, Number(value.widthMeters), Number(value.heightMeters)),
    ) &&
    value.entities.filter(
      (entity) => isRecord(entity) && entity.kind === 'robot-start',
    ).length <= 1
  );
}

function isExperimentExpectation(value: unknown): boolean {
  if (!isRecord(value) || !isNonEmptyString(value.id)) return false;
  if (value.kind === 'avoid-collision') return true;
  if (value.kind === 'reach-target') return isNonEmptyString(value.targetEntityId);
  if (value.kind === 'speech-after-target') {
    return isNonEmptyString(value.targetEntityId) && isNonEmptyString(value.text);
  }
  return value.kind === 'say-text' && isNonEmptyString(value.text);
}

function isSceneEntity(value: unknown, widthMeters: number, heightMeters: number): boolean {
  if (!isRecord(value) || !isPoint(value.position) || !isSize(value.size)) return false;
  const position = value.position as { x: number; y: number };
  const size = value.size as { width: number; height: number };
  return (
    isNonEmptyString(value.id) &&
    ['robot-start', 'target-landmark', 'obstacle', 'area', 'object'].includes(
      String(value.kind),
    ) &&
    typeof value.label === 'string' &&
    typeof value.meaning === 'string' &&
    size.width > 0 &&
    size.height > 0 &&
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.width <= widthMeters &&
    position.y + size.height <= heightMeters &&
    isFiniteNumber(value.rotation) &&
    isStringArray(value.sourceStrokeIds)
  );
}

function migrateScene(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.entities)) return createEmptySceneDefinition();
  if (value.schemaVersion === 'lightory-scene/v1') return value;
  const extents = value.entities.reduce(
    (result, entity) => {
      if (!isRecord(entity) || !isPoint(entity.position) || !isSize(entity.size)) return result;
      const position = entity.position as { x: number; y: number };
      const size = entity.size as { width: number; height: number };
      return {
        width: Math.max(result.width, position.x + size.width),
        height: Math.max(result.height, position.y + size.height),
      };
    },
    { width: 8, height: 6 },
  );
  return {
    schemaVersion: 'lightory-scene/v1',
    widthMeters: extents.width,
    heightMeters: extents.height,
    gridSizeMeters: 0.5,
    entities: value.entities,
  };
}

function isAgentWorkflow(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.blueprintRevisionId === 'string' &&
    Array.isArray(value.nodes) &&
    value.nodes.every(
      (node) =>
        isRecord(node) &&
        isNonEmptyString(node.nodeId) &&
        isNonEmptyString(node.assignmentId) &&
        isStringArray(node.dependsOnNodeIds) &&
        ['waiting', 'ready', 'running', 'awaiting-review', 'accepted', 'dirty', 'blocked', 'failed'].includes(
          String(node.status),
        ) &&
        (node.acceptedDeliveryId === undefined || isNonEmptyString(node.acceptedDeliveryId)) &&
        (node.dirtyReason === undefined || typeof node.dirtyReason === 'string'),
    ) &&
    Array.isArray(value.batches) &&
    value.batches.every(isStringArray) &&
    (value.lastBuildAt === undefined || isFiniteNumber(value.lastBuildAt))
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

function migrateContract(value: unknown): Record<string, unknown> {
  const contract = isRecord(value) ? value : {};
  return {
    ...contract,
    revision: Number.isInteger(contract.revision) && Number(contract.revision) > 0
      ? contract.revision
      : 1,
    goal: typeof contract.goal === 'string' ? contract.goal : '',
    inputNodeIds: Array.isArray(contract.inputNodeIds) ? contract.inputNodeIds : [],
    expectedOutputs: Array.isArray(contract.expectedOutputs) ? contract.expectedOutputs : [],
    acceptanceCriteria: Array.isArray(contract.acceptanceCriteria)
      ? contract.acceptanceCriteria
      : [],
    toolIds: Array.isArray(contract.toolIds) ? contract.toolIds : [],
    evidenceIds: Array.isArray(contract.evidenceIds) ? contract.evidenceIds : [],
  };
}

function migrateArtifact(
  value: unknown,
  assignmentId: string,
  contractRevision: number,
  summary: string,
): Record<string, unknown> {
  if (
    isRecord(value) &&
    isNonEmptyString(value.schemaId) &&
    isRecord(value.payload)
  ) {
    return {
      ...value,
      childSummary: typeof value.childSummary === 'string' ? value.childSummary : summary,
      assumptions: Array.isArray(value.assumptions) ? value.assumptions : [],
      inputArtifactIds: Array.isArray(value.inputArtifactIds) ? value.inputArtifactIds : [],
      sourceAssignmentId: isNonEmptyString(value.sourceAssignmentId)
        ? value.sourceAssignmentId
        : assignmentId,
      sourceContractRevision:
        Number.isInteger(value.sourceContractRevision) && Number(value.sourceContractRevision) > 0
          ? value.sourceContractRevision
          : contractRevision,
    };
  }
  return {
    schemaId: 'lightory.agent-artifact/legacy-v1',
    payload: isRecord(value) ? value : {},
    childSummary: summary,
    assumptions: [],
    inputArtifactIds: [],
    sourceAssignmentId: assignmentId,
    sourceContractRevision: contractRevision,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
