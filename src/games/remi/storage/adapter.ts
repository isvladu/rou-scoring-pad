import type { GameAdapter } from '../../../core/storage/gameAdapter';
import type { RemiGame } from '../domain/types';
import { ExportSchema, GameSchema } from './exportImport';
import { listGames, saveGame } from './gamesRepo';

export const adapter: GameAdapter = {
  gameType: 'remi',
  schemaVersion: 1,
  gameSchema: GameSchema,
  legacyEnvelopeSchema: ExportSchema,
  listGames: () => listGames() as Promise<unknown[]>,
  saveGame: (game) => saveGame(game as RemiGame),
};
