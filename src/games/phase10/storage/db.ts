import { openDB, type IDBPDatabase } from 'idb';
import type { Phase10Game } from '../domain/types';
import type { GamesSchema } from '../../../core/storage/createGamesRepo';

type Phase10DB = GamesSchema<Phase10Game>;

const DB_NAME = 'phase10';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<Phase10DB>> | null = null;

export function getDb(): Promise<IDBPDatabase<Phase10DB>> {
  if (!dbPromise) {
    dbPromise = openDB<Phase10DB>(DB_NAME, DB_VERSION, {
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
