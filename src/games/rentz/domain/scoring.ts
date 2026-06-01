import type { ScoringConfig } from '../config/scoringDefaults';
import { signed } from './contracts';
import type { Player, PlayerCount, PlayerId, RoundEntry } from './types';

function zeroScores(players: Player[]): Record<PlayerId, number> {
  return Object.fromEntries(players.map((p) => [p.id, 0]));
}

function counterScores(
  players: Player[],
  counts: Record<PlayerId, number>,
  perUnit: number,
): Record<PlayerId, number> {
  const scores = zeroScores(players);
  for (const p of players) {
    // `+ 0` normalizes `-0` (from `0 * -2`) to `+0`.
    scores[p.id] = (counts[p.id] ?? 0) * perUnit + 0;
  }
  return scores;
}

function takerScores(
  players: Player[],
  takerId: PlayerId,
  value: number,
): Record<PlayerId, number> {
  const scores = zeroScores(players);
  scores[takerId] = value;
  return scores;
}

function sumRecords(...records: Record<PlayerId, number>[]): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  for (const rec of records) {
    for (const [id, v] of Object.entries(rec)) {
      out[id] = (out[id] ?? 0) + v;
    }
  }
  return out;
}

export function computeRoundScores(
  entry: RoundEntry,
  players: Player[],
  scoring: ScoringConfig,
  blind = false,
): Record<PlayerId, number> {
  const base = computeBaseRoundScores(entry, players, scoring);
  if (!blind) {
    console.log('[rentz/scoring] result', {
      contract: entry.contract,
      blind: false,
      scores: base,
    });
    return base;
  }
  const m = scoring.blindMultiplier;
  const out: Record<PlayerId, number> = {};
  for (const [id, v] of Object.entries(base)) {
    out[id] = v * m + 0;
  }
  console.log('[rentz/scoring] result (blind)', {
    contract: entry.contract,
    blindMultiplier: m,
    base,
    scores: out,
  });
  return out;
}

function computeBaseRoundScores(
  entry: RoundEntry,
  players: Player[],
  scoring: ScoringConfig,
): Record<PlayerId, number> {
  switch (entry.contract) {
    case 'noTricks': {
      const perUnit = signed('noTricks', scoring.noTricks.perTrick);
      console.log('[rentz/scoring] noTricks', { perUnit, counts: entry.counts });
      return counterScores(players, entry.counts, perUnit);
    }
    case 'noDiamonds': {
      const perUnit = signed('noDiamonds', scoring.noDiamonds.perDiamond);
      console.log('[rentz/scoring] noDiamonds', { perUnit, counts: entry.counts });
      return counterScores(players, entry.counts, perUnit);
    }
    case 'noQueens': {
      const perUnit = signed('noQueens', scoring.noQueens.perQueen);
      console.log('[rentz/scoring] noQueens', { perUnit, counts: entry.counts });
      return counterScores(players, entry.counts, perUnit);
    }
    case 'whist': {
      const perUnit = signed('whist', scoring.whist.perTrick);
      console.log('[rentz/scoring] whist', { perUnit, counts: entry.counts });
      return counterScores(players, entry.counts, perUnit);
    }
    case 'noKingOfHearts': {
      const value = signed('noKingOfHearts', scoring.noKingOfHearts.takingIt);
      console.log('[rentz/scoring] noKingOfHearts', { value, takerId: entry.takerId });
      return takerScores(players, entry.takerId, value);
    }
    case 'tenOfClubs': {
      const value = signed('tenOfClubs', scoring.tenOfClubs.takingIt);
      console.log('[rentz/scoring] tenOfClubs', { value, takerId: entry.takerId });
      return takerScores(players, entry.takerId, value);
    }
    case 'totals': {
      // Each sub-component gets signed per its own contract metadata, so a
      // future "totals includes a positive contract" change wouldn't need
      // hand-tuning here.
      const perTrick = signed('noTricks', scoring.noTricks.perTrick);
      const perDiamond = signed('noDiamonds', scoring.noDiamonds.perDiamond);
      const perQueen = signed('noQueens', scoring.noQueens.perQueen);
      const kingValue = signed('noKingOfHearts', scoring.noKingOfHearts.takingIt);
      console.log('[rentz/scoring] totals', {
        perTrick,
        perDiamond,
        perQueen,
        kingValue,
        tricks: entry.tricks,
        diamonds: entry.diamonds,
        queens: entry.queens,
        kingOfHeartsTakerId: entry.kingOfHeartsTakerId,
      });
      const tricks = counterScores(players, entry.tricks, perTrick);
      const diamonds = counterScores(players, entry.diamonds, perDiamond);
      const queens = counterScores(players, entry.queens, perQueen);
      const king = takerScores(players, entry.kingOfHeartsTakerId, kingValue);
      return sumRecords(tricks, diamonds, queens, king);
    }
    case 'rentz': {
      const count = players.length as PlayerCount;
      const positionPoints = scoring.rentz.byPosition[count];
      if (!positionPoints || positionPoints.length !== players.length) {
        throw new Error(`No Rentz position points configured for ${players.length} players`);
      }
      console.log('[rentz/scoring] rentz', {
        positionPoints,
        finishingOrder: entry.finishingOrder,
      });
      const scores = zeroScores(players);
      entry.finishingOrder.forEach((pid, idx) => {
        scores[pid] = positionPoints[idx];
      });
      return scores;
    }
  }
}

export function totalScores(
  players: Player[],
  rounds: { scores: Record<PlayerId, number> }[],
): Record<PlayerId, number> {
  const totals = zeroScores(players);
  for (const r of rounds) {
    for (const p of players) {
      totals[p.id] += r.scores[p.id] ?? 0;
    }
  }
  return totals;
}
