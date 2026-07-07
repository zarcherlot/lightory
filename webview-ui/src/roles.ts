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
    name: '天气预报员',
    title: '天气',
    palette: 0,
    taskFile: 'roles/weather.md',
    abilityCards: ['天气卡'],
    resultCard: '天气结果卡',
    responsibility: '查询天气，告诉小队温度和会不会下雨。',
    roleTaskIcon: 'weather',
  },
  {
    id: 'dresser',
    name: '穿衣建议员',
    title: '穿衣',
    palette: 1,
    taskFile: 'roles/dresser.md',
    abilityCards: ['穿衣卡'],
    resultCard: '穿衣建议卡',
    responsibility: '根据天气卡，给出适合明天的穿衣建议。',
    roleTaskIcon: 'dresser',
  },
  {
    id: 'travel',
    name: '出行提醒员',
    title: '出行',
    palette: 2,
    taskFile: 'roles/travel.md',
    abilityCards: ['出行卡'],
    resultCard: '出行提醒卡',
    responsibility: '根据天气卡，提醒要不要带伞、水杯或其他物品。',
    roleTaskIcon: 'travel',
  },
  {
    id: 'captain',
    name: '小队队长',
    title: '队长',
    palette: 3,
    taskFile: 'roles/captain.md',
    abilityCards: ['计划卡'],
    resultCard: '准备清单',
    responsibility: '收集大家的卡片，整理成最终准备清单。',
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
