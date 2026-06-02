import type { z } from 'zod';

/**
 * Contract each game's storage layer exposes so the core
 * {@link unifiedExportImport} module can list/save games across game types
 * and parse both the unified envelope and that game's legacy per-game
 * envelope.
 *
 * Adapters are typed as `unknown` on the game payload because the unified
 * orchestrator dispatches across heterogeneous types — each adapter knows
 * what it produced/consumed and casts internally where needed. The Zod
 * schemas are the runtime trust boundary; static types stay loose by
 * design.
 */
export interface GameAdapter {
  /** Stable identifier — also the discriminator in the unified envelope. */
  gameType: string;
  /** Per-game shape version, lets each game evolve independently. */
  schemaVersion: number;
  /** Validates the inner `game` field of a unified envelope record. */
  gameSchema: z.ZodType<unknown>;
  /** Validates a full legacy per-game export envelope (this game's format). */
  legacyEnvelopeSchema: z.ZodType<{ games: unknown[] }>;
  /** Newest-first list of saved games for this game type. */
  listGames(): Promise<unknown[]>;
  /** Save a game (already schema-validated) into this game's IndexedDB. */
  saveGame(game: unknown): Promise<void>;
}
