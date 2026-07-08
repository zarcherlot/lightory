export type RoleConfigMode = 'simple' | 'markdown';

export type RoleId = 'weather' | 'dresser' | 'travel' | 'captain';

export interface WeatherRoleConfig {
  city: string;
  date: string;
  outputs: {
    condition: boolean;
    temperature: boolean;
    rain: boolean;
    wind: boolean;
    airQuality: boolean;
  };
}

export interface DresserRoleConfig {
  activity: string;
  style: string;
  outputs: {
    top: boolean;
    bottom: boolean;
    shoes: boolean;
    accessories: boolean;
  };
}

export interface TravelRoleConfig {
  destination: string;
  transport: string;
  outputs: {
    umbrella: boolean;
    waterBottle: boolean;
    sunProtection: boolean;
    safety: boolean;
  };
}

export interface CaptainRoleConfig {
  audience: string;
  tone: string;
  outputs: {
    weatherSummary: boolean;
    clothingSummary: boolean;
    travelSummary: boolean;
    checklist: boolean;
  };
}

export type RoleSimpleConfig =
  | { roleId: 'weather'; weather: WeatherRoleConfig }
  | { roleId: 'dresser'; dresser: DresserRoleConfig }
  | { roleId: 'travel'; travel: TravelRoleConfig }
  | { roleId: 'captain'; captain: CaptainRoleConfig };

export interface RoleRuntimeConfig {
  roleId: RoleId;
  mode: RoleConfigMode;
  markdown: string;
  simple: RoleSimpleConfig;
}

export const defaultWeatherRoleConfig: WeatherRoleConfig = {
  city: '上海',
  date: '明天',
  outputs: {
    condition: true,
    temperature: true,
    rain: true,
    wind: true,
    airQuality: false,
  },
};

export const defaultDresserRoleConfig: DresserRoleConfig = {
  activity: '去学校 / 公园',
  style: '舒服、方便活动',
  outputs: {
    top: true,
    bottom: true,
    shoes: true,
    accessories: true,
  },
};

export const defaultTravelRoleConfig: TravelRoleConfig = {
  destination: '学校 / 公园',
  transport: '步行或短途出行',
  outputs: {
    umbrella: true,
    waterBottle: true,
    sunProtection: true,
    safety: true,
  },
};

export const defaultCaptainRoleConfig: CaptainRoleConfig = {
  audience: '小朋友',
  tone: '有趣、亲切、像广播一样',
  outputs: {
    weatherSummary: true,
    clothingSummary: true,
    travelSummary: true,
    checklist: true,
  },
};

export function buildRoleTaskMarkdown(config: RoleRuntimeConfig): string {
  switch (config.simple.roleId) {
    case 'weather':
      return buildWeatherTaskMarkdown(config.simple.weather);
    case 'dresser':
      return buildDresserTaskMarkdown(config.simple.dresser);
    case 'travel':
      return buildTravelTaskMarkdown(config.simple.travel);
    case 'captain':
      return buildCaptainTaskMarkdown(config.simple.captain);
  }
}

export function buildWeatherTaskMarkdown(config: WeatherRoleConfig): string {
  const outputItems = [
    config.outputs.condition ? '天气情况' : null,
    config.outputs.temperature ? '温度' : null,
    config.outputs.rain ? '是否下雨' : null,
    config.outputs.wind ? '风力' : null,
    config.outputs.airQuality ? '空气质量' : null,
  ].filter(Boolean);

  return [
    '# 气象学家任务',
    '',
    '你是气象学家，负责把天气线索整理成小队能看懂的天气卡。',
    '',
    '任务：',
    '',
    `- 查询${config.city}${config.date}的天气。`,
    '- 输出一张简短的天气卡。',
    `- 天气卡必须包含：${outputItems.join('、') || '天气情况'}。`,
    '- 如果无法联网查询，请明确说明查询失败，并给出需要重新查询的提示。',
    '',
    '输出格式：',
    '',
    '天气卡：<天气摘要>',
  ].join('\n');
}

