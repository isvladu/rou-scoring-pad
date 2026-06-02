import type {
  Player,
  PlayerId,
  Phase10Hand,
  Phase10HandEntry,
} from './types';

/**
 * Per-player score for one hand. The wentOut player gets 0; everyone else
 * scores their `remainingPenalty` value. Lower totals are better in
 * Phase 10.
 */
export function computeHandScores(
  entry: Phase10HandEntry,
  players: Player[],
): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  for (const p of players) {
    out[p.id] = p.id === entry.wentOutId ? 0 : (entry.remainingPenalty[p.id] ?? 0);
  }
  return out;
}

export function totalScores(
  players: Player[],
  hands: readonly Phase10Hand[],
): Record<PlayerId, number> {
  const totals: Record<PlayerId, number> = {};
  for (const p of players) totals[p.id] = 0;
  for (const h of hands) {
    for (const p of players) {
      totals[p.id] += p.id === h.wentOutId ? 0 : (h.remainingPenalty[p.id] ?? 0);
    }
  }
  return totals;
}
