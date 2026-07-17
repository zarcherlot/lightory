import {
  MOVEMENT_ARTIFACT_SCHEMA_ID,
  SPEECH_ARTIFACT_SCHEMA_ID,
} from '../domain/artifactSchemas.js';
import type { AgentArtifact, AgentTaskContract } from '../domain/types.js';

const REVIEW_CHALLENGE_LOW_SPEED_MPS = 0.05;

export interface AgentRuntimeRequest {
  agentRole: string;
  assignmentId: string;
  contract: AgentTaskContract;
  visibleArtifacts: AgentRuntimeArtifactInput[];
  allowedToolIds: string[];
  outputSchema: Record<string, unknown>;
  workspaceId: string;
}

export interface AgentRuntimeArtifactInput {
  deliveryId: string;
  artifact: AgentArtifact;
}

export interface AgentRuntimeAdapter {
  execute(request: AgentRuntimeRequest): Promise<AgentArtifact>;
}

export class DeterministicAgentRuntimeAdapter implements AgentRuntimeAdapter {
  async execute(request: AgentRuntimeRequest): Promise<AgentArtifact> {
    assertAllowedTools(request);
    const schemaId = readSchemaId(request.outputSchema);
    return Promise.resolve({
      schemaId,
      payload: createPayload(request, schemaId),
      childSummary: `${request.agentRole}完成了：${request.contract.expectedOutputs.join('、')}`,
      assumptions: ['只读取任务合同和交付连接允许的上游制品。'],
      inputArtifactIds: request.visibleArtifacts.map(({ deliveryId }) => deliveryId).sort(),
      sourceAssignmentId: request.assignmentId,
      sourceContractRevision: request.contract.revision,
    });
  }
}

function createPayload(
  request: AgentRuntimeRequest,
  schemaId: string,
): Record<string, unknown> {
  const contractText = [request.contract.goal, ...request.contract.expectedOutputs].join('\n');
  if (schemaId === MOVEMENT_ARTIFACT_SCHEMA_ID) {
    return {
      actions: parseMovementActions(contractText),
      acceptanceCoverage: request.contract.acceptanceCriteria,
    };
  }
  if (schemaId === SPEECH_ARTIFACT_SCHEMA_ID) {
    return {
      text: parseSpeechText(contractText),
      trigger: requestsSpeechAfterInput(contractText) ? 'after-input' : 'start',
      acceptanceCoverage: request.contract.acceptanceCriteria,
    };
  }
  return {
    goal: request.contract.goal,
    outputs: request.contract.expectedOutputs,
    toolIds: request.allowedToolIds,
    acceptanceCoverage: request.contract.acceptanceCriteria,
  };
}

function parseMovementActions(text: string): Array<Record<string, unknown>> {
  const actions: Array<Record<string, unknown>> = [];
  const requestedSpeed = parseRequestedLinearSpeed(text);
  const expression =
    /(前进|向前|后退|向后|左转|向左转|右转|向右转|旋转)\s*([+-]?\d+(?:\.\d+)?)\s*(米|m|度|°|弧度|rad)/giu;
  for (const match of text.matchAll(expression)) {
    const direction = match[1] ?? '';
    const value = Number(match[2]);
    const unit = (match[3] ?? '').toLowerCase();
    if (!Number.isFinite(value)) continue;
    if (unit === '米' || unit === 'm') {
      const sign = direction === '后退' || direction === '向后' ? -1 : 1;
      actions.push({
        type: 'driveDistance',
        distanceMeters: sign * Math.abs(value),
        maxSpeedMps: requestedSpeed ?? REVIEW_CHALLENGE_LOW_SPEED_MPS,
      });
      continue;
    }
    const radians = unit === '度' || unit === '°' ? (value * Math.PI) / 180 : value;
    const sign = direction === '右转' || direction === '向右转' ? -1 : 1;
    actions.push({ type: 'rotateAngle', angleRad: sign * Math.abs(radians) });
  }
  return actions;
}

function parseRequestedLinearSpeed(text: string): number | undefined {
  const match = text.match(/(?:速度|speed)\s*[:：]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:米\/秒|m\/s|mps)/iu);
  const speed = match?.[1] === undefined ? undefined : Number(match[1]);
  return speed !== undefined && Number.isFinite(speed) && speed > 0 ? speed : undefined;
}

function parseSpeechText(text: string): string {
  const quoted = text.match(/[“"「『]([^”"」』]+)[”"」』]/u)?.[1]?.trim();
  if (quoted) return quoted;
  const instruction = text.match(/(?:说|播报|朗读|语音提示)\s*[:：]?\s*([^\n，。；;]+)/u)?.[1]?.trim();
  return instruction ?? '';
}

function requestsSpeechAfterInput(text: string): boolean {
  return /(到达|抵达|完成|移动后|走到|到.*后|收到.*后|上游.*后|之后|再播报|再说|再触发|然后.*说|然后.*播报|然后.*触发)/u.test(text);
}

function assertAllowedTools(request: AgentRuntimeRequest): void {
  const contractTools = new Set(request.contract.toolIds);
  for (const toolId of request.allowedToolIds) {
    if (!contractTools.has(toolId)) {
      throw new Error(`Agent runtime cannot grant Tool outside the child contract: ${toolId}.`);
    }
  }
}

function readSchemaId(schema: Record<string, unknown>): string {
  const id = schema.$id;
  return typeof id === 'string' && id.trim() ? id : 'lightory.agent-artifact/deterministic-v1';
}
