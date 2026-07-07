# Mobile and Pad App Design

Mobile and pad should be built as independent clients over the Lightory
server protocol. They should not embed the desktop editor wholesale.

## Mobile

Primary jobs:

- see which OpenCode sessions are active
- answer permission prompts quickly
- inspect the current tool or error
- pause, resume, or dismiss an agent

Suggested navigation:

- Sessions
- Permissions
- Activity
- Settings

The pixel office can be a secondary detail view with pinch and pan. It should not
be the default screen on phones.

## Pad

Primary jobs:

- monitor multiple agents
- keep the office visible
- inspect one selected agent
- handle permissions without leaving the canvas

Suggested layout:

- office canvas as the main pane
- right-side collapsible inspector
- bottom permission tray

## Shared Protocol

Both apps should consume:

- `GET /api/health`
- `GET /ws`
- the existing client messages defined in `core/src/messages.ts`

Native apps should use token-based pairing before connecting to a non-localhost
server. LAN access should be opt-in.
