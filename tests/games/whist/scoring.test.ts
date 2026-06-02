import { describe, expect, it } from 'vitest';
import { computeRoundScores, totalScores } from '../../../src/games/whist/domain/scoring';
import {
  cloneDefaultWhistScoring,
  type WhistScoringConfig,
} from '../../../src/games/whist/config/scoringDefaults';
import type { Player, WhistRound, WhistRoundEntry } from '../../../src/games/whist/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function entry(
  bids: number[],
  tricks: number[],
): WhistRoundEntry {
  return {
    bids: { p1: bids[0], p2: bids[1], p3: bids[2], p4: bids[3] },
    tricks: { p1: tricks[0], p2: tricks[1], p3: tricks[2], p4: tricks[3] },
  };
}

describe('computeRoundScores — default config', () => {
  const scoring = cloneDefaultWhistScoring();
  const handSize = 8;

  it('hit bid of 3 with 3 tricks → +8 (5 + 3)', () => {
    // p1 bids 3 takes 3; others fill to handSize=8
    const result = computeRoundScores(entry([3, 2, 2, 0], [3, 4, 0, 1]), handSize, PLAYERS, scoring);
    expect(result.p1).toBe(8);
  });

  it('miss bid by 2 → −2 (default missPenaltyPerTrick = 1)', () => {
    const result = computeRoundScores(entry([3, 2, 2, 0], [3, 4, 0, 1]), handSize, PLAYERS, scoring);
    expect(result.p2).toBe(-2); // bid 2, took 4 → |2-4| × 1 = 2
    expect(result.p3).toBe(-2); // bid 2, took 0 → |2-0| × 1 = 2
    expect(result.p4).toBe(-1); // bid 0, took 1 → |0-1| × 1 = 1
  });

  it('hit bid of 0 with 0 tricks → +5 (hitBonus + 0)', () => {
    const result = computeRoundScores(entry([0, 0, 0, 2], [0, 0, 0, 8]), 8, PLAYERS, scoring);
    expect(result.p1).toBe(5);
  });

  it('hit max bid → 5 + handSize', () => {
    const result = computeRoundScores(entry([8, 0, 0, 0], [8, 0, 0, 0]), 8, PLAYERS, scoring);
    expect(result.p1).toBe(13); // 5 + 8
  });
});

describe('computeRoundScores — config overrides', () => {
  it('zeroBidHitBonus stacks on hitBonus when bid is 0', () => {
    const scoring: WhistScoringConfig = { ...cloneDefaultWhistScoring(), zeroBidHitBonus: 10 };
    const result = computeRoundScores(entry([0, 0, 0, 2], [0, 0, 0, 8]), 8, PLAYERS, scoring);
    expect(result.p1).toBe(15); // 5 + 0 + 10
  });

  it('zeroBidHitBonus does NOT apply when bid is missed', () => {
    const scoring: WhistScoringConfig = { ...cloneDefaultWhistScoring(), zeroBidHitBonus: 10 };
    const result = computeRoundScores(entry([0, 0, 0, 0], [1, 0, 0, 7]), 8, PLAYERS, scoring);
    expect(result.p1).toBe(-1); // missed by 1
  });

  it('maxBidHitBonus = handSize doubles the max-bid payoff', () => {
    const scoring: WhistScoringConfig = { ...cloneDefaultWhistScoring(), maxBidHitBonus: 8 };
    const result = computeRoundScores(entry([8, 0, 0, 0], [8, 0, 0, 0]), 8, PLAYERS, scoring);
    expect(result.p1).toBe(21); // 5 + 8 + 8
  });

  it('higher missPenaltyPerTrick scales penalty linearly', () => {
    const scoring: WhistScoringConfig = { ...cloneDefaultWhistScoring(), missPenaltyPerTrick: 3 };
    const result = computeRoundScores(entry([3, 0, 0, 0], [0, 0, 0, 8]), 8, PLAYERS, scoring);
    expect(result.p1).toBe(-9); // |3-0| × 3
  });
});

describe('totalScores', () => {
  it('sums round scores per player and zero-fills missing', () => {
    const r1: WhistRound = {
      index: 0,
      handSize: 1,
      pickerId: 'p1',
      entry: entry([0, 0, 1, 0], [0, 0, 1, 0]),
      scores: { p1: 5, p2: 5, p3: 6, p4: 5 },
      committedAt: '2026-06-01T00:00:00Z',
    };
    const r2: WhistRound = {
      ...r1,
      index: 1,
      scores: { p1: -1, p2: 10, p3: 0, p4: 0 },
    };
    const totals = totalScores(PLAYERS, [r1, r2]);
    expect(totals).toEqual({ p1: 4, p2: 15, p3: 6, p4: 5 });
  });

  it('returns zeros when no rounds have been played', () => {
    expect(totalScores(PLAYERS, [])).toEqual({ p1: 0, p2: 0, p3: 0, p4: 0 });
  });
});
