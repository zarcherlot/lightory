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
    id: 'weather',
    name: '气象学家',
    title: '气象',
    palette: 0,
    taskFile: 'roles/weather.md',
    abilityCards: ['天气卡'],
    resultCard: '天气结果卡',
    responsibility: '查询天气线索，告诉小队温度、雨水、风力等信息。',
    roleTaskIcon: 'weather',
  },
  {
    id: 'dresser',
    name: '穿衣管家',
    title: '穿衣',
    palette: 1,
    taskFile: 'roles/dresser.md',
    abilityCards: ['穿衣卡'],
    resultCard: '穿衣建议卡',
    responsibility: '根据天气卡给出舒适、方便活动的穿衣建议。',
    roleTaskIcon: 'dresser',
  },
  {
    id: 'travel',
    name: '出行管家',
    title: '出行',
    palette: 2,
    taskFile: 'roles/travel.md',
    abilityCards: ['出行卡'],
    resultCard: '出行提醒卡',
    responsibility: '根据天气卡和目的地提醒路上要带的物品。',
    roleTaskIcon: 'travel',
  },
  {
    id: 'captain',
    name: '广播员',
    title: '广播',
    palette: 3,
    taskFile: 'roles/captain.md',
    abilityCards: ['计划卡'],
    resultCard: '趣味广播',
    responsibility: '为穿衣管家和出行管家的输出注入趣味性元素，再播报给大家。',
    roleTaskIcon: 'captain',
  },
];

export function getRoleAgentId(roleId: string): number {
  const index = roleDefinitions.findIndex((role) => role.id === roleId);
  return ROLE_AGENT_ID_BASE + Math.max(0, index);
}

export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return roleDefinitions.find((role) => role.id === roleId);
}
