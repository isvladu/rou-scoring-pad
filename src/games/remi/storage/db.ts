import { openDB, type IDBPDatabase } from 'idb';
import type { RemiGame } from '../domain/types';
import type { GamesSchema } from '../../../core/storage/createGamesRepo';

type RemiDB = GamesSchema<RemiGame>;

const DB_NAME = 'remi';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RemiDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<RemiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RemiDB>(DB_NAME, DB_VERSION, {
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
