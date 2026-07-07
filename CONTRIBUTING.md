# Contributing to Lightory

Thanks for helping improve Lightory.

Lightory is an independent project hosted at:

```text
https://github.com/zarcherlot/lightory
```

## Setup

```bash
git clone https://github.com/zarcherlot/lightory.git
cd lightory
npm install
npm run build
```

## Run Locally

```bash
node dist/cli.js --provider codex --port 3100
```

Open `http://127.0.0.1:3100`.

For frontend-only work:

```bash
cd webview-ui
npm run dev
```

## Project Structure

```text
core/          Shared protocol and provider interfaces
server/        Local HTTP/WebSocket server, hooks, and role task runner
webview-ui/    React + Vite browser app and canvas scene
roles/         Markdown task prompts for education roles
docs/          Product and UX notes
scripts/       Build and test utilities
```

## Local State

Lightory writes local runtime state under:

```text
~/.lightory/
```

The hook discovery file is:

```text
~/.lightory/server.json
```

Do not add new code that writes to `~/.pixel-agents` or links users to the old upstream project.

## Checks

Before opening a pull request, run the checks that match your change:

```bash
npm run check-types
npm run lint
npm test
npm run build
```

For protocol changes, also run:

```bash
npm run asyncapi:generate
```

For e2e changes:

```bash
npm run e2e
```

## Pull Requests

- Target the Lightory repository, not the upstream Pixel Agents repository.
- Use a clear PR title and describe why the change is needed.
- Include screenshots or recordings for UI changes.
- List the commands you used to verify the change.

## Security

Report security vulnerabilities privately through GitHub security advisories for `zarcherlot/lightory`. Do not open public issues for security reports.
