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
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RentzDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<RentzDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RentzDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('games')) {
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
