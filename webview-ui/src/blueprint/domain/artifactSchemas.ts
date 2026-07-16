import type { AgentTaskContract } from './types.js';

export const MOVEMENT_ARTIFACT_SCHEMA_ID = 'lightory.agent-artifact/movement-v1';
export const SPEECH_ARTIFACT_SCHEMA_ID = 'lightory.agent-artifact/speech-v1';
export const GENERIC_ARTIFACT_SCHEMA_ID = 'lightory.agent-artifact/generic-v1';

export function createAgentArtifactOutputSchema(
  contract: AgentTaskContract,
): Record<string, unknown> {
  if (contract.toolIds.length === 1 && contract.toolIds[0] === 'basic-movement') {
    return {
      $id: MOVEMENT_ARTIFACT_SCHEMA_ID,
      type: 'object',
      required: ['actions', 'acceptanceCoverage'],
      additionalProperties: false,
      properties: {
        actions: {
          type: 'array',
          items: {
            oneOf: [
              {
                type: 'object',
                required: ['type', 'distanceMeters'],
                properties: {
                  type: { const: 'driveDistance' },
                  distanceMeters: { type: 'number' },
                  maxSpeedMps: { type: 'number' },
                },
              },
              {
                type: 'object',
                required: ['type', 'angleRad'],
                properties: {
                  type: { const: 'rotateAngle' },
                  angleRad: { type: 'number' },
                  maxAngularRadps: { type: 'number' },
                },
              },
            ],
          },
        },
        acceptanceCoverage: { type: 'array', items: { type: 'string' } },
      },
    };
  }
  if (contract.toolIds.length === 1 && contract.toolIds[0] === 'voice') {
    return {
      $id: SPEECH_ARTIFACT_SCHEMA_ID,
      type: 'object',
      required: ['text', 'trigger', 'acceptanceCoverage'],
      additionalProperties: false,
      properties: {
        text: { type: 'string' },
        trigger: { enum: ['start', 'after-input'] },
        acceptanceCoverage: { type: 'array', items: { type: 'string' } },
      },
    };
  }
  return {
    $id: GENERIC_ARTIFACT_SCHEMA_ID,
    type: 'object',
    additionalProperties: true,
  };
}
