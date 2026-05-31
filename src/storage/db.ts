import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Game } from '../domain/types';

interface RentzDB extends DBSchema {
  games: {
    key: string;
    value: Game;
    indexes: { 'by-updatedAt': string };
  };
}

const DB_NAME = 'rentz';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<RentzDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<RentzDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RentzDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('games', { keyPath: 'id' });
          store.createIndex('by-updatedAt', 'updatedAt');
        }
        if (oldVersion < 2) {
          // v2: renamed Round.dealerId → Round.pickerId.
          const store = tx.objectStore('games');
          let cursor = await store.openCursor();
          while (cursor) {
            const game = cursor.value as unknown as {
              rounds?: { dealerId?: string; pickerId?: string }[];
            };
            let changed = false;
            for (const r of game.rounds ?? []) {
              if (r.dealerId && !r.pickerId) {
                r.pickerId = r.dealerId;
                delete r.dealerId;
                changed = true;
              }
            }
            if (changed) await cursor.update(game as unknown as Game);
            cursor = await cursor.continue();
          }
        }
        if (oldVersion < 3) {
          // v3: added Round.blind and ScoringConfig.blindMultiplier.
          const store = tx.objectStore('games');
          let cursor = await store.openCursor();
          while (cursor) {
            const game = cursor.value as unknown as {
              rounds?: { blind?: boolean }[];
              scoring?: { blindMultiplier?: number };
            };
            let changed = false;
            for (const r of game.rounds ?? []) {
              if (typeof r.blind !== 'boolean') {
                r.blind = false;
                changed = true;
              }
            }
            if (game.scoring && typeof game.scoring.blindMultiplier !== 'number') {
              game.scoring.blindMultiplier = 2;
              changed = true;
            }
            if (changed) await cursor.update(game as unknown as Game);
            cursor = await cursor.continue();
          }
        }
      },
    });
  }
  return dbPromise;
}

export function resetDbForTests(): void {
  dbPromise = null;
}
