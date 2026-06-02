import { z } from 'zod';
import type { WhistGame, WhistGameStatus } from '../domain/types';
import { saveGame } from './gamesRepo';

const PlayerSchema = z.object({ id: z.string(), name: z.string() });

const RoundEntrySchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object') return val;
    const rec = val as Record<string, unknown>;
    // Pre-trump-removal exports carried a `trump` field; strip it on import.
    if ('trump' in rec) {
      delete rec.trump;
    }
    return rec;
  },
  z.object({
    bids: z.record(z.string(), z.number()),
    tricks: z.record(z.string(), z.number()),
  }),
);

const RoundSchema = z.object({
  index: z.number(),
  handSize: z.number().int().min(1).max(8),
  pickerId: z.string(),
  entry: RoundEntrySchema,
  scores: z.record(z.string(), z.number()),
  committedAt: z.string(),
});

const ScoringSchema = z.object({
  hitBonus: z.number(),
  missPenaltyPerTrick: z.number(),
  zeroBidHitBonus: z.number(),
  maxBidHitBonus: z.number(),
  enforceDealerConstraint: z.boolean(),
});

export const GameSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  players: z.array(PlayerSchema).min(4).max(6),
  schedule: z.array(z.number().int().min(1).max(8)),
  scoring: ScoringSchema,
  rounds: z.array(RoundSchema),
  status: z.custom<WhistGameStatus>((v) => v === 'in_progress' || v === 'finished'),
});

export const ExportSchema = z.object({
  format: z.literal('whist-scoring-app'),
  version: z.literal(1),
  exportedAt: z.string(),
  games: z.array(GameSchema),
});

export type ExportPayload = z.infer<typeof ExportSchema>;

export function serializeGames(games: WhistGame[]): string {
  const payload: ExportPayload = {
    format: 'whist-scoring-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    games,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importGamesFromJson(json: string): Promise<number> {
  const parsed = ExportSchema.parse(JSON.parse(json));
  for (const game of parsed.games) {
    await saveGame(game as WhistGame);
  }
  return parsed.games.length;
}
