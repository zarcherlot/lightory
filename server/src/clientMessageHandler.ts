import type { AgentRuntime } from './agentRuntime.js';
import type { AgentStateStore } from './agentStateStore.js';
import type { LoadedAssets, LoadedCharacterSprites, LoadedPetSprites } from './assetLoader.js';
import { readConfig, writeConfig } from './configPersistence.js';
import { readLayoutFromFile, writeLayoutToFile } from './layoutPersistence.js';
import { claudeProvider } from './providers/index.js';
import type {
  RaceConversationRouteDecision,
} from './teachingScenes/fourPointRace/conversationRouter.js';
import type { RaceTutorTurnResult } from './teachingScenes/fourPointRace/schemas.js';

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
export type PlanRobotIntentSideEffect = (request: {
  requestId: string;
  content: string;
  tools: Array<Record<string, unknown>>;
}) => Promise<{ ok: true; intent: Record<string, unknown> } | { ok: false; error: string }>;
export type RaceTutorTurnSideEffect = (request: {
  requestId: string;
  sessionId: string;
  content: string;
  knownFacts?: Record<string, unknown>;
}) => Promise<RaceTutorTurnResult>;
export type RaceConversationRouteSideEffect = (request: {
  requestId: string;
  content: string;
  raceSessionActive?: boolean;
  knownFacts?: Record<string, unknown>;
}) => Promise<RaceConversationRouteDecision>;

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
  /** Convert free-form robot commands into a restricted RobotIntent object. */
  onPlanRobotIntent?: PlanRobotIntentSideEffect;
  /** Semantically route console input between the race tutor and robot planning. */
  onRaceConversationRoute?: RaceConversationRouteSideEffect;
  /** Advance the four-point race AI tutor conversation. */
  onRaceTutorTurn?: RaceTutorTurnSideEffect;
}

// Setting key constants
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
        typeof msg.roleId === 'string' && msg.roleId.trim() ? msg.roleId.trim() : 'user';
      if (!content) break;
      const runId = `console-${Date.now().toString(36)}`;
      send({
        type: 'roleTaskConsole',
        runId,
        roleId,
        status: 'done',
        stream: 'system',
        content,
      });
      break;
    }

    case 'planRobotIntent': {
      const requestId = typeof msg.requestId === 'string' ? msg.requestId : '';
      const content = typeof msg.content === 'string' ? msg.content.trim() : '';
      const tools = Array.isArray(msg.tools)
        ? (msg.tools.filter((tool) => tool && typeof tool === 'object') as Array<
            Record<string, unknown>
          >)
        : [];
      if (!requestId || !content) break;
      void (async () => {
        try {
          const result = await ctx.onPlanRobotIntent?.({ requestId, content, tools });
          if (!result) {
            send({
              type: 'robotIntentPlanResult',
              requestId,
              ok: false,
              error: 'Robot intent planner is unavailable.',
            });
            return;
          }
          send({
            type: 'robotIntentPlanResult',
            requestId,
            ok: result.ok,
            intent: result.ok ? result.intent : undefined,
            error: result.ok ? undefined : result.error,
          });
        } catch (error) {
          send({
            type: 'robotIntentPlanResult',
            requestId,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
      break;
    }

    case 'raceConversationRouteInput': {
      const requestId = typeof msg.requestId === 'string' ? msg.requestId : '';
      const content = typeof msg.content === 'string' ? msg.content.trim() : '';
      const raceSessionActive = msg.raceSessionActive === true;
      const knownFacts =
        msg.knownFacts && typeof msg.knownFacts === 'object' && !Array.isArray(msg.knownFacts)
          ? (msg.knownFacts as Record<string, unknown>)
          : undefined;
      if (!requestId || !content) break;
      void (async () => {
        try {
          const result = await ctx.onRaceConversationRoute?.({
            requestId,
            content,
            raceSessionActive,
            knownFacts,
          });
          if (!result) {
            send({
              type: 'raceConversationRouteResult',
              requestId,
              ok: false,
              error: 'Race conversation router is unavailable.',
            });
            return;
          }
          send({
            type: 'raceConversationRouteResult',
            requestId,
            ok: true,
            speakerRole: result.speakerRole,
            route: result.route,
            confidence: result.confidence,
            reason: result.reason,
          });
        } catch (error) {
          send({
            type: 'raceConversationRouteResult',
            requestId,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
      break;
    }

    case 'raceTutorInput': {
      const requestId = typeof msg.requestId === 'string' ? msg.requestId : '';
      const sessionId =
        typeof msg.sessionId === 'string' && msg.sessionId.trim()
          ? msg.sessionId.trim()
          : 'default-race-session';
      const content = typeof msg.content === 'string' ? msg.content.trim() : '';
      const knownFacts =
        msg.knownFacts && typeof msg.knownFacts === 'object' && !Array.isArray(msg.knownFacts)
          ? (msg.knownFacts as Record<string, unknown>)
          : undefined;
      if (!requestId || !content) break;
      void (async () => {
        try {
          const result = await ctx.onRaceTutorTurn?.({ requestId, sessionId, content, knownFacts });
          if (!result) {
            send({
              type: 'raceTutorOutput',
              requestId,
              ok: false,
              sessionId,
              error: 'Race tutor is unavailable.',
            });
            return;
          }
          send({
            type: 'raceTutorOutput',
            requestId,
            ok: true,
            sessionId,
            publicReply: result.publicReply,
            expertReplies: result.expertReplies,
            suggestedRobotAction: result.suggestedRobotAction,
            raceDraftPatch: result.raceDraftPatch,
          });
        } catch (error) {
          send({
            type: 'raceTutorOutput',
            requestId,
            ok: false,
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
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
