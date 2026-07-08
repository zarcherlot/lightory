import type { AgentRuntime } from './agentRuntime.js';
import type { AgentStateStore } from './agentStateStore.js';
import type { LoadedAssets, LoadedCharacterSprites, LoadedPetSprites } from './assetLoader.js';
import { readConfig, writeConfig } from './configPersistence.js';
import { readLayoutFromFile, writeLayoutToFile } from './layoutPersistence.js';
import { claudeProvider } from './providers/index.js';

type WsSend = (message: Record<string, unknown>) => void;
export interface RoleTaskInputCard {
  sourceRoleId: string;
  card: string;
  content: string;
}

export interface RoleTaskOverride {
  markdown: string;
}

/** Async hook toggle side effect (install/uninstall + script copy). Provided by cli.ts. */
export type SetHooksEnabledSideEffect = (enabled: boolean) => Promise<void> | void;
export type StartRoleTaskSideEffect = (
  roleId: string,
  send: WsSend,
  inputCards: RoleTaskInputCard[],
  taskOverride?: RoleTaskOverride,
) => Promise<void> | void;

/** Cached assets loaded at server startup. Sent to each WebSocket client on webviewReady. */
export interface AssetCache {
  characters: LoadedCharacterSprites | null;
  pets: LoadedPetSprites | null;
  floorTiles: string[][][] | null;
  wallTiles: string[][][][] | null;
  furniture: LoadedAssets | null;
  defaultLayout: Record<string, unknown> | null;
}

export interface ClientMessageContext {
  store: AgentStateStore;
  runtime?: AgentRuntime;
  cache: AssetCache | null;
  /** Install/uninstall hooks side effect. Needs server url+token known only to cli.ts. */
  onSetHooksEnabled?: SetHooksEnabledSideEffect;
  /** Launch a role markdown task and stream its output back to this client. */
  onStartRoleTask?: StartRoleTaskSideEffect;
}

// ── Setting key constants ──
const KEY_SOUND_ENABLED = 'lightory.soundEnabled';
const KEY_LAST_SEEN_VERSION = 'lightory.lastSeenVersion';
const KEY_ALWAYS_SHOW_LABELS = 'lightory.alwaysShowLabels';
const KEY_WATCH_ALL_SESSIONS = 'lightory.watchAllSessions';
const KEY_HOOKS_ENABLED = 'lightory.hooksEnabled';
const KEY_HOOKS_INFO_SHOWN = 'lightory.hooksInfoShown';

/**
 * Handle incoming ClientMessage from a WebSocket client.
 *
 * In standalone mode, the server is the authority for all state: assets,
 * layout, settings, agents. Assets are loaded once at startup and cached
 * in memory. Each connecting client receives the full state on webviewReady.
 */
