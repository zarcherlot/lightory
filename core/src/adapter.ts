/**
 * Pluggable persistence backend for agent state and user settings.
 *
 * The browser CLI uses FileStateAdapter, which persists everything under
 * ~/.lightory/ as plain JSON. The interface exists so future hosts can
 * swap in alternate backends without touching the rest of the code.
 *
 * Layout persistence (~/.lightory/layout.json) is NOT part of this
 * interface -- it's already host-agnostic (plain fs I/O in layoutPersistence.ts).
 */

import type { PersistedAgent } from './schemas.js';

export interface StateAdapter {
  // ── Persisted state (agents + seats) ────────────────────

  loadAgents(): PersistedAgent[];
  saveAgents(agents: PersistedAgent[]): void;

  loadSeats(): Record<string, { palette?: number; hueShift?: number; seatId?: string }>;
  saveSeats(seats: Record<string, { palette?: number; hueShift?: number; seatId?: string }>): void;

  // ── User-level settings ─────

  getSetting<T>(key: string, defaultValue: T): T;
  setSetting<T>(key: string, value: T): void;
}
