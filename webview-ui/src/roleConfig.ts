export type RoleConfigMode = 'simple' | 'markdown';

export type RoleId =
  | 'weather'
  | 'dresser'
  | 'travel'
  | 'captain'
  | 'navigator'
  | 'encyclopedia'
  | 'calculator'
  | 'translator'
  | 'storyteller'
  | 'poster'
  | 'checker'
  | 'summarizer'
  | 'questioner';

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

export interface GenericRoleConfig {
  topic: string;
  audience: string;
  style: string;
  include: string;
}

export type RoleSimpleConfig =
  | { roleId: 'weather'; weather: WeatherRoleConfig }
  | { roleId: 'dresser'; dresser: DresserRoleConfig }
  | { roleId: 'travel'; travel: TravelRoleConfig }
  | { roleId: 'captain'; captain: CaptainRoleConfig }
  | {
      roleId: Exclude<RoleId, 'weather' | 'dresser' | 'travel' | 'captain'>;
      generic: GenericRoleConfig;
    };

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

const GENERIC_ROLE_PROFILES: Record<
  Exclude<RoleId, 'weather' | 'dresser' | 'travel' | 'captain'>,
  {
    heading: string;
    persona: string;
    cardName: string;
    defaultTopic: string;
    defaultStyle: string;
    defaultInclude: string;
  }
