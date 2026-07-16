import type { RobotPlan, RobotToolDefinition } from '../../robot/types.js';
import type { BlueprintDocument } from '../domain/types.js';

export interface BlueprintCompileIssue {
  code: string;
  message: string;
  nodeId?: string;
  stepId?: string;
}

export interface ChildActionPreview {
  id: string;
  nodeId: string;
  nodeLabel: string;
  kind: 'move' | 'turn' | 'speech' | 'stop';
  description: string;
  dependsOnNodeIds: string[];
}

export interface BlueprintCompileResult {
  ok: boolean;
  preview: ChildActionPreview[];
  plan?: RobotPlan;
  errors: BlueprintCompileIssue[];
  warnings: BlueprintCompileIssue[];
}

export interface BlueprintCompileOptions {
  document: BlueprintDocument;
  robotTools: RobotToolDefinition[];
  padId: string;
  sessionId: string;
  createId?: (prefix: string) => string;
  now?: () => Date;
}
