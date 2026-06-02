import type { GameAdapter } from '../../../core/storage/gameAdapter';
import type { Game } from '../domain/types';
import { ExportSchema, GameSchema } from './exportImport';
import { listGames, saveGame } from './gamesRepo';

export const adapter: GameAdapter = {
  gameType: 'rentz',
  schemaVersion: 1,
  gameSchema: GameSchema,
  legacyEnvelopeSchema: ExportSchema,
  listGames: () => listGames() as Promise<unknown[]>,
  saveGame: (game) => saveGame(game as Game),
};