> = {
  navigator: {
    heading: '地图导航员任务',
    persona: '你是地图导航员，负责把目的地、路线和路上提醒整理成小朋友能执行的路线卡。',
    cardName: '路线卡',
    defaultTopic: '明天去学校 / 公园的路线安排',
    defaultStyle: '清楚、简短、注意安全',
    defaultInclude: '路线步骤、预计时间、路上提醒',
  },
  encyclopedia: {
    heading: '百科老师任务',
    persona: '你是百科老师，负责把陌生知识讲成小朋友容易听懂的小知识卡。',
    cardName: '知识卡',
    defaultTopic: '解释一个和天气、出行或学习有关的小知识',
    defaultStyle: '像老师一样清楚，但不要太长',
    defaultInclude: '一句话答案、简单解释、生活例子',
  },
  calculator: {
    heading: '计算小能手任务',
    persona: '你是计算小能手，负责帮小队数数量、算时间、算花费，并写清楚怎么算。',
    cardName: '计算卡',
    defaultTopic: '计算出行准备需要的数量或时间',
    defaultStyle: '一步一步、数字清楚',
    defaultInclude: '已知条件、计算过程、最终答案',
  },
  translator: {
    heading: '翻译员任务',
    persona: '你是翻译员，负责把小队需要的话翻译成目标语言，并保留友好的语气。',
    cardName: '翻译卡',
    defaultTopic: '把准备清单或提醒翻译成英文',
    defaultStyle: '自然、礼貌、适合小朋友朗读',
    defaultInclude: '原句、译文、一个发音或使用提醒',
  },
  storyteller: {
    heading: '故事作家任务',
    persona: '你是故事作家，负责把主题和素材变成有开头、经过、结尾的小故事。',
    cardName: '故事卡',
    defaultTopic: '写一个关于明天出门准备的小故事',
    defaultStyle: '有画面感、温暖、有一点趣味',
    defaultInclude: '标题、故事正文、结尾小提醒',
  },
  poster: {
    heading: '海报设计师任务',
    persona: '你是海报设计师，负责把主题整理成标题、画面元素、颜色和文字排版建议。',
    cardName: '海报卡',
    defaultTopic: '设计一张明天出门准备提醒海报',
    defaultStyle: '醒目、整洁、适合小朋友看',
    defaultInclude: '标题、主画面、颜色、三条短文字',
  },
  checker: {
    heading: '检查员任务',
    persona: '你是检查员，负责检查其他角色的卡片有没有遗漏、矛盾或不容易执行的地方。',
    cardName: '检查卡',
    defaultTopic: '检查小队的准备建议是否完整',
    defaultStyle: '认真、友好、只指出真正需要改的地方',
    defaultInclude: '做得好的地方、需要补充的地方、修正建议',
  },
  summarizer: {
    heading: '总结员任务',
    persona: '你是总结员，负责把多张卡片压缩成清楚、短小、好记的重点。',
    cardName: '总结卡',
    defaultTopic: '总结明天去学校 / 公园的准备重点',
    defaultStyle: '短小、好记、适合贴在任务卡上',
    defaultInclude: '三条重点、一个最重要提醒',
  },
  questioner: {
    heading: '提问员任务',
    persona: '你是提问员，负责发现任务里还没说清楚的地方，提出帮助小队继续思考的问题。',
    cardName: '问题卡',
    defaultTopic: '为明天去学校 / 公园的准备任务提出追问',
    defaultStyle: '好奇、友好、问题具体',
    defaultInclude: '三个关键问题、为什么要问',
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
    default:
      return buildGenericTaskMarkdown(config.simple.roleId, config.simple.generic);
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

export function buildGenericTaskMarkdown(
  roleId: Exclude<RoleId, 'weather' | 'dresser' | 'travel' | 'captain'>,
  config: GenericRoleConfig,
): string {
  const profile = GENERIC_ROLE_PROFILES[roleId];

  return [
    `# ${profile.heading}`,
    '',
    profile.persona,
    '',
    '任务：',
    '',
    `- 主题：${config.topic}。`,
    `- 面向：${config.audience}。`,
    `- 风格：${config.style}。`,
    `- 必须包含：${config.include}。`,
    '- 如果收到上游卡片，请优先参考上游卡片；如果信息不够，请说清楚还需要什么。',
    '',
    '输出格式：',
    '',
    `${profile.cardName}：<你的结果>`,
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
    case 'navigator':
    case 'encyclopedia':
    case 'calculator':
    case 'translator':
    case 'storyteller':
    case 'poster':
    case 'checker':
    case 'summarizer':
    case 'questioner':
      return createRoleConfig(roleId, {
        roleId,
        generic: createDefaultGenericRoleConfig(roleId),
      });
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

export function syncMarkdownToSimple(config: RoleRuntimeConfig): RoleRuntimeConfig {
  switch (config.simple.roleId) {
    case 'weather':
      return {
        ...config,
        simple: {
          roleId: 'weather',
          weather: parseWeatherTaskMarkdown(config.markdown, config.simple.weather),
        },
      };
    case 'dresser':
      return {
        ...config,
        simple: {
          roleId: 'dresser',
          dresser: parseDresserTaskMarkdown(config.markdown, config.simple.dresser),
        },
      };
    case 'travel':
      return {
        ...config,
        simple: {
          roleId: 'travel',
          travel: parseTravelTaskMarkdown(config.markdown, config.simple.travel),
        },
      };
    case 'captain':
      return {
        ...config,
        simple: {
          roleId: 'captain',
          captain: parseCaptainTaskMarkdown(config.markdown, config.simple.captain),
        },
      };
    default:
      return {
        ...config,
        simple: {
          roleId: config.simple.roleId,
          generic: parseGenericTaskMarkdown(config.markdown, config.simple.generic),
        },
      };
  }
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
    default:
      return config.simple.generic.topic;
  }
}

export function createDefaultGenericRoleConfig(
  roleId: Exclude<RoleId, 'weather' | 'dresser' | 'travel' | 'captain'>,
): GenericRoleConfig {
  const profile = GENERIC_ROLE_PROFILES[roleId];
  return {
    topic: profile.defaultTopic,
    audience: '小朋友',
    style: profile.defaultStyle,
    include: profile.defaultInclude,
  };
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

function parseWeatherTaskMarkdown(
  markdown: string,
  fallback: WeatherRoleConfig,
): WeatherRoleConfig {
  const query = matchText(markdown, /查询(.+?)的天气[。.\n]/u);
  const { city, date } = splitCityDate(query, fallback.city, fallback.date);
  const contains = parseContains(markdown, '天气卡必须包含');

  return {
    city,
    date,
    outputs: {
      condition: hasContainsItem(contains, '天气情况', fallback.outputs.condition),
      temperature: hasContainsItem(contains, '温度', fallback.outputs.temperature),
      rain: hasContainsItem(contains, '是否下雨', fallback.outputs.rain),
      wind: hasContainsItem(contains, '风力', fallback.outputs.wind),
      airQuality: hasContainsItem(contains, '空气质量', fallback.outputs.airQuality),
    },
  };
}

function parseDresserTaskMarkdown(
  markdown: string,
  fallback: DresserRoleConfig,
): DresserRoleConfig {
  const contains = parseContains(markdown, '穿衣卡必须包含');
  return {
    activity: matchText(markdown, /为“(.+?)”给出穿衣建议/u) ?? fallback.activity,
    style: matchText(markdown, /穿衣风格要偏向：(.+?)[。.\n]/u) ?? fallback.style,
    outputs: {
      top: hasContainsItem(contains, '上衣', fallback.outputs.top),
      bottom: hasContainsItem(contains, '下装', fallback.outputs.bottom),
      shoes: hasContainsItem(contains, '鞋子', fallback.outputs.shoes),
      accessories: hasContainsItem(contains, '可选配件', fallback.outputs.accessories),
    },
  };
}

function parseTravelTaskMarkdown(markdown: string, fallback: TravelRoleConfig): TravelRoleConfig {
  const contains = parseContains(markdown, '出行卡必须包含');
  return {
    destination: matchText(markdown, /为去“(.+?)”给出出行提醒/u) ?? fallback.destination,
    transport: matchText(markdown, /默认出行方式：(.+?)[。.\n]/u) ?? fallback.transport,
    outputs: {
      umbrella: hasContainsItem(contains, '是否带伞', fallback.outputs.umbrella),
      waterBottle: hasContainsItem(contains, '水杯', fallback.outputs.waterBottle),
      sunProtection: hasContainsItem(contains, '防晒或防风', fallback.outputs.sunProtection),
      safety: hasContainsItem(contains, '安全提醒', fallback.outputs.safety),
    },
  };
}

function parseCaptainTaskMarkdown(
  markdown: string,
  fallback: CaptainRoleConfig,
): CaptainRoleConfig {
  const contains = parseContains(markdown, '广播必须包含');
  return {
    audience: matchText(markdown, /面向(.+?)进行广播/u) ?? fallback.audience,
    tone: matchText(markdown, /语气要求：(.+?)[。.\n]/u) ?? fallback.tone,
    outputs: {
      weatherSummary: hasContainsItem(contains, '天气摘要', fallback.outputs.weatherSummary),
      clothingSummary: hasContainsItem(contains, '穿衣摘要', fallback.outputs.clothingSummary),
      travelSummary: hasContainsItem(contains, '出行摘要', fallback.outputs.travelSummary),
      checklist: hasContainsItem(contains, '最终准备清单', fallback.outputs.checklist),
    },
  };
}

function parseGenericTaskMarkdown(
  markdown: string,
  fallback: GenericRoleConfig,
): GenericRoleConfig {
  return {
    topic: matchText(markdown, /主题：(.+?)[。.\n]/u) ?? fallback.topic,
    audience: matchText(markdown, /面向：(.+?)[。.\n]/u) ?? fallback.audience,
    style: matchText(markdown, /风格：(.+?)[。.\n]/u) ?? fallback.style,
    include: matchText(markdown, /必须包含：(.+?)[。.\n]/u) ?? fallback.include,
  };
}

function matchText(markdown: string, pattern: RegExp): string | null {
  return markdown.match(pattern)?.[1]?.trim() || null;
}

function splitCityDate(
  query: string | null,
  fallbackCity: string,
  fallbackDate: string,
): { city: string; date: string } {
  if (!query) return { city: fallbackCity, date: fallbackDate };
  const knownDates = ['本周末', '后天', '明天', '今天'];
  const date = knownDates.find((item) => query.endsWith(item));
  if (!date) return { city: query, date: fallbackDate };
  return { city: query.slice(0, -date.length).trim() || fallbackCity, date };
}

function parseContains(markdown: string, label: string): string[] | null {
  const text = matchText(markdown, new RegExp(`${escapeRegExp(label)}：(.+?)[。.\\n]`, 'u'));
  if (!text) return null;
  return text
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasContainsItem(items: string[] | null, item: string, fallback: boolean): boolean {
  if (!items) return fallback;
  return items.includes(item);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
