import type { DBSchema, IDBPDatabase } from 'idb';

/**
 * Minimum shape every per-game record must satisfy to use this helper:
 * a stable string `id` and an ISO-string `updatedAt` for sort order.
 */
export interface IndexedGame {
  id: string;
  updatedAt: string;
}

/**
 * The IDB schema shape this helper assumes: a single `games` object store
 * keyed by `id`, with a `by-updatedAt` index. Per-game `db.ts` files
 * declare their schema this way (or a structurally compatible one) and
 * pass `getDb` into `createGamesRepo`.
 */
export interface GamesSchema<T extends IndexedGame> extends DBSchema {
  games: {
    key: string;
    value: T;
    indexes: { 'by-updatedAt': string };
  };
}

export interface GamesRepo<T extends IndexedGame> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  save(game: T): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * CRUD over a per-game IndexedDB. Each game's storage layer declares its
 * own DB name, version, and migration logic in a `db.ts` file; this helper
 * provides the four trivial read/write methods that are identical across
 * games.
 */
export function createGamesRepo<T extends IndexedGame>(
  getDb: () => Promise<IDBPDatabase<GamesSchema<T>>>,
): GamesRepo<T> {
  return {
    async list() {
      const db = await getDb();
      const games = await db.getAllFromIndex('games', 'by-updatedAt');
      return games.reverse();
    },
    async get(id) {
      const db = await getDb();
      return db.get('games', id);
    },
    async save(game) {
      const db = await getDb();
      await db.put('games', { ...game, updatedAt: new Date().toISOString() });
    },
    async remove(id) {
      const db = await getDb();
      await db.delete('games', id);
    },
  };
}
