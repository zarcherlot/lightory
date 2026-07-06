# OpenCode Web and Desktop Plan

## Scope

This branch targets:

- OpenCode hook integration
- standalone local server
- browser Web UI
- a reserved desktop shell boundary

It intentionally excludes IDE WebView and TUI surfaces.

## Data Flow

```text
OpenCode plugin hook
  -> POST /api/hooks/opencode
  -> opencodeProvider.normalizeHookEvent()
  -> AgentRuntime / HookEventHandler
  -> AgentStateStore broadcast
  -> /ws
  -> React browser UI
```

OpenCode is treated as a hooks-only provider. It does not need a transcript file
to create an agent. The first confirmed session event creates a hooks-only agent,
then tool, permission, and idle events drive the animation state.

## Running

```bash
npm install
npm run build:webview
npm run build:extension
node dist/cli.js --provider opencode --port 3100
```

Then open:

```text
http://127.0.0.1:3100
```

For OpenCode sessions launched from this repository, the project-level plugin at
`.opencode/plugins/pixel-agents-opencode.ts` sends events to the running server.
For global usage, copy or symlink that plugin into the user's global OpenCode
plugin directory.

## Desktop Shell

The desktop app should be a thin shell over the same URL. It should not fork the
UI or agent runtime. The shell contract lives in `desktop-shell/contract.ts`.

Preferred first implementation:

1. bundle the built server and Web UI
2. start `node dist/cli.js --provider opencode --port 0`
3. read `~/.pixel-agents/server.json`
4. load the local URL in a native WebView

## Mobile and Pad Apps

Mobile and pad are separate product designs, not responsive copies of the
desktop office editor. They should share the same server protocol but use their
own app shells and navigation model.

Recommended surfaces:

- mobile: session list, live status, permission queue, compact event timeline
- pad: office view plus collapsible detail panel
- both: no layout editor in the first release
