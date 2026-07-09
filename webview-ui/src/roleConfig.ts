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
  city: '主卧、客厅、厨房、充电桩',
  date: '今天',
  outputs: {
    condition: true,
    temperature: true,
    rain: true,
    wind: true,
    airQuality: false,
  },
};

export const defaultDresserRoleConfig: DresserRoleConfig = {
  activity: '把桌上的小物品递给用户',
  style: '低速、避开人手、确认抓取目标',
  outputs: {
    top: true,
    bottom: true,
    shoes: true,
    accessories: true,
  },
};

export const defaultTravelRoleConfig: TravelRoleConfig = {
  destination: '主卧',
  transport: '轮式底盘低速移动',
  outputs: {
    umbrella: true,
    waterBottle: true,
    sunProtection: true,
    safety: true,
  },
};

export const defaultCaptainRoleConfig: CaptainRoleConfig = {
  audience: '家庭用户',
  tone: '简短、明确、可确认',
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
    heading: '领航员任务',
    persona: '你是桌面机器人的领航员，负责读取地图记忆、POI 和视觉事实，规划底盘路线。',
    cardName: '路线输入',
    defaultTopic: '从当前位置移动到主卧',
    defaultStyle: '低速、安全、可执行',
    defaultInclude: '目标 POI、关键路标、禁行区、到达判定',
  },
  encyclopedia: {
    heading: '视觉观察员任务',
    persona: '你是桌面机器人的视觉观察员，负责把摄像头画面整理成可给规划和安全角色使用的事实。',
    cardName: '视觉观察员',
    defaultTopic: '观察桌面、通道、人物和目标物',
    defaultStyle: '客观、结构化、只描述可见事实',
    defaultInclude: '物体、方位、距离估计、通道、风险',
  },
  calculator: {
    heading: '状态诊断员任务',
    persona: '你是桌面机器人的状态诊断员，负责汇总硬件与软件运行状态。',
    cardName: '状态诊断',
    defaultTopic: '检查移动、机械臂、视觉、麦克风、扬声器和电量状态',
    defaultStyle: '简短、分级、可排障',
    defaultInclude: '可用能力、异常状态、是否允许继续执行',
  },
  translator: {
    heading: '听觉监听员任务',
    persona: '你是桌面机器人的听觉监听员，负责把麦克风输入整理成事实。',
    cardName: '听觉监听员',
    defaultTopic: '识别用户说话、确认回复和环境声音',
    defaultStyle: '准确、保留不确定性',
    defaultInclude: '原话摘要、说话人、置信度、是否为打断或确认',
  },
  storyteller: {
    heading: '任务规划员任务',
    persona: '你是桌面机器人的任务规划员，负责把用户意图拆成可协调的角色步骤。',
    cardName: '任务规划员',
    defaultTopic: '用户要求机器人去主卧并递一个物品',
    defaultStyle: '可执行、可中断、先安全后动作',
    defaultInclude: '目标、前置确认、观察、导航、移动、操作、反馈',
  },
  poster: {
    heading: 'LED 表情员任务',
    persona: '你是桌面机器人的 LED 表情员，负责把机器人状态转换成灯效。',
    cardName: 'LED 表情员',
    defaultTopic: '为等待确认、执行中、成功、错误和安全停止设计灯效',
    defaultStyle: '清晰、克制、不打扰',
    defaultInclude: '颜色、闪烁节奏、触发状态、结束条件',
  },
  checker: {
    heading: '安全监督员任务',
    persona: '你是桌面机器人的安全监督员，负责审查移动和机械臂动作。',
    cardName: '安全监督员',
    defaultTopic: '检查去主卧和递物动作是否安全',
    defaultStyle: '保守、明确、必要时要求确认',
    defaultInclude: '允许/禁止、风险点、需要用户确认的问题、停止条件',
  },
  summarizer: {
    heading: '交互入口员任务',
    persona: '你是桌面机器人的交互入口员，负责接收用户输入并判断输入类型。',
    cardName: '用户意图',
    defaultTopic: '用户说：这里是主卧，之后把眼镜递给我',
    defaultStyle: '短句、结构化、可路由',
    defaultInclude: '输入类型、用户意图、环境声明、需要确认的字段',
  },
  questioner: {
    heading: '确认追问员任务',
    persona: '你是桌面机器人的确认追问员，负责在信息不足或动作有风险时向用户发起确认。',
    cardName: '确认请求',
    defaultTopic: '确认目标房间、目标物和是否允许机械臂靠近用户',
    defaultStyle: '一次只问关键问题',
    defaultInclude: '问题、默认安全动作、可接受回答',
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
    config.outputs.condition ? '房间或 POI 名称' : null,
    config.outputs.temperature ? '当前位置声明' : null,
    config.outputs.rain ? '物品位置' : null,
    config.outputs.wind ? '禁行区或通道提示' : null,
    config.outputs.airQuality ? '置信度或来源' : null,
  ].filter(Boolean);

  return [
    '# 家庭记忆员任务',
    '',
    '你是桌面机器人的家庭记忆员，负责维护家庭 POI、房间别名、禁行区和用户环境声明。',
    '',
    '任务：',
    '',
    `- 已知家庭线索：${config.city}。`,
    `- 记录时间范围：${config.date}。`,
    `- 家庭记忆员必须包含：${outputItems.join('、') || 'POI 和环境声明'}。`,
    '- 如果用户声明“这里是主卧”之类信息，请整理成可持久化 POI 记录。',
    '',
    '输出格式：',
    '',
    '家庭记忆员：<POI、房间别名、物品位置或待确认字段>',
  ].join('\n');
}

