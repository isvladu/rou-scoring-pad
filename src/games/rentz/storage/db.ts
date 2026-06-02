import { openDB, type IDBPDatabase } from 'idb';
import type { Game } from '../domain/types';
import type { GamesSchema } from '../../../core/storage/createGamesRepo';

type RentzDB = GamesSchema<Game>;

const DB_NAME = 'rentz';
const DB_VERSION = 6;

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
        if (oldVersion < 4) {
          // v4: removed ScoringConfig.totals (was just `{ multiplier }`).
          const store = tx.objectStore('games');
          let cursor = await store.openCursor();
          while (cursor) {
            const game = cursor.value as unknown as {
              scoring?: { totals?: unknown };
            };
            if (game.scoring && 'totals' in game.scoring) {
              delete game.scoring.totals;
              await cursor.update(game as unknown as Game);
            }
            cursor = await cursor.continue();
          }
        }
        if (oldVersion < 5) {
          // v5: scoring values are now stored as non-negative magnitudes.
          // Sign is applied by the calculator from CONTRACT_META.
          const store = tx.objectStore('games');
          let cursor = await store.openCursor();
          while (cursor) {
            const game = cursor.value as unknown as {
              scoring?: {
                noTricks?: { perTrick?: number };
                noDiamonds?: { perDiamond?: number };
                noQueens?: { perQueen?: number };
                noKingOfHearts?: { takingIt?: number };
              };
            };
            const s = game.scoring;
            let changed = false;
            if (s?.noTricks && typeof s.noTricks.perTrick === 'number') {
              const abs = Math.abs(s.noTricks.perTrick);
              if (abs !== s.noTricks.perTrick) {
                s.noTricks.perTrick = abs;
                changed = true;
              }
            }
            if (s?.noDiamonds && typeof s.noDiamonds.perDiamond === 'number') {
              const abs = Math.abs(s.noDiamonds.perDiamond);
              if (abs !== s.noDiamonds.perDiamond) {
                s.noDiamonds.perDiamond = abs;
                changed = true;
              }
            }
            if (s?.noQueens && typeof s.noQueens.perQueen === 'number') {
              const abs = Math.abs(s.noQueens.perQueen);
              if (abs !== s.noQueens.perQueen) {
                s.noQueens.perQueen = abs;
                changed = true;
              }
            }
            if (s?.noKingOfHearts && typeof s.noKingOfHearts.takingIt === 'number') {
              const abs = Math.abs(s.noKingOfHearts.takingIt);
              if (abs !== s.noKingOfHearts.takingIt) {
                s.noKingOfHearts.takingIt = abs;
                changed = true;
              }
            }
            if (changed) await cursor.update(game as unknown as Game);
            cursor = await cursor.continue();
          }
        }
        if (oldVersion < 6) {
          // v6: added Game.rentzRefusals.
          const store = tx.objectStore('games');
          let cursor = await store.openCursor();
          while (cursor) {
            const game = cursor.value as unknown as {
              rentzRefusals?: unknown[];
            };
            if (!Array.isArray(game.rentzRefusals)) {
              game.rentzRefusals = [];
              await cursor.update(game as unknown as Game);
            }
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
