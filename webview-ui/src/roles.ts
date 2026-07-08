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
    name: '家庭记忆员',
    title: '家庭记忆员',
    palette: 0,
    taskFile: 'roles/weather.md',
    abilityCards: ['地图记忆卡'],
    resultCard: '地图记忆卡',
    responsibility: '持久记录家庭 POI、房间别名、禁行区和用户环境声明。',
    roleTaskIcon: 'weather',
  },
  {
    id: 'dresser',
    name: '机械臂操作员',
    title: '机械臂操作员',
    palette: 1,
    taskFile: 'roles/dresser.md',
    abilityCards: ['操作结果卡'],
    resultCard: '操作结果卡',
    responsibility: '把取、放、推、递等动作拆成机械臂可执行步骤。',
    roleTaskIcon: 'dresser',
  },
  {
    id: 'travel',
    name: '底盘驾驶员',
    title: '底盘驾驶员',
    palette: 2,
    taskFile: 'roles/travel.md',
    abilityCards: ['移动结果卡'],
    resultCard: '移动结果卡',
    responsibility: '执行轮式底盘速度、转向、停止和贴边避障动作。',
    roleTaskIcon: 'travel',
  },
  {
    id: 'captain',
    name: '语音播报员',
    title: '语音播报员',
    palette: 3,
    taskFile: 'roles/captain.md',
    abilityCards: ['语音输出卡'],
    resultCard: '语音输出卡',
    responsibility: '把确认、提醒、结果转成适合扬声器播放的短句。',
    roleTaskIcon: 'captain',
  },
  {
    id: 'navigator',
    name: '领航员',
    title: '领航员',
    palette: 4,
    taskFile: 'roles/navigator.md',
    abilityCards: ['路线卡'],
    resultCard: '路线提醒卡',
    responsibility: '读取地图记忆和视觉事实，产出可交给底盘驾驶员的路线。',
    roleTaskIcon: 'card',
  },
  {
    id: 'encyclopedia',
    name: '视觉观察员',
    title: '视觉观察员',
    palette: 5,
    taskFile: 'roles/encyclopedia.md',
    abilityCards: ['视觉事实卡'],
    resultCard: '视觉事实卡',
    responsibility: '读取视觉传感器画面，描述物体、人体、通道和危险。',
    roleTaskIcon: 'card',
  },
  {
    id: 'calculator',
    name: '状态诊断员',
    title: '状态诊断员',
    palette: 0,
    taskFile: 'roles/calculator.md',
    abilityCards: ['诊断卡'],
    resultCard: '诊断卡',
    responsibility: '汇总电量、网络、传感器、底盘和机械臂状态。',
    roleTaskIcon: 'card',
  },
  {
    id: 'translator',
    name: '听觉监听员',
    title: '听觉监听员',
    palette: 1,
    taskFile: 'roles/translator.md',
    abilityCards: ['听觉事实卡'],
    resultCard: '听觉事实卡',
    responsibility: '处理麦克风输入，识别用户话语、环境声音和打断信号。',
    roleTaskIcon: 'card',
  },
  {
    id: 'storyteller',
    name: '任务规划员',
    title: '任务规划员',
    palette: 2,
    taskFile: 'roles/storyteller.md',
    abilityCards: ['任务计划卡'],
    resultCard: '任务计划卡',
    responsibility: '把用户意图拆成可协调的观察、导航、移动、操作和反馈步骤。',
    roleTaskIcon: 'card',
  },
  {
    id: 'poster',
    name: 'LED 表情员',
    title: 'LED 表情员',
    palette: 3,
    taskFile: 'roles/poster.md',
    abilityCards: ['LED 状态卡'],
    resultCard: 'LED 状态卡',
    responsibility: '把工作、等待、确认、错误和安全状态转成 LED 灯效。',
    roleTaskIcon: 'card',
  },
  {
    id: 'checker',
    name: '安全监督员',
    title: '安全监督员',
    palette: 4,
    taskFile: 'roles/checker.md',
    abilityCards: ['安全许可卡'],
    resultCard: '安全许可卡',
    responsibility: '对移动和机械臂动作做风险检查，并在不安全时要求确认或停止。',
    roleTaskIcon: 'card',
  },
  {
    id: 'summarizer',
    name: '交互入口员',
    title: '交互入口员',
    palette: 5,
    taskFile: 'roles/summarizer.md',
    abilityCards: ['用户意图卡'],
    resultCard: '用户意图卡',
    responsibility: '接收用户主动输入或确认回复，判断这是命令、确认还是环境声明。',
    roleTaskIcon: 'card',
  },
  {
    id: 'questioner',
    name: '确认追问员',
    title: '确认追问员',
    palette: 0,
    taskFile: 'roles/questioner.md',
    abilityCards: ['确认请求卡'],
    resultCard: '确认请求卡',
    responsibility: '在高风险、信息不足或角色主动发起对话时生成确认问题。',
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
