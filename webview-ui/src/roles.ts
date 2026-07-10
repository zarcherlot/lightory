import type { RoleTaskIcon } from './office/types.js';

export interface RoleDefinition {
  id: string;
  name: string;
  title: string;
  palette: number;
  taskFile: string;
  abilityCards: string[];
  resultCard: string;
  responsibility: string;
  roleTaskIcon: RoleTaskIcon;
}

export const ROLE_AGENT_ID_BASE = 9000;

export const roleDefinitions: RoleDefinition[] = [
  {
    id: 'coordinator',
    name: '角色调度员',
    title: '角色调度员',
    palette: 5,
    taskFile: 'roles/coordinator.md',
    abilityCards: ['任务分发', '角色协调'],
    resultCard: '调度建议',
    responsibility: '理解用户意图，决定应该由哪些角色响应、按什么顺序协作，并把任务分发清楚。',
    roleTaskIcon: 'card',
  },
  {
    id: 'storyteller',
    name: '任务规划员',
    title: '任务规划员',
    palette: 0,
    taskFile: 'roles/storyteller.md',
    abilityCards: ['任务规划'],
    resultCard: '任务计划',
    responsibility: '把用户意图拆成可执行步骤，明确目标、依赖角色、风险和确认点。',
    roleTaskIcon: 'card',
  },
  {
    id: 'checker',
    name: '安全监督员',
    title: '安全监督员',
    palette: 1,
    taskFile: 'roles/checker.md',
    abilityCards: ['安全审查'],
    resultCard: '安全结论',
    responsibility: '检查移动和机械臂动作是否安全，指出风险、禁止条件和需要用户确认的问题。',
    roleTaskIcon: 'card',
  },
  {
    id: 'weather',
    name: '家庭记忆员',
    title: '家庭记忆员',
    palette: 2,
    taskFile: 'roles/weather.md',
    abilityCards: ['家庭记忆'],
    resultCard: '家庭记忆',
    responsibility: '维护房间、物品、禁行区、当前位置等家庭环境记忆。',
    roleTaskIcon: 'weather',
  },
  {
    id: 'travel',
    name: '底盘驾驶员',
    title: '底盘驾驶员',
    palette: 3,
    taskFile: 'roles/travel.md',
    abilityCards: ['底盘移动'],
    resultCard: '移动方案',
    responsibility: '把路线和目标转成低速、安全、可中断的底盘动作。',
    roleTaskIcon: 'travel',
  },
  {
    id: 'dresser',
    name: '机械臂操作员',
    title: '机械臂操作员',
    palette: 4,
    taskFile: 'roles/dresser.md',
    abilityCards: ['机械臂操作'],
    resultCard: '机械臂步骤',
    responsibility: '把抓取、放置、递交、停止等动作拆成安全的机械臂步骤。',
    roleTaskIcon: 'dresser',
  },
  {
    id: 'encyclopedia',
    name: '视觉观察员',
    title: '视觉观察员',
    palette: 5,
    taskFile: 'roles/encyclopedia.md',
    abilityCards: ['视觉观察'],
    resultCard: '视觉事实',
    responsibility: '整理视觉画面中的物体、人物、通道、距离和潜在危险。',
    roleTaskIcon: 'card',
  },
  {
    id: 'captain',
    name: '语音播报员',
    title: '语音播报员',
    palette: 0,
    taskFile: 'roles/captain.md',
    abilityCards: ['语音播报'],
    resultCard: '播报话术',
    responsibility: '把确认、提醒、错误和结果转成适合扬声器播放的自然短句。',
    roleTaskIcon: 'captain',
  },
  {
    id: 'poster',
    name: 'LED 表情员',
    title: 'LED 表情员',
    palette: 1,
    taskFile: 'roles/poster.md',
    abilityCards: ['LED 表情'],
    resultCard: 'LED 表情',
    responsibility: '把等待、执行、成功、错误和安全状态转成清晰克制的 LED 灯效。',
    roleTaskIcon: 'card',
  },
];

export function getRoleAgentId(roleId: string): number {
  const index = roleDefinitions.findIndex((role) => role.id === roleId);
  return ROLE_AGENT_ID_BASE + Math.max(0, index);
}

export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return roleDefinitions.find((role) => role.id === roleId);
}
