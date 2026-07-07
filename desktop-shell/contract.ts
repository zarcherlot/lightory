export type DesktopPlatform = 'windows' | 'macos' | 'linux';

export type ServerStatus =
  | { state: 'starting' }
  | { state: 'ready'; url: string; pid: number }
  | { state: 'stopped' }
  | { state: 'error'; message: string };

export interface DesktopShellBridge {
  getServerUrl(): Promise<string>;
  getPlatform(): Promise<DesktopPlatform>;
  restartServer(): Promise<void>;
  revealLogs(): Promise<void>;
  onServerStatus(listener: (status: ServerStatus) => void): () => void;
}
