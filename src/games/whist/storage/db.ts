import { openDB, type IDBPDatabase } from 'idb';
import type { WhistGame } from '../domain/types';
import type { GamesSchema } from '../../../core/storage/createGamesRepo';

type WhistDB = GamesSchema<WhistGame>;

const DB_NAME = 'whist';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WhistDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<WhistDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WhistDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('games', { keyPath: 'id' });
          store.createIndex('by-updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

export function resetDbForTests(): void {
  dbPromise = null;
}
