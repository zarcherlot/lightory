# Lightory

Lightory is an agent-education web app for children. It helps learners design a small team of agent roles, connect their abilities visually, and run the team to observe how information moves from one role to another.

The current MVP focuses on one learning scenario:

> 明天去学校 / 公园，需要准备什么？

## Product Goal

Lightory turns abstract agent concepts into a concrete visual workflow:

- An agent is a role with a specific ability.
- A role can output a card.
- Cards can be passed to other roles.
- A complex task can be solved by multiple roles working together.
- Children can build the workflow with drag-and-drop instead of editing a DAG, workflow file, or console command.

## Current Experience

### Edit Mode

Edit mode is for designing the agent team.

- Drag roles into the scene.
- Each role shows ability cards above its head.
- Drag an ability card to another role to create a collaboration link.
- Valid target roles highlight while dragging.
- Successful links show a curved arrow with the card type.
- Invalid drops show a short explanation.

Implemented MVP roles:

- 天气预报员: outputs `天气卡`
- 穿衣建议员: receives `天气卡`, outputs `穿衣卡`
- 出行提醒员: receives `天气卡`, outputs `出行卡`
- 小队队长: receives `穿衣卡` and `出行卡`, outputs `准备清单`

### Play Mode

Play mode is for running the team.

- Ability cards are hidden.
- Role activity icons appear above characters.
- The `运行小队` button starts execution.
- Execution follows the links built in Edit mode.
- Upstream roles must complete before dependent roles run.
- If an upstream role fails, it is retried before downstream roles are allowed to run.

Current dependency behavior:

```text
天气预报员 -> 穿衣建议员 -> 小队队长
天气预报员 -> 出行提醒员 -> 小队队长
```

## Project Structure

```text
core/          Shared message contracts and transport types
server/        Local HTTP/WebSocket server and role task runner
webview-ui/    React + Vite browser app and canvas scene
roles/         Markdown task prompts for education roles
docs/          Product and UX planning documents
scripts/       Build and development utilities
```

Important files:

- `docs/agent-education-ux-requirements.md` - product UX requirements
- `webview-ui/src/components/EducationModeOverlay.tsx` - education workflow overlay
- `webview-ui/src/roles.ts` - role definitions, ability cards, and icon slots
- `server/src/roleTaskRunner.ts` - role markdown task execution
- `roles/*.md` - role prompt files

## Requirements

- Node.js
- npm
- A supported local AI CLI provider if you want markdown role tasks to execute through a real model

## Setup

```bash
npm install
npm run build
```

## Run Locally

Start the local server:

```bash
node dist/cli.js --provider codex --port 3100
```

Open:

```text
http://127.0.0.1:3100
```

For frontend-only development:

```bash
cd webview-ui
npm run dev
```

Open:

```text
http://localhost:5173
```

## Development Commands

```bash
npm run build          # full build
npm run build:server   # build server/CLI bundle
npm run build:webview  # build browser app
npm run check-types    # TypeScript checks
npm run lint           # lint server/core/webview
npm test               # unit tests
```

## Role Tasks

Each education role has a markdown task file:

```text
roles/weather.md
roles/dresser.md
roles/travel.md
roles/captain.md
```

When Play mode runs, the browser sends role execution requests to the server. The server reads the matching markdown file, runs it through the configured provider, and streams output back to the console panel.

The runner treats obvious role-level failures such as `查询失败`, `无法联网`, and `无法获取` as task errors so dependent roles do not run from bad upstream data.

## Current MVP Status

Implemented:

- Edit mode and Play mode
- Education role dock
- Ability cards above roles
- Drag-to-connect ability cards
- Valid/invalid drop feedback
- Persistent curved connection arrows
- Link-aware Play execution order
- Retry and stop behavior for failed upstream roles
- Role-specific activity icon slots

Next likely work:

- Replace MVP canvas-drawn icons with final visual assets
- Add role configuration panels
- Distinguish ability cards and result cards more clearly in Play mode
- Animate result cards moving between roles
- Persist saved connections across reloads
- Add child-friendly completion, error, and replay states

## License

MIT
