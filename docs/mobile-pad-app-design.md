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

## Android Pad Packaging Config

Android Pad MVP can ship as a WebView wrapper around the built `webview-ui`
bundle, with a small native layer for device discovery, secure credential
storage, certificate pinning, and media/network permissions.

Required project configuration:

- Android package id, app name, launcher icon, adaptive icon, versionCode, and
  versionName.
- Minimum SDK and target SDK. Recommended minimum SDK is 26+ unless hardware
  vendor SDKs require otherwise.
- Landscape and large-screen support in the main Activity, with resizeable
  activity enabled for tablets and foldables.
- WebView settings: JavaScript enabled, DOM storage enabled, file access locked
  down, mixed content disabled, and remote debugging enabled only in debug
  builds.
- Static asset loading for the Vite build output, usually from
  `android_asset/www` or an equivalent app-internal directory.
- HTTPS/WSS allowlist for Robot API endpoints. Debug builds may allow local LAN
  hosts; release builds should require HTTPS/WSS and certificate/public-key
  pinning.
- Android Network Security Config for debug-only cleartext LAN testing if
  needed. Release config should disable cleartext traffic.
- Permissions: `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, and
  Android 13+ nearby Wi-Fi permissions if using local robot discovery.
- mDNS/NSD discovery configuration for `_robotapi._tcp.local` if the app needs
  robot discovery instead of manual base URL entry.
- Secure storage for pairing credentials and robot tokens using Android
  Keystore-backed storage.
- Camera permission only if QR pairing is implemented. Microphone permission
  only if voice input or WebRTC uplink is implemented.
- Foreground service configuration only if the app must keep a control session
  visible/active while backgrounded. Robot safety must not depend on this.
- ProGuard/R8 keep rules for the WebView bridge, QR scanner, WebRTC, or vendor
  SDK classes used by the native shell.
- Release signing config, Play/App Center distribution tracks, and CI secrets
  for keystore passwords.

Runtime bridge responsibilities:

- Expose pairing result, secure token read/write, certificate fingerprint, and
  LAN discovery results to the WebView through a narrow typed bridge.
- Keep arbitrary shell/file/network capabilities out of the bridge.
- Forward app lifecycle changes to the WebView so the client can reconnect and
  query final plan/video state after resume.
- Let the Robot API watchdog and executor own motion safety if the Pad app is
  paused, killed, or disconnected.