export function buildDresserTaskMarkdown(config: DresserRoleConfig): string {
  const outputItems = [
    config.outputs.top ? '目标物' : null,
    config.outputs.bottom ? '动作序列' : null,
    config.outputs.shoes ? '速度/力度约束' : null,
    config.outputs.accessories ? '停止条件' : null,
  ].filter(Boolean);

  return [
    '# 机械臂操作员任务',
    '',
    '你是桌面机器人的机械臂操作员，负责把取、放、推、递等动作拆成机械臂可执行步骤。',
    '',
    '任务：',
    '',
    `- 操作目标：${config.activity}。`,
    `- 操作约束：${config.style}。`,
    `- 机械臂操作员必须包含：${outputItems.join('、') || '动作、约束、停止条件'}。`,
    '- 如果缺少视觉事实或安全许可，请要求先确认，不要输出执行动作。',
    '',
    '输出格式：',
    '',
    '机械臂操作员：<机械臂动作、约束、停止条件或需要确认的问题>',
  ].join('\n');
}

export function buildTravelTaskMarkdown(config: TravelRoleConfig): string {
  const outputItems = [
    config.outputs.umbrella ? '路线段' : null,
    config.outputs.waterBottle ? '速度限制' : null,
    config.outputs.sunProtection ? '避障策略' : null,
    config.outputs.safety ? '停止条件' : null,
  ].filter(Boolean);

  return [
    '# 底盘驾驶员任务',
    '',
    '你是桌面机器人的底盘驾驶员，负责执行轮式底盘移动。',
    '',
    '任务：',
    '',
    `- 目标地点：${config.destination}。`,
    `- 移动方式：${config.transport}。`,
    `- 底盘驾驶员必须包含：${outputItems.join('、') || '动作序列、进度、停止条件'}。`,
    '- 如果缺少路线输入或安全许可，请停止并说明缺口。',
    '',
    '输出格式：',
    '',
    '底盘驾驶员：<底盘动作序列、进度、失败原因或停止条件>',
  ].join('\n');
}

export function buildCaptainTaskMarkdown(config: CaptainRoleConfig): string {
  const outputItems = [
    config.outputs.weatherSummary ? '确认问题' : null,
    config.outputs.clothingSummary ? '执行提醒' : null,
    config.outputs.travelSummary ? '结果反馈' : null,
    config.outputs.checklist ? '错误说明' : null,
  ].filter(Boolean);

  return [
    '# 语音播报员任务',
    '',
    '你是桌面机器人的语音播报员，负责把确认、提醒、错误和结果转成适合扬声器播放的短句。',
    '',
    '任务：',
    '',
    '- 重点读取确认请求、任务规划员、底盘驾驶员、机械臂操作员或状态诊断。',
    '- 输出一句到三句可直接朗读的话。',
    `- 面向${config.audience}播报。`,
    `- 语气要求：${config.tone}。`,
    `- 语音播报员必须包含：${outputItems.join('、') || '确认、提醒、结果'}。`,
    '- 对确认问题保持简短，一次只问关键问题。',
    '',
    '输出格式：',
    '',
    '语音播报员：<可朗读文本>',
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
    '- 如果收到上游角色输入，请优先参考上游角色输入；如果信息不够，请说清楚还需要什么。',
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
  const contains = parseContains(markdown, '家庭记忆员必须包含');

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
  const contains = parseContains(markdown, '机械臂操作员必须包含');
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
  const contains = parseContains(markdown, '底盘驾驶员必须包含');
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