export function handleClientMessage(
  msg: Record<string, unknown>,
  send: WsSend,
  ctx: ClientMessageContext,
): void {
  const { store, runtime } = ctx;
  const adapter = store.getAdapter();

  switch (msg.type) {
    case 'webviewReady':
      handleWebviewReady(send, ctx);
      break;

    case 'saveLayout':
      if (msg.layout) {
        writeLayoutToFile(msg.layout as Record<string, unknown>);
      }
      break;

    case 'saveAgentSeats':
      if (msg.seats) {
        adapter?.saveSeats(
          msg.seats as Record<string, { palette?: number; hueShift?: number; seatId?: string }>,
        );
      }
      break;

    case 'setSoundEnabled':
      adapter?.setSetting(KEY_SOUND_ENABLED, msg.enabled);
      break;

    case 'setLastSeenVersion':
      adapter?.setSetting(KEY_LAST_SEEN_VERSION, msg.version as string);
      break;

    case 'setAlwaysShowLabels':
      adapter?.setSetting(KEY_ALWAYS_SHOW_LABELS, msg.enabled);
      break;

    case 'setWatchAllSessions': {
      const enabled = msg.enabled as boolean;
      adapter?.setSetting(KEY_WATCH_ALL_SESSIONS, enabled);
      if (runtime) runtime.watchAllSessions.current = enabled;
      break;
    }

    case 'setHooksEnabled': {
      const enabled = msg.enabled as boolean;
      adapter?.setSetting(KEY_HOOKS_ENABLED, enabled);
      if (runtime) runtime.hooksEnabled.current = enabled;
      void ctx.onSetHooksEnabled?.(enabled);
      break;
    }

    case 'setHooksInfoShown':
      adapter?.setSetting(KEY_HOOKS_INFO_SHOWN, true);
      break;

    case 'startRoleTask': {
      const roleId = typeof msg.roleId === 'string' ? msg.roleId : '';
      if (roleId) {
        void ctx.onStartRoleTask?.(
          roleId,
          send,
          parseRoleTaskInputCards(msg.inputCards),
          parseRoleTaskOverride(msg.taskOverride),
        );
      }
      break;
    }

    case 'consoleUserInput': {
      const content = typeof msg.content === 'string' ? msg.content.trim() : '';
      const roleId =
        typeof msg.roleId === 'string' && msg.roleId.trim() ? msg.roleId.trim() : 'assistant';
      if (!content) break;
      const runId = `console-${Date.now().toString(36)}`;
      send({
        type: 'roleTaskConsole',
        runId,
        roleId,
        status: 'done',
        stream: 'system',
        content: `用户输入：${content}\n${buildConsoleReply(content)}\n`,
      });
      break;
    }

    case 'addExternalAssetDirectory': {
      const newPath = msg.path as string | undefined;
      if (!newPath) break;
      const cfg = readConfig();
      if (!cfg.externalAssetDirectories.includes(newPath)) {
        cfg.externalAssetDirectories.push(newPath);
        writeConfig(cfg);
      }
      send({ type: 'externalAssetDirectoriesUpdated', dirs: cfg.externalAssetDirectories });
      break;
    }

    case 'removeExternalAssetDirectory': {
      const removePath = msg.path as string | undefined;
      if (!removePath) break;
      const cfg = readConfig();
      cfg.externalAssetDirectories = cfg.externalAssetDirectories.filter((d) => d !== removePath);
      writeConfig(cfg);
      send({ type: 'externalAssetDirectoriesUpdated', dirs: cfg.externalAssetDirectories });
      break;
    }

    default:
      // focusAgent, exportLayout, importLayout
      // require IDE-specific handling (not yet implemented for standalone)
      break;
  }
}

function buildConsoleReply(content: string): string {
  const classification = classifyConsoleInput(content);
  const nextStep = suggestConsoleNextStep(content, classification.kind);
  return [`输入类型：${classification.label}。`, nextStep].join('\n');
}

function classifyConsoleInput(content: string): { kind: string; label: string } {
  if (/^(这里|这儿|当前|现在).{0,8}(是|在)/u.test(content) || /我是?在/u.test(content)) {
    return { kind: 'environment', label: '环境声明' };
  }
  if (/^(确认|可以|好的|是|对|同意|取消|不要|不行|停止|停)$/u.test(content)) {
    return { kind: 'confirmation', label: '确认回复' };
  }
  if (/(todo|待办|任务|作业|完成|做完|打卡|阅读|练字|数学|英语)/iu.test(content)) {
    return { kind: 'todo', label: '每日 TODO' };
  }
  if (/(新闻|摘抄|热点|时事|暑假|手抄)/u.test(content)) {
    return { kind: 'news', label: '新闻摘抄' };
  }
  return { kind: 'intent', label: '用户意图' };
}

function suggestConsoleNextStep(content: string, kind: string): string {
  switch (kind) {
    case 'environment':
      return '我先记下这个环境信息。下一步可以告诉我：这个位置常用来做什么，或者有哪些需要提醒的物品。';
    case 'confirmation':
      return /取消|不要|不行|停止|停/u.test(content)
        ? '收到，我会先暂停当前动作。你可以继续说“改成……”来调整任务。'
        : '收到确认。下一步我会继续执行当前任务，并在需要选择或完成确认时再问你。';
    case 'todo':
      if (/(完成|做完|打卡)/u.test(content)) {
        return '我把它当作完成反馈。下一步会更新今日进度，并给你一句个性化鼓励。';
      }
      return '我把它当作 TODO 输入。你可以继续补充截止时间，例如“晚上 8 点提醒我”，或说“完成阅读”来更新进度。';
    case 'news':
      return '我把它当作新闻摘抄任务。下面会在 console 里给出过滤后的候选新闻，你可以勾选要摘抄的新闻，再生成适合手抄长度的总结。';
    default:
      return '我会把这句话交给任务入口员拆解。你也可以直接说“新增 TODO：……”或“今天新闻摘抄”。';
  }
}

