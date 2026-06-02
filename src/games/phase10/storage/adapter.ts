import type { GameAdapter } from '../../../core/storage/gameAdapter';
import type { Phase10Game } from '../domain/types';
import { ExportSchema, GameSchema } from './exportImport';
import { listGames, saveGame } from './gamesRepo';

export const adapter: GameAdapter = {
  gameType: 'phase10',
  schemaVersion: 1,
  gameSchema: GameSchema,
  legacyEnvelopeSchema: ExportSchema,
  listGames: () => listGames() as Promise<unknown[]>,
  saveGame: (game) => saveGame(game as Phase10Game),
};
