import type {
  Player,
  PlayerId,
  RemiHand,
  RemiHandEntry,
  RemiPerPlayerEntry,
} from './types';
import type { RemiScoringConfig } from '../config/scoringDefaults';

interface WinnerFlags {
  isWinner: boolean;
  selfWin: boolean;
  /** Set when the active scoring config has `doubleScoreOnJolyDiscardWin`
   *  enabled AND the winner discarded a Joly. Applied as a final ×2 on the
   *  winner's score, after all bonuses. */
  doubleForJolyDiscard: boolean;
}

/**
 * Compute one player's hand score given their entry and the winner flags
 * plus scoring config.
 */
function scorePlayer(
  pp: RemiPerPlayerEntry,
  flags: WinnerFlags,
  scoring: RemiScoringConfig,
): number {
  if (!pp.melded) {
    // No-meld branch — replaces normal melded−rack accounting.
    const base =
      scoring.noMeldPenaltyMode === 'fixed'
        ? -scoring.noMeldPenalty
        : -100 - pp.rackValue;
    return base + (pp.jolyOnRack ? -scoring.jolyRackPenalty : 0);
  }

  let score = pp.meldedValue - pp.rackValue;
  if (pp.jolyFirstMelded) score += scoring.jolyFirstMeldBonus;
  if (pp.jolyOnRack) score -= scoring.jolyRackPenalty;
  if (pp.declaredIdenticalExposed) score += scoring.identicalExposedBonus;
  if (flags.isWinner) {
    score += scoring.winnerBonus;
    if (flags.selfWin) score += scoring.selfWinBonus;
    if (flags.doubleForJolyDiscard) score *= 2;
  }
  return score;
}

export function computeHandScores(
  entry: RemiHandEntry,
  players: Player[],
  scoring: RemiScoringConfig,
): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  for (const p of players) {
    const pp = entry.perPlayer[p.id];
    if (!pp) {
      out[p.id] = 0;
      continue;
    }
    const isWinner = entry.winnerId !== null && p.id === entry.winnerId;
    out[p.id] = scorePlayer(
      pp,
      {
        isWinner,
        selfWin: isWinner && entry.selfWin,
        doubleForJolyDiscard:
          isWinner && entry.winnerDiscardedJoly && scoring.doubleScoreOnJolyDiscardWin,
      },
      scoring,
    );
  }
  return out;
}

export function totalScores(
  players: Player[],
  hands: readonly RemiHand[],
): Record<PlayerId, number> {
  const totals: Record<PlayerId, number> = {};
  for (const p of players) totals[p.id] = 0;
  for (const h of hands) {
    for (const p of players) {
      totals[p.id] += h.scores[p.id] ?? 0;
    }
  }
  return totals;
}
