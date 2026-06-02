import type { Player, PlayerId, WhistRound, WhistRoundEntry } from './types';
import type { WhistScoringConfig } from '../config/scoringDefaults';

/**
 * Per-player streak length going INTO a hypothetical next round, derived
 * from the round history. Hand-size-1 rounds are skipped entirely — they
 * neither grow the streak nor reset it. A non-1 round either bumps the
 * streak by 1 (hit) or zeroes it (miss).
 */
export function priorStreaks(
  players: Player[],
  rounds: readonly WhistRound[],
): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  for (const p of players) out[p.id] = 0;
  for (const r of rounds) {
    if (r.handSize === 1) continue;
    for (const p of players) {
      const bid = r.entry.bids[p.id] ?? 0;
      const tricks = r.entry.tricks[p.id] ?? 0;
      out[p.id] = bid === tricks ? out[p.id] + 1 : 0;
    }
  }
  return out;
}

/**
 * Per-round score for each player given the entry, the round's hand size,
 * and the scoring config. Pure function — no DOM, no storage, no i18n.
 *
 *   Made bid exactly → + hitBonus + tricks
 *     (+ zeroBidHitBonus if bid === 0)
 *     (+ maxBidHitBonus if bid === handSize)
 *     (+ premiereBonus if this hit completes a premiereStreakLength-streak,
 *        hand-size-1 rounds excluded from the streak)
 *   Missed bid       → − abs(bid − tricks) × missPenaltyPerTrick
 *
 * `priorStreak` is the per-player streak going INTO this round. When omitted
 * (e.g. in domain-only unit tests that don't care about streaks), it's
 * treated as all zeros — the premiere bonus only fires on the 5th hit, so
 * standalone single-round tests are unaffected.
 */
export function computeRoundScores(
  entry: WhistRoundEntry,
  handSize: number,
  players: Player[],
  scoring: WhistScoringConfig,
  priorStreak?: Record<PlayerId, number>,
): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  for (const p of players) {
    const bid = entry.bids[p.id] ?? 0;
    const tricks = entry.tricks[p.id] ?? 0;
    const hit = bid === tricks;

    let score: number;
    if (hit) {
      score = scoring.hitBonus + tricks;
      if (bid === 0) score += scoring.zeroBidHitBonus;
      if (bid === handSize) score += scoring.maxBidHitBonus;
    } else {
      score = -Math.abs(bid - tricks) * scoring.missPenaltyPerTrick;
    }

    // Premiere streak bonus — only meaningful for hits in non-1-card rounds
    // and only when the rule is enabled.
    if (
      hit &&
      handSize > 1 &&
      scoring.premiereBonus > 0 &&
      scoring.premiereStreakLength > 0
    ) {
      const newStreak = (priorStreak?.[p.id] ?? 0) + 1;
      if (newStreak % scoring.premiereStreakLength === 0) {
        score += scoring.premiereBonus;
      }
    }

    out[p.id] = score;
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
