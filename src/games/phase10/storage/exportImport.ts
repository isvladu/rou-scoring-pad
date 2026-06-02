import { z } from 'zod';
import type { Phase10Game, Phase10GameStatus } from '../domain/types';
import { saveGame } from './gamesRepo';

const PlayerSchema = z.object({ id: z.string(), name: z.string() });

const HandSchema = z.object({
  index: z.number().int().nonnegative(),
  wentOutId: z.string(),
  remainingPenalty: z.record(z.string(), z.number()),
  completedPhase: z.record(z.string(), z.boolean()),
  committedAt: z.string(),
});

const ScoringSchema = z.object({
  penaltyLow: z.number(),
  penaltyHigh: z.number(),
  penaltySkip: z.number(),
  penaltyWild: z.number(),
});

export const GameSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  players: z.array(PlayerSchema).min(2).max(6),
  scoring: ScoringSchema,
  hands: z.array(HandSchema),
  status: z.custom<Phase10GameStatus>(
    (v) => v === 'in_progress' || v === 'finished',
  ),
});

export const ExportSchema = z.object({
  format: z.literal('phase10-scoring-app'),
  version: z.literal(1),
  exportedAt: z.string(),
  games: z.array(GameSchema),
});

export type ExportPayload = z.infer<typeof ExportSchema>;

export function serializeGames(games: Phase10Game[]): string {
  const payload: ExportPayload = {
    format: 'phase10-scoring-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    games,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importGamesFromJson(json: string): Promise<number> {
  const parsed = ExportSchema.parse(JSON.parse(json));
  for (const game of parsed.games) {
    await saveGame(game as Phase10Game);
  }
  return parsed.games.length;
}
