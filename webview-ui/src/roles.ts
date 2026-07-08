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
    title: '气象学家',
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
    title: '穿衣管家',
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
    title: '出行管家',
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
    title: '广播员',
    palette: 3,
    taskFile: 'roles/captain.md',
    abilityCards: ['计划卡'],
    resultCard: '趣味广播',
    responsibility: '为穿衣管家和出行管家的输出注入趣味性元素，再播报给大家。',
    roleTaskIcon: 'captain',
  },
  {
    id: 'navigator',
    name: '地图导航员',
    title: '地图导航员',
    palette: 4,
    taskFile: 'roles/navigator.md',
    abilityCards: ['路线卡'],
    resultCard: '路线提醒卡',
    responsibility: '根据目的地和出行方式，帮小队整理路线、时间和路上提醒。',
    roleTaskIcon: 'card',
  },
  {
    id: 'encyclopedia',
    name: '百科老师',
    title: '百科老师',
    palette: 5,
    taskFile: 'roles/encyclopedia.md',
    abilityCards: ['知识卡'],
    resultCard: '知识讲解卡',
    responsibility: '把陌生问题讲成小朋友容易听懂的小知识。',
    roleTaskIcon: 'card',
  },
  {
    id: 'calculator',
    name: '计算小能手',
    title: '计算小能手',
    palette: 0,
    taskFile: 'roles/calculator.md',
    abilityCards: ['计算卡'],
    resultCard: '计算结果卡',
    responsibility: '帮助小队数数量、算时间、算花费，并写清楚怎么算。',
    roleTaskIcon: 'card',
  },
  {
    id: 'translator',
    name: '翻译员',
    title: '翻译员',
    palette: 1,
    taskFile: 'roles/translator.md',
    abilityCards: ['翻译卡'],
    resultCard: '翻译结果卡',
    responsibility: '把句子翻译成目标语言，并保留适合小朋友的语气。',
    roleTaskIcon: 'card',
  },
  {
    id: 'storyteller',
    name: '故事作家',
    title: '故事作家',
    palette: 2,
    taskFile: 'roles/storyteller.md',
    abilityCards: ['故事卡'],
    resultCard: '故事草稿卡',
    responsibility: '根据主题和素材，写一段有开头、经过、结尾的小故事。',
    roleTaskIcon: 'card',
  },
  {
    id: 'poster',
    name: '海报设计师',
    title: '海报设计师',
    palette: 3,
    taskFile: 'roles/poster.md',
    abilityCards: ['海报卡'],
    resultCard: '海报方案卡',
    responsibility: '把主题整理成海报标题、画面元素、颜色和文字排版建议。',
    roleTaskIcon: 'card',
  },
  {
    id: 'checker',
    name: '检查员',
    title: '检查员',
    palette: 4,
    taskFile: 'roles/checker.md',
    abilityCards: ['检查卡'],
    resultCard: '检查结果卡',
    responsibility: '检查其他角色的卡片有没有遗漏、矛盾或不容易执行的地方。',
    roleTaskIcon: 'card',
  },
  {
    id: 'summarizer',
    name: '总结员',
    title: '总结员',
    palette: 5,
    taskFile: 'roles/summarizer.md',
    abilityCards: ['总结卡'],
    resultCard: '总结卡',
    responsibility: '把多张卡片压缩成清楚、短小、好记的重点。',
    roleTaskIcon: 'card',
  },
  {
    id: 'questioner',
    name: '提问员',
    title: '提问员',
    palette: 0,
    taskFile: 'roles/questioner.md',
    abilityCards: ['问题卡'],
    resultCard: '追问卡',
    responsibility: '发现任务里还没说清楚的地方，提出帮助小队继续思考的问题。',
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
