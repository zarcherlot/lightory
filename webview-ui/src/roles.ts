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
    name: '晴雨小侦探',
    title: '侦探',
    palette: 0,
    taskFile: 'roles/weather.md',
    abilityCards: ['天气卡'],
    resultCard: '天气结果卡',
    responsibility: '侦查明天的天空线索，告诉小队温度和会不会下雨。',
    roleTaskIcon: 'weather',
  },
  {
    id: 'dresser',
    name: '衣橱魔法师',
    title: '衣橱',
    palette: 1,
    taskFile: 'roles/dresser.md',
    abilityCards: ['穿衣卡'],
    resultCard: '穿衣建议卡',
    responsibility: '把天气卡变成舒服、好动、适合明天的穿搭咒语。',
    roleTaskIcon: 'dresser',
  },
  {
    id: 'travel',
    name: '路线背包侠',
    title: '背包',
    palette: 2,
    taskFile: 'roles/travel.md',
    abilityCards: ['出行卡'],
    resultCard: '出行提醒卡',
    responsibility: '检查路上的小状况，提醒要不要带伞、水杯或其他物品。',
    roleTaskIcon: 'travel',
  },
  {
    id: 'captain',
    name: '小喇叭队长',
    title: '广播',
    palette: 3,
    taskFile: 'roles/captain.md',
    abilityCards: ['计划卡'],
    resultCard: '准备清单',
    responsibility: '收集大家的卡片，广播一份清楚、响亮的最终准备清单。',
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
