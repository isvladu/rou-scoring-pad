import { z } from 'zod';
import type { Game, GameStatus, RoundEntry } from '../domain/types';
import { saveGame } from './gamesRepo';

const PlayerSchema = z.object({ id: z.string(), name: z.string() });

const RoundEntrySchema: z.ZodType<RoundEntry> = z.discriminatedUnion('contract', [
  z.object({
    contract: z.enum(['noTricks', 'noDiamonds', 'noQueens', 'whist']),
    counts: z.record(z.string(), z.number()),
  }),
  z.object({
    contract: z.enum(['noKingOfHearts', 'tenOfClubs']),
    takerId: z.string(),
  }),
  z.object({
    contract: z.literal('totals'),
    tricks: z.record(z.string(), z.number()),
    diamonds: z.record(z.string(), z.number()),
    queens: z.record(z.string(), z.number()),
    kingOfHeartsTakerId: z.string(),
  }),
  z.object({
    contract: z.literal('rentz'),
    finishingOrder: z.array(z.string()),
  }),
]);

const RoundSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object') return val;
    const rec = val as Record<string, unknown>;
    // Accept legacy exports that used `dealerId` for what is now `pickerId`.
    if ('dealerId' in rec && !('pickerId' in rec)) {
      const { dealerId, ...rest } = rec;
      return { ...rest, pickerId: dealerId, blind: rest.blind ?? false };
    }
    // Older v2 exports lacked the `blind` flag.
    if (!('blind' in rec)) {
      return { ...rec, blind: false };
    }
    return rec;
  },
  z.object({
    index: z.number(),
    pickerId: z.string(),
    entry: RoundEntrySchema,
    blind: z.boolean(),
    scores: z.record(z.string(), z.number()),
    committedAt: z.string(),
  }),
);

function absMag<T extends Record<string, unknown> | undefined>(
  obj: T,
  key: string,
): void {
  if (obj && typeof obj === 'object' && typeof obj[key] === 'number') {
    (obj as Record<string, unknown>)[key] = Math.abs(obj[key] as number);
  }
}

const ScoringSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object') return val;
    const rec = val as Record<string, unknown>;
    // Pre-blind exports lacked `blindMultiplier`; default to 2.
    if (!('blindMultiplier' in rec)) {
      rec.blindMultiplier = 2;
    }
    // Old exports stored negative magnitudes for negative-sign contracts.
    // Sign is now applied by the calculator, so we normalise on the way in.
    absMag(rec.noTricks as Record<string, unknown> | undefined, 'perTrick');
    absMag(rec.noDiamonds as Record<string, unknown> | undefined, 'perDiamond');
    absMag(rec.noQueens as Record<string, unknown> | undefined, 'perQueen');
    absMag(rec.noKingOfHearts as Record<string, unknown> | undefined, 'takingIt');
    return rec;
  },
  // z.object strips unknown keys by default, so legacy exports carrying a
  // `totals: { multiplier }` field parse cleanly with that field dropped.
  z.object({
    noTricks: z.object({ perTrick: z.number() }),
    noDiamonds: z.object({ perDiamond: z.number() }),
    noQueens: z.object({ perQueen: z.number() }),
    noKingOfHearts: z.object({ takingIt: z.number() }),
    tenOfClubs: z.object({ takingIt: z.number() }),
    whist: z.object({ perTrick: z.number() }),
    rentz: z.object({
      byPosition: z.object({
        // Default fills in for games exported before 3-player support landed.
        3: z.array(z.number()).default([200, 100, 0]),
        4: z.array(z.number()),
        5: z.array(z.number()),
        6: z.array(z.number()),
      }),
    }),
    blindMultiplier: z.number(),
  }),
);

const RentzRefusalSchema = z.object({
  pickerId: z.string(),
  refuserId: z.string(),
  occurredAt: z.string(),
});

export const GameSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object') return val;
    const rec = val as Record<string, unknown>;
    // Older exports lacked `rentzRefusals`; default to empty.
    if (!('rentzRefusals' in rec)) {
      return { ...rec, rentzRefusals: [] };
    }
    return rec;
  },
  z.object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    players: z.array(PlayerSchema).min(3).max(6),
    scoring: ScoringSchema,
    rounds: z.array(RoundSchema),
    rentzRefusals: z.array(RentzRefusalSchema),
    status: z.custom<GameStatus>((v) => v === 'in_progress' || v === 'finished'),
  }),
);

export const ExportSchema = z.object({
  format: z.literal('rentz-scoring-app'),
  version: z.literal(1),
  exportedAt: z.string(),
  games: z.array(GameSchema),
});

export type ExportPayload = z.infer<typeof ExportSchema>;

export function serializeGames(games: Game[]): string {
  const payload: ExportPayload = {
    format: 'rentz-scoring-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    games,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importGamesFromJson(json: string): Promise<number> {
  const parsed = ExportSchema.parse(JSON.parse(json));
  for (const game of parsed.games) {
    await saveGame(game as Game);
  }
  return parsed.games.length;
}
