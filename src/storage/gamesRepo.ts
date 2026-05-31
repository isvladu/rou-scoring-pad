import type { Game } from '../domain/types';
import { getDb } from './db';

export async function listGames(): Promise<Game[]> {
  const db = await getDb();
  const games = await db.getAllFromIndex('games', 'by-updatedAt');
  return games.reverse();
}

export async function getGame(id: string): Promise<Game | undefined> {
  const db = await getDb();
  return db.get('games', id);
}

export async function saveGame(game: Game): Promise<void> {
  const db = await getDb();
  await db.put('games', { ...game, updatedAt: new Date().toISOString() });
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('games', id);
}