export function buildDresserTaskMarkdown(config: DresserRoleConfig): string {
  const outputItems = [
    config.outputs.top ? '上衣' : null,
    config.outputs.bottom ? '下装' : null,
    config.outputs.shoes ? '鞋子' : null,
    config.outputs.accessories ? '可选配件' : null,
  ].filter(Boolean);

  return [
    '# 穿衣管家任务',
    '',
    '你是穿衣管家，负责把天气卡变成小朋友容易照做的穿衣建议。',
    '',
    '任务：',
    '',
    `- 根据收到的天气卡，为“${config.activity}”给出穿衣建议。`,
    `- 穿衣风格要偏向：${config.style}。`,
    `- 穿衣卡必须包含：${outputItems.join('、') || '穿衣建议'}。`,
    '- 如果天气卡信息不够，请说明还需要气象学家补充什么。',
    '',
    '输出格式：',
    '',
    '穿衣卡：<穿衣建议>',
  ].join('\n');
}

export function buildTravelTaskMarkdown(config: TravelRoleConfig): string {
  const outputItems = [
    config.outputs.umbrella ? '是否带伞' : null,
    config.outputs.waterBottle ? '水杯' : null,
    config.outputs.sunProtection ? '防晒或防风' : null,
    config.outputs.safety ? '安全提醒' : null,
  ].filter(Boolean);

  return [
    '# 出行管家任务',
    '',
    '你是出行管家，负责把天气卡和目的地变成路上要注意的提醒。',
    '',
    '任务：',
    '',
    `- 根据收到的天气卡，为去“${config.destination}”给出出行提醒。`,
    `- 默认出行方式：${config.transport}。`,
    `- 出行卡必须包含：${outputItems.join('、') || '出行提醒'}。`,
    '- 如果天气卡信息不够，请说明还需要气象学家补充什么。',
    '',
    '输出格式：',
    '',
    '出行卡：<出行提醒>',
  ].join('\n');
}

export function buildCaptainTaskMarkdown(config: CaptainRoleConfig): string {
  const outputItems = [
    config.outputs.weatherSummary ? '天气摘要' : null,
    config.outputs.clothingSummary ? '穿衣摘要' : null,
    config.outputs.travelSummary ? '出行摘要' : null,
    config.outputs.checklist ? '最终准备清单' : null,
  ].filter(Boolean);

  return [
    '# 广播员任务',
    '',
    '你是广播员，负责为穿衣管家和出行管家的输出注入趣味性元素，并播报给大家。',
    '',
    '任务：',
    '',
    '- 重点读取穿衣卡和出行卡，并可参考天气卡补充背景。',
    '- 把穿衣管家和出行管家的建议改写得更有画面感、更有趣，但不要改变原意。',
    `- 面向${config.audience}进行广播。`,
    `- 语气要求：${config.tone}。`,
    `- 广播必须包含：${outputItems.join('、') || '最终准备清单'}。`,
    '- 如果缺少关键卡片，请说明还需要哪个角色先补充。',
    '',
    '输出格式：',
    '',
    '趣味广播：',
    '',
    '- <物品或行动>',
  ].join('\n');
}

export function createDefaultRoleConfig(roleId: RoleId | string): RoleRuntimeConfig {
  switch (roleId) {
    case 'dresser':
      return createRoleConfig('dresser', { roleId: 'dresser', dresser: defaultDresserRoleConfig });
    case 'travel':
      return createRoleConfig('travel', { roleId: 'travel', travel: defaultTravelRoleConfig });
    case 'captain':
      return createRoleConfig('captain', { roleId: 'captain', captain: defaultCaptainRoleConfig });
    case 'weather':
    default:
      return createRoleConfig('weather', { roleId: 'weather', weather: defaultWeatherRoleConfig });
  }
}

export function syncSimpleToMarkdown(config: RoleRuntimeConfig): RoleRuntimeConfig {
  return {
    ...config,
    markdown: buildRoleTaskMarkdown(config),
  };
}

export function getRoleConfigSummary(config?: RoleRuntimeConfig): string | null {
  if (!config) return null;
  switch (config.simple.roleId) {
    case 'weather':
      return `${config.simple.weather.city} · ${config.simple.weather.date}`;
    case 'dresser':
      return config.simple.dresser.activity;
    case 'travel':
      return config.simple.travel.destination;
    case 'captain':
      return config.simple.captain.audience;
  }
}

function createRoleConfig(roleId: RoleId, simple: RoleSimpleConfig): RoleRuntimeConfig {
  const config: RoleRuntimeConfig = {
    roleId,
    mode: 'simple',
    simple,
    markdown: '',
  };
  return syncSimpleToMarkdown(config);
}
