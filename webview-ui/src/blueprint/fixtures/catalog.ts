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
      successCriteria: ['小车按蓝图移动后再播报线索', '交付连接产生正确的动作顺序'],
    },
    {
      id: 'museum-guide-basic',
      name: '博物馆导览基础模拟',
      requiredToolIds: ['basic-movement', 'voice'],
      successCriteria: ['小车到达展品位置后再开始讲解', '交付连接产生正确的动作顺序'],
    },
  ],
  faults: [
    {
      id: 'family-route-low-speed',
      agentId: 'route-engineer',
      type: 'wrong-parameter',
      observableEvidence: ['路线方案使用 0.05 米/秒的低速', '试验场能观察到移动耗时明显过长'],
      repairCriteria: ['请路线工程师把移动速度设置为 0.3m/s', '重新生成方案并在试验场复验耗时'],
      debrief: '路线工程师在孩子没有说明速度时选择了过于保守的低速；修复需要总工程师补充明确速度要求。',
    },
    {
      id: 'family-route-wrong-distance',
      agentId: 'route-engineer',
      type: 'wrong-parameter',
      observableEvidence: ['小车停在目标前方', '实际前进距离少于孩子预期'],
      repairCriteria: ['前进距离改为孩子确认的目标距离', '重新构建受影响路径并通过复验'],
      debrief: '路线工程师少算了前进距离；证据来自目标位置和最终停靠点的差异。',
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
