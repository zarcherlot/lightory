export type PointerKind = 'mouse' | 'touch' | 'pen';
export type BlueprintNodeKind = 'function' | 'artifact' | 'container';
export type BlueprintRelation = 'data' | 'trigger';
export type StageGate = 'goal' | 'architecture' | 'assignment' | 'plan' | 'test';

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
}

export interface BlueprintEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: BlueprintRelation;
  label?: string;
  sourceStrokeIds: string[];
}

export interface PlanStep {
  id: string;
  nodeId: string;
  dependsOn: string[];
  checkpoint: boolean;
}

export type AgentAssignmentStatus =
  | 'draft'
  | 'awaiting-confirmation'
  | 'working'
  | 'awaiting-review'
  | 'accepted'
  | 'returned';

export interface AgentAssignment {
  id: string;
  nodeId: string;
  agentId: string;
  status: AgentAssignmentStatus;
}

export interface AgentDelivery {
  id: string;
  assignmentId: string;
  version: number;
  summary: string;
  assumptions: string[];
  uncertainties: string[];
  artifact: Record<string, unknown>;
  status: 'draft' | 'accepted' | 'returned';
}

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
  planSteps: PlanStep[];
  assignments: AgentAssignment[];
  deliveries: AgentDelivery[];
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
