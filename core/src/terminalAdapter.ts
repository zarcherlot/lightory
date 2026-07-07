/**
 * Minimal terminal interface for fileWatcher's terminal adoption logic.
 * Only exposes the fields needed for matching terminals to agents.
 */
export interface TerminalHandle {
  name: string;
  exitStatus?: unknown;
}

/**
 * Adapter for terminal access. Browser-only runtime normally has no terminals,
 * but the interface remains for hook providers that can expose external shells.
 */
export interface ITerminalAdapter {
  activeTerminal(): TerminalHandle | undefined;
  allTerminals(): TerminalHandle[];
}
