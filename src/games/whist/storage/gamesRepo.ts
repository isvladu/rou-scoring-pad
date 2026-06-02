import type { WhistGame } from '../domain/types';
import { createGamesRepo } from '../../../core/storage/createGamesRepo';
import { getDb } from './db';

const repo = createGamesRepo<WhistGame>(getDb);

export const listGames = repo.list;
export const getGame = repo.get;
export const saveGame = repo.save;
export const deleteGame = repo.remove;
