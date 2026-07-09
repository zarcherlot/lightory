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
    id: 'storyteller',
    name: '任务规划员',
    title: '任务规划员',
    palette: 0,
    taskFile: 'roles/storyteller.md',
    abilityCards: ['任务规划员'],
    resultCard: '任务规划员',
    responsibility: '把用户意图拆成 robot-plan/v1，决定工具、假设、风险和确认需求。',
    roleTaskIcon: 'card',
  },
  {
    id: 'checker',
    name: '安全监督员',
    title: '安全监督员',
    palette: 1,
    taskFile: 'roles/checker.md',
    abilityCards: ['安全监督员'],
    resultCard: '安全监督员',
    responsibility: '检查高风险动作、用户确认、lease、速度、禁区和急停状态。',
    roleTaskIcon: 'card',
  },
  {
    id: 'weather',
    name: '家庭记忆员',
    title: '家庭记忆员',
    palette: 2,
    taskFile: 'roles/weather.md',
    abilityCards: ['家庭记忆员'],
    resultCard: '家庭记忆员',
    responsibility: '持久记录家庭 POI、房间别名、禁行区和用户环境声明。',
    roleTaskIcon: 'weather',
  },
  {
    id: 'travel',
    name: '底盘驾驶员',
    title: '底盘驾驶员',
    palette: 3,
    taskFile: 'roles/travel.md',
    abilityCards: ['底盘驾驶员'],
    resultCard: '底盘驾驶员',
    responsibility: '执行底盘状态查询、低速路径跟随、停止和 base lease。',
    roleTaskIcon: 'travel',
  },
  {
    id: 'dresser',
    name: '机械臂操作员',
    title: '机械臂操作员',
    palette: 4,
    taskFile: 'roles/dresser.md',
    abilityCards: ['机械臂操作员'],
    resultCard: '机械臂操作员',
    responsibility: '把抓取、放置、递送和机械臂停止动作拆成安全步骤。',
    roleTaskIcon: 'dresser',
  },
  {
    id: 'encyclopedia',
    name: '视觉观察员',
    title: '视觉观察员',
    palette: 5,
    taskFile: 'roles/encyclopedia.md',
    abilityCards: ['视觉观察员'],
    resultCard: '视觉观察员',
    responsibility: '读取视觉传感器画面，描述物体、人体、通道和危险。',
    roleTaskIcon: 'card',
  },
  {
    id: 'captain',
    name: '语音播报员',
    title: '语音播报员',
    palette: 0,
    taskFile: 'roles/captain.md',
    abilityCards: ['语音播报员'],
    resultCard: '语音播报员',
    responsibility: '把确认、提醒、结果转成适合扬声器播放的短句。',
    roleTaskIcon: 'captain',
  },
  {
    id: 'poster',
    name: 'LED 表情员',
    title: 'LED 表情员',
    palette: 1,
    taskFile: 'roles/poster.md',
    abilityCards: ['LED 表情员'],
    resultCard: 'LED 表情员',
    responsibility: '把等待、执行中、成功、错误和安全状态转成 LED 灯效。',
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
