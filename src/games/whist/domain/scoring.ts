import type { Player, PlayerId, WhistRound, WhistRoundEntry } from './types';
import type { WhistScoringConfig } from '../config/scoringDefaults';

/**
 * Per-round score for each player given the entry, the round's hand size,
 * and the scoring config. Pure function — no DOM, no storage, no i18n.
 *
 *   Made bid exactly → + hitBonus + tricks
 *     (+ zeroBidHitBonus if bid === 0)
 *     (+ maxBidHitBonus if bid === handSize)
 *   Missed bid       → − abs(bid − tricks) × missPenaltyPerTrick
 */
export function computeRoundScores(
  entry: WhistRoundEntry,
  handSize: number,
  players: Player[],
  scoring: WhistScoringConfig,
): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  for (const p of players) {
    const bid = entry.bids[p.id] ?? 0;
    const tricks = entry.tricks[p.id] ?? 0;
    if (bid === tricks) {
      let score = scoring.hitBonus + tricks;
      if (bid === 0) score += scoring.zeroBidHitBonus;
      if (bid === handSize) score += scoring.maxBidHitBonus;
      out[p.id] = score;
    } else {
      out[p.id] = -Math.abs(bid - tricks) * scoring.missPenaltyPerTrick;
    }
  }
  return out;
}

export function totalScores(players: Player[], rounds: WhistRound[]): Record<PlayerId, number> {
  const totals: Record<PlayerId, number> = {};
  for (const p of players) totals[p.id] = 0;
  for (const r of rounds) {
    for (const p of players) totals[p.id] += r.scores[p.id] ?? 0;
  }
  return totals;
}
