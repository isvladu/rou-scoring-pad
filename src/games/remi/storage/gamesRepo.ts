import type { RemiGame } from '../domain/types';
import { createGamesRepo } from '../../../core/storage/createGamesRepo';
import { getDb } from './db';

const repo = createGamesRepo<RemiGame>(getDb);

export const listGames = repo.list;
export const getGame = repo.get;
export const saveGame = repo.save;
export const deleteGame = repo.remove;
