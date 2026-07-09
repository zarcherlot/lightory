# Android Pad Development Plan

## Goal

Build an Android Pad MVP as a native WebView shell around the existing
`webview-ui` bundle. The native shell owns Android-only capabilities: secure
credential storage, pairing/discovery, lifecycle forwarding, network security,
and release packaging. Robot motion safety remains on the Robot API side.

## Scope

### Phase A: WebView Shell

- Create `android-pad/` Android project.
- Load static files from `app/src/main/assets/www`.
- Provide a narrow JavaScript bridge under `window.LightoryAndroid`.
- Enable JavaScript and DOM storage.
- Disable mixed content and broad file access.
- Lock orientation to landscape for Pad MVP.
- Add debug-only WebView debugging.
- Add Android network security config with debug LAN allowance.

Acceptance:

- Android project imports in Android Studio.
- App opens the bundled Lightory web UI from local assets.
- WebView can call bridge methods for app info and lifecycle.
- Release build does not allow cleartext traffic by default.

### Phase B: Web Asset Sync

- Build `webview-ui`.
- Copy `dist/webview` into `android-pad/app/src/main/assets/www`.
- Add a repeatable script for local and CI builds.

Acceptance:

- One command refreshes Android static assets after web changes.
- Android assets contain `index.html` and built JS/CSS chunks.

### Phase C: Secure Robot Config

- Replace production Robot credentials stored in `localStorage` with native
  secure storage.
- Use Android Keystore-backed storage for token and certificate fingerprint.
- Expose typed bridge calls:
  - `getRobotCredential()`
  - `saveRobotCredential(payload)`
  - `clearRobotCredential()`

Acceptance:

- Robot token survives app restart.
- Token is not stored in WebView localStorage for release builds.
- Bridge validates JSON shape before accepting writes.

### Phase D: Discovery And Pairing

- Implement NSD/mDNS discovery for `_robotapi._tcp.local`.
- Implement QR pairing payload parsing.
- Call Robot API pairing endpoint from native or a constrained bridge-backed
  client.
- Store returned credential in secure storage.

Acceptance:

- User can discover a LAN robot or scan a QR code.
- App connects using the saved credential without retyping base URL/token.
- Pairing failures are surfaced to the Web UI.

### Phase E: Lifecycle And Reconnect

- Forward Android `onResume`, `onPause`, and `onDestroy` events to WebView.
- Web runtime queries active plan/video state after resume.
- App backgrounding never keeps robot motion safe by itself.

Acceptance:

- Resume triggers Robot API health/plan/video refresh.
- Losing the app process does not leave the robot dependent on the Pad.

### Phase F: Video

- MVP: show stream metadata in console.
- Next: use WebView WebRTC if stable.
- Fallback: native player bridge for WebRTC/HLS/MJPEG if WebView playback is
  unreliable on target tablets.

Acceptance:

- `video/start`, `video/state`, and `video/stop` remain functional.
- Selected playback path is tested on target Android Pad hardware.

### Phase G: Release Packaging

- Configure signing, app versioning, R8/ProGuard rules, and CI artifacts.
- Keep debug-only cleartext LAN testing out of release builds.
- Add distribution track or direct APK/AAB artifact flow.

Acceptance:

- Signed release APK/AAB builds reproducibly.
- Release build passes network/security smoke checks.

## Native Bridge Contract

The bridge must stay narrow. It can expose:

- app metadata
- lifecycle notifications
- robot credential read/write/delete
- discovery result read/start/stop
- pairing result read/start/cancel

The bridge must not expose:

- arbitrary shell
- arbitrary filesystem access
- generic network proxy
- unrestricted intent launcher
- hardware control bypassing Robot API

Initial bridge object:

```ts
interface LightoryAndroidBridge {
  getAppInfo(): string;
  postLifecycleEvent(event: 'resume' | 'pause' | 'destroy'): void;
}
```

Methods return JSON strings until the Web layer adds a typed native bridge
adapter.

## Android Environment Requirements

- macOS can build APK/AAB as long as Android toolchains are installed.
- Android Studio with Android SDK installed.
- JDK 17. Android Studio bundled JDK is acceptable.
- Android SDK Platform matching `compileSdk` in `android-pad/app/build.gradle`.
- Android SDK Build-Tools and Platform-Tools.
- Android Gradle Plugin available through Gradle sync.
- Gradle wrapper checked into the repo, or local Gradle installed.
- Target SDK selected in `android-pad/app/build.gradle`.

Current repository scaffold does not vendor Gradle, Gradle wrapper, or Android
SDK. First APK build requires installing those tools locally, generating and
committing a Gradle wrapper, or adding a CI image with them.

### macOS Setup

Install Android Studio, then use SDK Manager to install:

- Android SDK Platform 35.
- Android SDK Build-Tools 35.x.
- Android SDK Platform-Tools.
- Android Emulator if local device emulation is needed.

Set environment variables if building from terminal:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

Use Android Studio's bundled JDK or install JDK 17:

```sh
/usr/libexec/java_home -V
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

If the repo does not yet contain `android-pad/gradlew`, generate it once from a
machine with Gradle installed:

```sh
cd android-pad
gradle wrapper --gradle-version 8.10.2
```

Commit the generated wrapper files so other Macs and CI can build without a
global Gradle install.

## Development Commands

Refresh Android WebView assets:

```sh
npm run build:webview
npm run android:sync-assets
```

Build a debug APK after Android SDK and Gradle wrapper are available:

```sh
cd android-pad
./gradlew assembleDebug
```

Install on a connected Android Pad:

```sh
cd android-pad
./gradlew installDebug
```

Build a release APK/AAB after signing config is added:

```sh
cd android-pad
./gradlew assembleRelease
./gradlew bundleRelease
```

Open `android-pad/` in Android Studio and run the `app` configuration.

Expected debug APK path:

```text
android-pad/app/build/outputs/apk/debug/app-debug.apk
```

Expected release AAB path:

```text
android-pad/app/build/outputs/bundle/release/app-release.aab
```

### Current Local Status

On this Mac, terminal checks currently show:

- `gradle` is not installed.
- `ANDROID_HOME` is not set.
- Android SDK platforms are not visible from the shell.

So the repository can prepare Android assets now, but APK compilation needs
Android Studio/SDK plus Gradle wrapper or local Gradle first.

## Open Decisions

- Whether Phase C credential APIs should be called directly from WebView JS or
  through a small TypeScript adapter in `webview-ui/src/robot`.
- Whether QR pairing should use AndroidX CameraX, ML Kit, or a minimal external
  scanner library.
- Whether release distribution targets Play, private MDM, direct APK, or all of
  them.
