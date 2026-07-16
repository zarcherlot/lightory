export type PointerKind = 'mouse' | 'touch' | 'pen';
export type BlueprintNodeKind = 'start' | 'end' | 'function' | 'artifact' | 'container';
export type BlueprintRelation = 'handoff';
export type HandoffKind = 'trigger' | 'message';
export type StageGate = 'goal' | 'architecture' | 'assignment' | 'build' | 'test';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  safetyConstraints: string[];
}

export interface TaskDefinition {
  schemaVersion: 'lightory-task/v1';
  id: string;
  version: string;
  title: string;
  story: string;
  goalPrompt: string;
  availableToolIds: string[];
  availableAgentIds: string[];
  stageGates: StageGate[];
  testScenarioIds: string[];
  faultScenarioIds: string[];
  successCriteria: string[];
}

export type AgentFaultType =
  | 'requirement-misread'
  | 'condition-omitted'
  | 'wrong-parameter'
  | 'interface-mismatch'
  | 'wrong-order'
  | 'unsupported-action';

export interface AgentDefinition {
  id: string;
  name: string;
  capabilityIds: string[];
  knownLimitations: string[];
  contextScope: 'assignment-only';
  fallibilityPolicyId: string;
}

export interface FallibilityPolicy {
  id: string;
  mode: 'scripted' | 'adaptive';
  minimumReviewCycles: number;
  allowedFaultTypes: AgentFaultType[];
  simulatorOnly: true;
}

export interface FaultScenario {
  id: string;
  agentId: string;
  type: AgentFaultType;
  observableEvidence: string[];
  repairCriteria: string[];
  debrief: string;
}

export interface TestScenario {
  id: string;
  name: string;
  requiredToolIds: string[];
  successCriteria: string[];
}

export interface InkPoint {
  x: number;
  y: number;
  t: number;
  pressure: number;
}

export interface InkStroke {
  id: string;
  points: InkPoint[];
  pointerKind: PointerKind;
  createdAt: number;
  scopeId?: string;
}

export interface BlueprintNode {
  id: string;
  kind: BlueprintNodeKind;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  parentId?: string;
  sourceStrokeIds: string[];
  recognition: {
    source: 'web' | 'android-mlkit' | 'manual';
    confidence?: number;
  };
  control?: BlueprintControlSettings;
}

export interface BlueprintControlSettings {
  trigger: 'manual';
  inputInformation: string;
  handoffInformation: string;
  completionCondition: string;
  finishAction: 'stop';
}

export interface BlueprintEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: BlueprintRelation;
  handoffKind: HandoffKind;
  label?: string;
  condition?: string;
  message?: string;
  sourcePortId?: string;
  targetPortId?: string;
  artifactSchemaId?: string;
  sourceStrokeIds: string[];
}

export interface ChildIntentEvidence {
  id: string;
  kind: 'text' | 'speech-transcript' | 'canvas-reference';
  rawText?: string;
  sceneEntityIds?: string[];
}

export type AgentAssignmentStatus =
  | 'draft'
  | 'awaiting-confirmation'
  | 'working'
  | 'awaiting-review'
  | 'accepted'
  | 'returned';

export interface AgentTaskContract {
  revision: number;
  goal: string;
  inputNodeIds: string[];
  expectedOutputs: string[];
  acceptanceCriteria: string[];
  toolIds: string[];
  evidenceIds: string[];
}

export interface AgentRestatement {
  summary: string;
  understoodInputs: string[];
  promisedOutputs: string[];
  uncertainties: string[];
}

export interface AgentAssignment {
  id: string;
  nodeId: string;
  agentId: string;
  status: AgentAssignmentStatus;
  contract: AgentTaskContract;
  restatement?: AgentRestatement;
  createdAt: number;
}

export interface AgentDelivery {
  id: string;
  assignmentId: string;
  version: number;
  summary: string;
  assumptions: string[];
  uncertainties: string[];
  artifact: AgentArtifact;
  status: 'draft' | 'accepted' | 'returned';
}

export interface AgentArtifact {
  schemaId: string;
  payload: Record<string, unknown>;
  childSummary: string;
  assumptions: string[];
  inputArtifactIds: string[];
  sourceAssignmentId: string;
  sourceContractRevision: number;
}

export interface AssignmentReview {
  id: string;
  assignmentId: string;
  deliveryId: string;
  decision: 'accepted' | 'returned';
  comment: string;
  createdAt: number;
}

export type WorkflowNodeStatus =
  | 'waiting'
  | 'ready'
  | 'running'
  | 'awaiting-review'
  | 'accepted'
  | 'dirty'
  | 'blocked'
  | 'failed';

export interface AgentWorkflowNode {
  nodeId: string;
  assignmentId: string;
  dependsOnNodeIds: string[];
  acceptedDeliveryId?: string;
  status: WorkflowNodeStatus;
  dirtyReason?: string;
}

export interface AgentWorkflow {
  blueprintRevisionId: string;
  nodes: AgentWorkflowNode[];
  batches: string[][];
  lastBuildAt?: number;
}

export type SceneEntityKind =
  | 'robot-start'
  | 'target-landmark'
  | 'obstacle'
  | 'area'
  | 'object';

export interface SceneEntity {
  id: string;
  kind: SceneEntityKind;
  label: string;
  meaning: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  sourceStrokeIds: string[];
}

export interface SceneDefinition {
  schemaVersion: 'lightory-scene/v1';
  widthMeters: number;
  heightMeters: number;
  gridSizeMeters: number;
  entities: SceneEntity[];
}

export type ExperimentExpectation =
  | { id: string; kind: 'reach-target'; targetEntityId: string }
  | { id: string; kind: 'say-text'; text: string }
  | { id: string; kind: 'speech-after-target'; targetEntityId: string; text: string }
  | { id: string; kind: 'avoid-collision' };

export interface DebugSession {
  id: string;
  deliveryId: string;
  expected: Record<string, unknown>;
  actual?: Record<string, unknown>;
  evidence: string[];
  diagnosis?: AgentFaultType;
  correction?: string;
  retestPassed?: boolean;
}

export interface BlueprintRevision {
  id: string;
  createdAt: number;
  reason: string;
}

export interface BlueprintDocument {
  schemaVersion: 'blueprint/v1';
  strokes: InkStroke[];
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  intentEvidence: ChildIntentEvidence[];
  assignments: AgentAssignment[];
  deliveries: AgentDelivery[];
  assignmentReviews: AssignmentReview[];
  scene: SceneDefinition;
  experimentExpectations: ExperimentExpectation[];
  workflow?: AgentWorkflow;
  debugSessions: DebugSession[];
  revisions: BlueprintRevision[];
}

export interface BlueprintCatalog {
  tools: ToolDefinition[];
  agents: AgentDefinition[];
  fallibilityPolicies: FallibilityPolicy[];
  tests: TestScenario[];
  faults: FaultScenario[];
}
