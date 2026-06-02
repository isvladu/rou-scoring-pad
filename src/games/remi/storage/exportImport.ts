import { z } from 'zod';
import type { RemiGame, RemiGameStatus } from '../domain/types';
import { saveGame } from './gamesRepo';

const PlayerSchema = z.object({ id: z.string(), name: z.string() });

const PerPlayerSchema = z.object({
  melded: z.boolean(),
  meldedValue: z.number(),
  rackValue: z.number(),
  jolyFirstMelded: z.boolean(),
  jolyOnRack: z.boolean(),
  declaredIdenticalExposed: z.boolean(),
});

const HandSchema = z.object({
  index: z.number().int().nonnegative(),
  winnerId: z.string().nullable(),
  selfWin: z.boolean(),
  // Default false so games exported before the doubleScoreOnJolyDiscardWin
  // house rule existed still parse cleanly.
  winnerDiscardedJoly: z.boolean().default(false),
  perPlayer: z.record(z.string(), PerPlayerSchema),
  scores: z.record(z.string(), z.number()),
  committedAt: z.string(),
});

const ScoringSchema = z.object({
  winnerBonus: z.number(),
  selfWinBonus: z.number(),
  jolyFirstMeldBonus: z.number(),
  jolyRackPenalty: z.number(),
  identicalExposedBonus: z.number(),
  noMeldPenalty: z.number(),
  noMeldPenaltyMode: z.enum(['fixed', 'rackBased']),
  initialMeldThreshold: z.number(),
  doubleScoreOnJolyDiscardWin: z.boolean().default(false),
});

const EndConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('targetScore'), targetScore: z.number() }),
  z.object({ kind: z.literal('handCount'), handCount: z.number().int().positive() }),
]);

export const GameSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  players: z.array(PlayerSchema).min(2).max(4),
  endCondition: EndConditionSchema,
  scoring: ScoringSchema,
  hands: z.array(HandSchema),
  status: z.custom<RemiGameStatus>(
    (v) => v === 'in_progress' || v === 'finished',
  ),
});

export const ExportSchema = z.object({
  format: z.literal('remi-scoring-app'),
  version: z.literal(1),
  exportedAt: z.string(),
  games: z.array(GameSchema),
});

export type ExportPayload = z.infer<typeof ExportSchema>;

export function serializeGames(games: RemiGame[]): string {
  const payload: ExportPayload = {
    format: 'remi-scoring-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    games,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importGamesFromJson(json: string): Promise<number> {
  const parsed = ExportSchema.parse(JSON.parse(json));
  for (const game of parsed.games) {
    await saveGame(game as RemiGame);
  }
  return parsed.games.length;
}
