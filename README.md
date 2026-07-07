<h1 align="center">
    <a href="https://github.com/pixel-agents-hq/pixel-agents/discussions">
        <img src="webview-ui/public/banner.png" alt="Pixel Agents">
    </a>
</h1>

<h2 align="center" style="padding-bottom: 20px;">
  Lightory: Pixel Agents for OpenCode and Codex
</h2>

<div align="center" style="margin-top: 25px;">

[![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Fversion.json)](https://github.com/pixel-agents-hq/pixel-agents/releases)
[![stars](https://img.shields.io/github/stars/pixel-agents-hq/pixel-agents?logo=github&color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/stargazers)
[![license](https://img.shields.io/github/license/pixel-agents-hq/pixel-agents?color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/blob/main/LICENSE)
[![good first issues](https://img.shields.io/github/issues/pixel-agents-hq/pixel-agents/good%20first%20issue?color=7057ff&label=good%20first%20issues)](https://github.com/pixel-agents-hq/pixel-agents/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)

</div>

<br/>

## Lightory OpenCode and Codex Fork

Lightory is an OpenCode- and Codex-focused fork of Pixel Agents. It turns AI
coding sessions into something you can see and manage: each agent becomes a
character in a pixel art office, with live status for tool use, permissions, and
idle/waiting states.

This fork now targets one interaction surface: the local browser Web UI.

- **Browser Web UI** - `node dist/cli.js --provider opencode` or
  `node dist/cli.js --provider codex` starts a local Fastify server and serves
  the office at `http://127.0.0.1:3100`.
- **Role markdown tasks** - drag a role into the scene to execute its matching
  file in `roles/*.md`; stdout/stderr stream into the console panel at the
  bottom of the page.
- **OpenCode plugin hooks** - `.opencode/plugins/pixel-agents-opencode.ts`
  forwards OpenCode session, tool, permission, and idle events into the local
  server.
- **Codex CLI hooks** - Lightory installs Codex lifecycle hooks into
  `~/.codex/config.toml`, copies `codex-hook.js` into
  `~/.pixel-agents/hooks/`, and forwards Codex session/tool/permission/turn
  events into the local server.
- **Desktop shell-ready** - `desktop-shell/contract.ts` reserves the
  process/WebView boundary for a future Tauri or Electron wrapper.

VS Code extension, IDE WebView, and TUI usage are intentionally out of scope for
this version. Mobile and pad apps are treated as separate product surfaces; see
[docs/mobile-pad-app-design.md](docs/mobile-pad-app-design.md).

## Upstream

This project is based on
[pixel-agents-hq/pixel-agents](https://github.com/pixel-agents-hq/pixel-agents).
The original project focuses on Claude Code and VS Code extension workflows.
This fork keeps the shared server/webview architecture and uses the browser SPA
as the only user-facing surface.

Internally, the architecture is fully agent-agnostic and platform-agnostic: a typed `HookProvider` interface defines the integration boundary so adding a new AI tool is a single subdirectory of code. Claude Code, OpenCode, and Codex are supported today; Gemini, Cursor, and others can be added through the same provider boundary.

![Pixel Agents screenshot](webview-ui/public/Screenshot.jpg)

## Features

- **One agent, one character** — every detected agent gets its own animated character
- **Drag-to-run roles** — role cards execute their matching markdown task and
  stream results into the browser console panel
- **Live activity tracking** — characters animate based on what the agent is actually doing (writing, reading, running commands)
- **Office layout editor** — design your office with floors, walls, and furniture using a built-in editor
- **Speech bubbles** — visual indicators when an agent is waiting for input or needs permission
- **Sound notifications** — optional chime when an agent finishes its turn
- **Sub-agent visualization** — Task tool sub-agents spawn as separate characters linked to their parent
- **Persistent layouts** — your office design is saved for the browser app
- **External asset directories** — load custom or third-party furniture packs from any folder on your machine
- **Diverse characters** — 6 diverse characters. These are based on the amazing work of [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).

<p align="center">
  <img src="webview-ui/public/characters.png" alt="Pixel Agents characters" width="320" height="72" style="image-rendering: pixelated;">
</p>

## Requirements

- Node.js and npm
- [OpenCode](https://opencode.ai/) installed and configured for OpenCode sessions
- Codex installed and configured for Codex sessions
- **Platform**: Windows, Linux, and macOS are supported

## Getting Started

### OpenCode standalone

```bash
git clone https://github.com/zarcherlot/lightory.git
cd lightory
npm install
npm run build
node dist/cli.js --provider opencode --port 3100
```

Open `http://127.0.0.1:3100`.

For sessions launched inside this repository, OpenCode automatically loads the
project plugin at `.opencode/plugins/pixel-agents-opencode.ts`. For global use,
copy or symlink that plugin into your global OpenCode plugin directory.

### Codex standalone

```bash
git clone https://github.com/zarcherlot/lightory.git
cd lightory
npm install
npm run build
node dist/cli.js --provider codex --port 3100
```

Open `http://127.0.0.1:3100`.

The Codex provider is hooks-only. When the server starts, it installs a managed
block into `~/.codex/config.toml` and copies the hook script to
`~/.pixel-agents/hooks/codex-hook.js`. Codex will ask you to review/trust the new
hooks the next time it starts in an interactive session. For automation that has
already vetted the hooks, Codex also supports `--dangerously-bypass-hook-trust`.

The installed hook script forwards events to:

```text
POST http://127.0.0.1:3100/api/hooks/codex
Authorization: Bearer <token from ~/.pixel-agents/server.json>
```

The provider accepts Codex CLI hook payloads such as `SessionStart`,
`PreToolUse`, `PostToolUse`, `PermissionRequest`, and `Stop`. Use
`server/manual-hook-events.http` for manual request examples.

### Development from source

```bash
git clone https://github.com/zarcherlot/lightory.git
cd lightory
npm install      # npm workspaces installs root + server + webview-ui in one shot
npm run build
```

To try the browser app locally:

```bash
node dist/cli.js --provider opencode --port 3100
# or
node dist/cli.js --provider codex --port 3100
```

It starts the Fastify server and serves the webview SPA at
`http://127.0.0.1:3100`. Server discovery for hooks is written to
`~/.pixel-agents/server.json`.

### Browser Preview & Hosted Reports

The browser-preview version of the webview can be built and staged for Vercel.

```bash
npm run test
npm run e2e
npm run e2e -- --attach-videos-on-success
npm run vercel:prepare
```

Run `npm run test:report` separately when you want the combined Allure report locally without preparing the full Vercel output.

The staged Vercel output serves the standalone webview at `/webview/` and the Linux Allure report at `/reports/allure/`, combining the `e2e`, `server`, and `webview` suites. The GitHub Actions deploy job expects `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets.

### Usage

1. Start `node dist/cli.js --provider opencode --port 3100` or `node dist/cli.js --provider codex --port 3100`.
2. Open `http://127.0.0.1:3100` in a browser.
3. Drag a role card into the scene. The server launches the matching `roles/*.md` task through the selected provider.
4. Watch stdout/stderr in the console panel at the bottom of the page.
5. Click **Layout** to open the office editor and customize your space.

## Layout Editor

The built-in editor lets you design your office:

- **Floor** — Full HSB color control
- **Walls** — Auto-tiling walls with color customization
- **Tools** — Select, paint, erase, place, eyedropper, pick
- **Undo/Redo** — 50 levels with Ctrl+Z / Ctrl+Y
- **Export/Import** — Share layouts as JSON files via the Settings modal

The grid is expandable up to 64×64 tiles. Click the ghost border outside the current grid to grow it.

### Office Assets

All office assets (furniture, floors, walls) are now **fully open-source** and included in this repository under `webview-ui/public/assets/`. No external purchases or imports are needed — everything works out of the box.

Each furniture item lives in its own folder under `assets/furniture/` with a `manifest.json` that declares its sprites, rotation groups, state groups (on/off), and animation frames. Floor tiles are individual PNGs in `assets/floors/`, and wall tile sets are in `assets/walls/`. This modular structure makes it easy to add, remove, or modify assets without touching any code.

To add a new furniture item, create a folder in `webview-ui/public/assets/furniture/` with your PNG sprite(s) and a `manifest.json`, then rebuild. The asset manager (`scripts/asset-manager.html`) provides a visual editor for creating and editing manifests.

To use furniture from an external directory, open Settings → **Add Asset Directory**. See [docs/external-assets.md](docs/external-assets.md) for the full manifest format and how to use third-party asset packs.

Characters are based on the amazing work of [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).

## How It Works

Pixel Agents has provider-specific detection paths:

- **OpenCode hooks-only mode** - OpenCode plugin hooks POST events
  (`session.created`, `tool.execute.before`, `tool.execute.after`,
  `permission.asked`, `session.idle`, and related events) to
  `POST /api/hooks/opencode`. No transcript file is required.

- **Codex hooks-only mode** - Codex lifecycle hooks installed in
  `~/.codex/config.toml` run `~/.pixel-agents/hooks/codex-hook.js`, which POSTs
  to `POST /api/hooks/codex`. The provider normalizes Codex CLI events such as
  `SessionStart`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, and `Stop`
  into the same canonical `AgentEvent` stream. No transcript polling is required.

- **Claude hooks mode** - Claude Code's Hooks API can POST events
  (`SessionStart`, `PreToolUse`, `Notification`, `Stop`, etc.) to the local
  Fastify server (`POST /api/hooks/:providerId`). Server discovery uses
  `~/.pixel-agents/server.json`.
- **Claude heuristic mode** - Polls JSONL transcript files at
  `~/.claude/projects/<project-hash>/<session-id>.jsonl` when hooks are not
  installed.

A single `HookProvider.normalizeHookEvent(raw)` translates each CLI's hook payload into a canonical `AgentEvent`. The shared `AgentRuntime` dispatches on `AgentEvent.kind`, mutates `AgentStateStore`, and the broadcast layer translates state events into typed `ServerMessage` over the active transport.

The webview runs a lightweight game loop with canvas rendering, BFS pathfinding, and a character state machine (idle → walk → type/read). Everything is pixel-perfect at integer zoom levels. Game state lives in an imperative `OfficeState` class outside React; React components read from it during render but don't own the state.

For role markdown tasks, the browser sends `startRoleTask` over WebSocket. The
server reads `roles/<role>.md`, starts the configured provider CLI, and streams
process output back as `roleTaskConsole` messages.

## Tech Stack

Four-package monorepo, npm workspaces:

- **`core/`** — TypeScript-only protocol + interfaces (AsyncAPI 3.0 contract, `HookProvider`, `MessageTransport`, `StateAdapter`). Zero runtime side effects.
- **`server/`** — Fastify v5 (HTTP + WebSocket), Vitest. Owns `AgentRuntime`, `AgentStateStore`, `SessionRouter`, `DismissalTracker`, file watching, transcript parsing, providers. Ships the standalone CLI.
- **`.opencode/plugins/`** - Project-level OpenCode plugin that forwards
  OpenCode lifecycle events to the local server.
- **`server/src/providers/hook/codex/`** - Codex hooks provider that adapts
  Codex-shaped events to the shared `HookProvider` boundary.
- **`desktop-shell/`** - Reserved interface for a future native WebView shell.
- **`webview-ui/`** — React 19, Vite, Canvas 2D. Uses WebSocket transport in the browser.

Builds: esbuild (CLI + hook scripts), Vite (webview SPA). Tests: Vitest
(server + webview unit), Playwright (e2e against standalone Fastify).

## Known Limitations

- **Provider command availability** - role markdown tasks use the selected CLI
  (`opencode run`, `codex exec`, or `claude`) from the server process PATH.
- **Heuristic-based status detection** - Claude Code's JSONL transcript format
  does not provide clear signals for every waiting or completion state. Hook
  providers are more reliable than transcript polling.
- **Working directory** - role tasks run from the directory where
  `node dist/cli.js` was started.

## Troubleshooting

If your agent appears stuck on idle or doesn't spawn:

1. **Debug View** - In the browser, open Settings and toggle **Debug View**.
   This shows connection diagnostics per agent: JSONL file status, lines parsed,
   last data timestamp, and file path.
2. **Server logs** - Check the terminal running `node dist/cli.js`. Search for
   `[Pixel Agents]` to see hook delivery, project directory resolution, JSONL
   polling status, path encoding mismatches, and unrecognized JSONL record
   types.
3. **Role task console** - If a dragged role does not run, the page-bottom
   console shows missing CLI commands, missing markdown files, stderr, and exit
   codes.

## Where This Is Going

The long-term vision is an interface where managing AI agents feels like playing the Sims, but the results are real things built.

- **Agents as characters** you can see, assign, monitor, and redirect, each with visible roles (designer, coder, writer, reviewer), stats, context usage, and tools.
- **Desks as directories** — drag an agent to a desk to assign it to a project or working directory.
- **An office as a project** — with a Kanban board on the wall where idle agents can pick up tasks autonomously.
- **Deep inspection** — click any agent to see its model, branch, system prompt, and full work history. Interrupt it, chat with it, or redirect it.
- **Token health bars** — rate limits and context windows visualized as in-game stats.
- **Fully customizable** — upload your own character sprites, themes, and office assets. Eventually maybe even move beyond pixel art into 3D or VR.

For this to work, the architecture needs to be modular at every level:

- **Platform-agnostic**: browser app today, native WebView shell or any other
  host environment tomorrow.
- **Agent-agnostic**: Claude Code today, but built to support Codex, OpenCode, Gemini, Cursor, Copilot, and others through composable adapters.
- **Theme-agnostic**: community-created assets, skins, and themes from any contributor.

We're actively working on the core module and adapter architecture that makes this possible. If you're interested to talk about this further, please visit our [Discussions Section](https://github.com/pixel-agents-hq/pixel-agents/discussions).

## Community & Contributing

Use **[Issues](https://github.com/pixel-agents-hq/pixel-agents/issues)** to report bugs or request features. Join **[Discussions](https://github.com/pixel-agents-hq/pixel-agents/discussions)** for questions and conversations.

See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on how to contribute.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Supporting the Project

If you find Pixel Agents useful, consider supporting its development:

<a href="https://github.com/sponsors/pablodelucca">
  <img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github" alt="GitHub Sponsors">
</a>
<a href="https://ko-fi.com/pablodelucca">
  <img src="https://img.shields.io/badge/Support-Ko--fi-ff5e5b?logo=ko-fi" alt="Ko-fi">
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=pixel-agents-hq/pixel-agents&type=Date)](https://www.star-history.com/?repos=pixel-agents-hq%2Fpixel-agents&type=date&legend=bottom-right)

## License

This project is licensed under the [MIT License](LICENSE).
