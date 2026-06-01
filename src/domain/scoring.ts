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
  if (!blind) return base;
  const m = scoring.blindMultiplier;
  const out: Record<PlayerId, number> = {};
  for (const [id, v] of Object.entries(base)) {
    out[id] = v * m + 0;
  }
  return out;
}

function computeBaseRoundScores(
  entry: RoundEntry,
  players: Player[],
  scoring: ScoringConfig,
): Record<PlayerId, number> {
  switch (entry.contract) {
    case 'noTricks':
      return counterScores(players, entry.counts, signed('noTricks', scoring.noTricks.perTrick));
    case 'noDiamonds':
      return counterScores(
        players,
        entry.counts,
        signed('noDiamonds', scoring.noDiamonds.perDiamond),
      );
    case 'noQueens':
      return counterScores(players, entry.counts, signed('noQueens', scoring.noQueens.perQueen));
    case 'whist':
      return counterScores(players, entry.counts, signed('whist', scoring.whist.perTrick));
    case 'noKingOfHearts':
      return takerScores(
        players,
        entry.takerId,
        signed('noKingOfHearts', scoring.noKingOfHearts.takingIt),
      );
    case 'tenOfClubs':
      return takerScores(
        players,
        entry.takerId,
        signed('tenOfClubs', scoring.tenOfClubs.takingIt),
      );
    case 'totals': {
      // Each sub-component gets signed per its own contract metadata, so a
      // future "totals includes a positive contract" change wouldn't need
      // hand-tuning here.
      const tricks = counterScores(
        players,
        entry.tricks,
        signed('noTricks', scoring.noTricks.perTrick),
      );
      const diamonds = counterScores(
        players,
        entry.diamonds,
        signed('noDiamonds', scoring.noDiamonds.perDiamond),
      );
      const queens = counterScores(
        players,
        entry.queens,
        signed('noQueens', scoring.noQueens.perQueen),
      );
      const king = takerScores(
        players,
        entry.kingOfHeartsTakerId,
        signed('noKingOfHearts', scoring.noKingOfHearts.takingIt),
      );
      return sumRecords(tricks, diamonds, queens, king);
    }
    case 'rentz': {
      const count = players.length as PlayerCount;
      const positionPoints = scoring.rentz.byPosition[count];
      if (!positionPoints || positionPoints.length !== players.length) {
        throw new Error(`No Rentz position points configured for ${players.length} players`);
      }
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
