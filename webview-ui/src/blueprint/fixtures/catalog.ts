import type { BlueprintCatalog } from '../domain/types.js';

export const blueprintFixtureCatalog: BlueprintCatalog = {
  tools: [
    {
      id: 'voice',
      name: '语音',
      description: '播放由孩子确认的短句。',
      inputSchema: { text: { type: 'string' } },
      outputSchema: { played: { type: 'boolean' } },
      safetyConstraints: ['只播放孩子确认过的内容'],
    },
    {
      id: 'basic-movement',
      name: '基础移动',
      description: '执行受限的前进、后退、转向与停止。',
      inputSchema: {
        action: { enum: ['forward', 'backward', 'turn', 'stop'] },
        value: { type: 'number' },
      },
      outputSchema: { completed: { type: 'boolean' }, pose: { type: 'object' } },
      safetyConstraints: ['限制速度和距离', '遇到障碍立即停止', '真实执行前必须确认'],
    },
  ],
  agents: [
    {
      id: 'route-engineer',
      name: '路线工程师',
      capabilityIds: ['basic-movement'],
      knownLimitations: ['转向后偶尔忘记更新朝向', '可能把角度单位或方向弄错'],
      contextScope: 'assignment-only',
      fallibilityPolicyId: 'scripted-review-v1',
    },
    {
      id: 'voice-engineer',
      name: '语音工程师',
      capabilityIds: ['voice'],
      knownLimitations: ['容易混淆语音的播放时机', '可能遗漏播放条件'],
      contextScope: 'assignment-only',
      fallibilityPolicyId: 'scripted-review-v1',
    },
  ],
  fallibilityPolicies: [
    {
      id: 'scripted-review-v1',
      mode: 'scripted',
      minimumReviewCycles: 1,
      allowedFaultTypes: ['wrong-parameter', 'wrong-order', 'condition-omitted'],
      simulatorOnly: true,
    },
  ],
  tests: [
    {
      id: 'family-treasure-hunt-basic',
      name: '家庭寻宝基础模拟',
      requiredToolIds: ['basic-movement', 'voice'],
      successCriteria: ['小车按计划移动后再播报线索', '运行经过孩子设置的检查点'],
    },
    {
      id: 'museum-guide-basic',
      name: '博物馆导览基础模拟',
      requiredToolIds: ['basic-movement', 'voice'],
      successCriteria: ['小车到达展品位置后再开始讲解', '运行经过孩子设置的检查点'],
    },
  ],
  faults: [
    {
      id: 'family-route-wrong-angle',
      agentId: 'route-engineer',
      type: 'wrong-parameter',
      observableEvidence: ['预期转向 90 度', '里程计记录实际转向 60 度'],
      repairCriteria: ['转向参数改为 90 度', '重新运行受影响路径并通过检查点'],
      debrief: '路线工程师把转向角度写错了；证据来自预期和里程计结果的首次差异。',
    },
    {
      id: 'museum-voice-wrong-order',
      agentId: 'voice-engineer',
      type: 'wrong-order',
      observableEvidence: ['讲解在到达展品前开始', '移动完成事件尚未出现'],
      repairCriteria: ['语音步骤依赖移动完成', '重新运行并确认到达后才讲解'],
      debrief: '语音工程师混淆了播放时机；修复需要补充步骤依赖并复验。',
    },
  ],
};
