#!/usr/bin/env node

/**
 * Standalone CLI entry point: `npx lightory`
 *
 * Starts the Fastify server in standalone mode with SPA serving and WebSocket.
 * Loads all assets (PNGs -> SpriteData) on startup and caches in memory.
 * Each connecting WebSocket client receives the full state on webviewReady.
 */

import * as path from 'path';

import { AgentRuntime } from './agentRuntime.js';
import { AgentStateStore } from './agentStateStore.js';
import {
  loadCharacterSprites,
  loadDefaultLayout,
  loadFloorTiles,
  loadFurnitureAssets,
  loadPetSprites,
  loadWallTiles,
} from './assetLoader.js';
import type { AssetCache } from './clientMessageHandler.js';
import { FileStateAdapter } from './fileStateAdapter.js';
import {
  claudeProvider,
  codexProvider,
  copyCodexHookScript,
  copyHookScript,
  opencodeProvider,
} from './providers/index.js';
import { createRobotIntentPlanner } from './robotIntentPlanner.js';
import { createRoleTaskRunner } from './roleTaskRunner.js';
import { LightoryServer } from './server.js';

// ── Argument parsing ──────────────────────────────────────────

interface CliArgs {
  port: number;
  host: string;
  provider: 'opencode' | 'claude' | 'codex';
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { port: 3100, host: '127.0.0.1', provider: 'opencode' };
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--port' || argv[i] === '-p') && argv[i + 1]) {
      args.port = parseInt(argv[i + 1], 10);
      i++;
    } else if (argv[i] === '--host' && argv[i + 1]) {
      args.host = argv[i + 1];
      i++;
    } else if (argv[i] === '--provider' && argv[i + 1]) {
      const provider = argv[i + 1];
      if (provider !== 'opencode' && provider !== 'claude' && provider !== 'codex') {
        throw new Error(
          `Unsupported provider "${provider}". Use "opencode", "claude", or "codex".`,
        );
      }
      args.provider = provider;
      i++;
    } else if (argv[i] === '--help') {
      console.log(`Usage: lightory [options]

Options:
  --port, -p <number>   Port to listen on (default: 3100)
  --host <string>       Host to bind to (default: 127.0.0.1)
  --provider <name>      Agent provider: opencode, claude, or codex (default: opencode)
  --help                Show this help message`);
      process.exit(0);
    }
  }
  return args;
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const provider =
    args.provider === 'claude'
      ? claudeProvider
      : args.provider === 'codex'
        ? codexProvider
        : opencodeProvider;

  // dist/ contains both the CLI bundle and the assets/ + webview/ directories
  const distRoot = __dirname;
  const staticDir = path.join(distRoot, 'webview');
  const rolesDir = path.join(distRoot, 'roles');

  // ── Load assets on startup ──
  console.log('[Lightory] Loading assets...');
  const assetCache: AssetCache = {
    characters: await loadCharacterSprites(distRoot),
    pets: await loadPetSprites(distRoot),
    floorTiles: await loadFloorTiles(distRoot).then((t) => t?.sprites ?? null),
    wallTiles: await loadWallTiles(distRoot).then((t) => t?.sets ?? null),
    furniture: await loadFurnitureAssets(distRoot),
    defaultLayout: loadDefaultLayout(distRoot),
  };
  const charCount = assetCache.characters?.characters.length ?? 0;
  const petCount = assetCache.pets?.pets.length ?? 0;
  const furnitureCount = assetCache.furniture?.catalog.length ?? 0;
  console.log(
    `[Lightory] Assets loaded: ${charCount} characters, ${petCount} pets, ${furnitureCount} furniture items`,
  );

  // ── Store + adapter (shared settings + standalone-scoped agents/seats) ──
  const store = new AgentStateStore();
  const adapter = new FileStateAdapter();
  store.setAdapter(adapter);

  // ── Create server ──
  const server = new LightoryServer();

  try {
    // Create runtime first (before server.start, so we can pass it in)
    const runtime = new AgentRuntime(store, provider);

    // Wire hook events: HTTP POST -> runtime -> hookEventHandler -> agents
    server.onHookEvent((providerId, event) => {
      runtime.handleHookEvent(providerId, event);
    });

    // onSetHooksEnabled side effect: install/uninstall hooks when user toggles in UI.
    // Captures config from the outer scope after server.start().
    let currentConfig: { port: number; token: string } | null = null;
    const onSetHooksEnabled = async (enabled: boolean): Promise<void> => {
      if (!currentConfig) return;
      if (enabled) {
        await provider.installHooks(`http://127.0.0.1:${currentConfig.port}`, currentConfig.token);
        if (provider.id === 'claude') {
          copyHookScript(distRoot);
        } else if (provider.id === 'codex') {
          copyCodexHookScript(distRoot);
        }
        console.log('[Lightory] Hooks installed (user toggle)');
      } else {
        await provider.uninstallHooks();
        console.log('[Lightory] Hooks uninstalled (user toggle)');
      }
    };

    const config = await server.start({
      store,
      runtime,
      embedded: false,
      host: args.host,
      port: args.port,
      staticDir,
      assetCache,
      onSetHooksEnabled,
      onStartRoleTask: createRoleTaskRunner({
        provider,
        rolesDir,
        cwd: process.cwd(),
      }),
      onPlanRobotIntent: createRobotIntentPlanner({
        provider,
        cwd: process.cwd(),
      }),
    });
    currentConfig = { port: config.port, token: config.token };

    // Sync runtime refs with persisted settings BEFORE first scan tick
    runtime.hooksEnabled.current = adapter.getSetting('lightory.hooksEnabled', true);
    runtime.watchAllSessions.current = adapter.getSetting('lightory.watchAllSessions', false);

    // Install hooks on startup if the persisted setting says so
    if (runtime.hooksEnabled.current) {
      try {
        await provider.installHooks(`http://127.0.0.1:${config.port}`, config.token);
        if (provider.id === 'claude') {
          copyHookScript(distRoot);
        } else if (provider.id === 'codex') {
          copyCodexHookScript(distRoot);
        }
        console.log(`[Lightory] Hooks ready for ${provider.displayName}`);
      } catch (err) {
        console.error('[Lightory] Failed to install hooks:', err);
      }
    }

    // Start scanning for external sessions when the provider exposes transcript files.
    const cwd = process.cwd();
    const dirs = provider.getSessionDirs?.(cwd);
    if (dirs && dirs[0]) {
      const projectDir = dirs[0];
      console.log(`[Lightory] Scanning project dir: ${projectDir}`);
      runtime.startProjectScan(projectDir);
      runtime.startExternalScanning(projectDir);
      runtime.startStaleCheck();
    }

    console.log(
      `\n  Lightory server running at http://${args.host}:${config.port} (${provider.displayName})\n`,
    );

    // ── Graceful shutdown ──
    function shutdown(): void {
      console.log('\nShutting down...');
      runtime.dispose();
      server.stop();
      process.exit(0);
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
