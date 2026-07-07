# Lightory Desktop Shell Contract

This directory is the reserved boundary for a future Tauri or Electron shell.
The current product surface is the standalone Node server plus browser UI.

## Runtime Contract

The desktop shell should not own agent state. It should only:

- start the bundled `lightory` server process
- wait for `~/.lightory/server.json`
- open `http://127.0.0.1:<port>` in the native WebView
- forward app lifecycle events to the server process
- stop the server when the shell owns it and the final window closes

## Suggested Shell API

```ts
export interface DesktopShellBridge {
  getServerUrl(): Promise<string>;
  getPlatform(): Promise<'windows' | 'macos' | 'linux'>;
  restartServer(): Promise<void>;
  revealLogs(): Promise<void>;
  onServerStatus(listener: (status: ServerStatus) => void): () => void;
}

export interface ServerStatus {
  state: 'starting' | 'ready' | 'stopped' | 'error';
  url?: string;
  pid?: number;
  message?: string;
}
```

## Packaging Direction

Tauri is the preferred shell for the first desktop release because the UI is
already a browser app and the shell only needs process management plus a native
WebView. Electron remains viable if Node-side debugging or extension-like APIs
become more important than package size.