function parseRoleTaskInputCards(raw: unknown): RoleTaskInputCard[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): RoleTaskInputCard | null => {
      if (!item || typeof item !== 'object') return null;
      const card = item as Record<string, unknown>;
      if (
        typeof card.sourceRoleId !== 'string' ||
        typeof card.card !== 'string' ||
        typeof card.content !== 'string'
      ) {
        return null;
      }
      return {
        sourceRoleId: card.sourceRoleId,
        card: card.card,
        content: card.content,
      };
    })
    .filter((card): card is RoleTaskInputCard => card !== null);
}

function parseRoleTaskOverride(raw: unknown): RoleTaskOverride | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const override = raw as Record<string, unknown>;
  if (typeof override.markdown !== 'string') return undefined;
  const markdown = override.markdown.trim();
  if (!markdown) return undefined;
  return { markdown };
}

function handleWebviewReady(send: WsSend, ctx: ClientMessageContext): void {
  const { store, runtime, cache } = ctx;
  const adapter = store.getAdapter();

  // 1. Provider capabilities (must arrive before any agent messages)
  send({
    type: 'providerCapabilities',
    readingTools: [...claudeProvider.readingTools],
    subagentToolNames: [...claudeProvider.subagentToolNames],
  });

  // 2. Assets (from server cache, loaded at startup via pngjs)
  if (cache) {
    if (cache.characters) {
      send({ type: 'characterSpritesLoaded', characters: cache.characters.characters });
    }
    if (cache.pets) {
      send({
        type: 'petSpritesLoaded',
        pets: cache.pets.pets,
        petNames: cache.pets.manifests.map((m) => m.name),
      });
    }
    if (cache.floorTiles) {
      send({ type: 'floorTilesLoaded', sprites: cache.floorTiles });
    }
    if (cache.wallTiles) {
      send({ type: 'wallTilesLoaded', sets: cache.wallTiles });
    }
    if (cache.furniture) {
      send({
        type: 'furnitureAssetsLoaded',
        catalog: cache.furniture.catalog,
        sprites: Object.fromEntries(cache.furniture.sprites),
      });
    }
  }

  // 3. Layout (saved file, or bundled default)
  const savedLayout = readLayoutFromFile();
  send({ type: 'layoutLoaded', layout: savedLayout ?? cache?.defaultLayout ?? null });

  // 4. Settings (from adapter, with sensible defaults when adapter is absent)
  const cfg = readConfig();
  const watchAllSessions = adapter?.getSetting(KEY_WATCH_ALL_SESSIONS, false) ?? false;
  const hooksEnabled = adapter?.getSetting(KEY_HOOKS_ENABLED, true) ?? true;
  send({
    type: 'settingsLoaded',
    soundEnabled: adapter?.getSetting(KEY_SOUND_ENABLED, true) ?? true,
    lastSeenVersion: adapter?.getSetting(KEY_LAST_SEEN_VERSION, '') ?? '',
    extensionVersion: process.env.LIGHTORY_VERSION ?? '',
    watchAllSessions,
    alwaysShowLabels: adapter?.getSetting(KEY_ALWAYS_SHOW_LABELS, false) ?? false,
    hooksEnabled,
    hooksInfoShown: adapter?.getSetting(KEY_HOOKS_INFO_SHOWN, false) ?? false,
    externalAssetDirectories: cfg.externalAssetDirectories,
  });

  // Sync runtime refs with the persisted settings so scanners behave correctly
  // from the first tick after a server restart.
  if (runtime) {
    runtime.watchAllSessions.current = watchAllSessions;
    runtime.hooksEnabled.current = hooksEnabled;
  }

  // 5. Restore persisted external agents
  runtime?.restoreExternalAgents();

  // 6. Existing agents
  const agentIds: number[] = [];
  const folderNames: Record<number, string> = {};
  const externalAgents: Record<number, boolean> = {};
  for (const [id, agent] of store) {
    agentIds.push(id);
    if (agent.folderName) {
      folderNames[id] = agent.folderName;
    }
    if (agent.isExternal) {
      externalAgents[id] = true;
    }
  }
  const seats = adapter?.loadSeats() ?? {};
  send({
    type: 'existingAgents',
    agents: agentIds,
    agentMeta: seats,
    folderNames,
    externalAgents,
  });
}
