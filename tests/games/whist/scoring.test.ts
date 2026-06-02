import { describe, expect, it } from 'vitest';
import {
  computeRoundScores,
  priorStreaks,
  totalScores,
} from '../../../src/games/whist/domain/scoring';
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

describe('priorStreaks helper', () => {
  function round(idx: number, handSize: number, bids: number[], tricks: number[]): WhistRound {
    return {
      index: idx,
      handSize,
      pickerId: PLAYERS[idx % PLAYERS.length].id,
      entry: entry(bids, tricks),
      scores: {},
      committedAt: '2026-06-02T00:00:00Z',
    };
  }

  it('returns zero for every player on an empty history', () => {
    expect(priorStreaks(PLAYERS, [])).toEqual({ p1: 0, p2: 0, p3: 0, p4: 0 });
  });

  it('grows the streak on a hit in a non-1 round', () => {
    const rounds = [round(0, 4, [2, 2, 0, 0], [2, 2, 0, 0])];
    expect(priorStreaks(PLAYERS, rounds)).toEqual({ p1: 1, p2: 1, p3: 1, p4: 1 });
  });

  it('resets the streak on a miss in a non-1 round', () => {
    const rounds = [
      round(0, 4, [2, 2, 0, 0], [2, 2, 0, 0]), // all hit
      round(1, 4, [2, 1, 0, 1], [3, 1, 0, 0]), // p1 misses, p4 misses
    ];
    expect(priorStreaks(PLAYERS, rounds)).toEqual({ p1: 0, p2: 2, p3: 2, p4: 0 });
  });

  it('skips hand-size-1 rounds — they neither grow nor break the streak', () => {
    const rounds = [
      round(0, 4, [2, 2, 0, 0], [2, 2, 0, 0]), // all hit → 1
      round(1, 1, [0, 0, 0, 1], [0, 1, 0, 0]), // 1-round: skipped entirely
      round(2, 4, [2, 2, 0, 0], [2, 2, 0, 0]), // all hit → 2
    ];
    expect(priorStreaks(PLAYERS, rounds)).toEqual({ p1: 2, p2: 2, p3: 2, p4: 2 });
  });
});

describe('computeRoundScores — premiere streak bonus', () => {
  function round(idx: number, handSize: number, bids: number[], tricks: number[]): WhistRound {
    return {
      index: idx,
      handSize,
      pickerId: PLAYERS[idx % PLAYERS.length].id,
      entry: entry(bids, tricks),
      scores: {},
      committedAt: '2026-06-02T00:00:00Z',
    };
  }

  const scoring = cloneDefaultWhistScoring(); // premiereStreakLength=5, premiereBonus=10

  it('awards +10 on the 5th consecutive hit in a non-1 round', () => {
    const prior: Record<string, number> = { p1: 4, p2: 0, p3: 0, p4: 0 };
    // p1 hits bid 2 with tricks 2 (handSize 4). Streak goes 4 → 5, bonus fires.
    const result = computeRoundScores(entry([2, 2, 0, 0], [2, 2, 0, 0]), 4, PLAYERS, scoring, prior);
    // p1: hitBonus 5 + tricks 2 + premiere 10 = 17
    // p2 hits but streak is only 1
    expect(result.p1).toBe(17);
    expect(result.p2).toBe(7);
  });

  it('does NOT award the premiere on a 1-card round even when streak would otherwise hit 5', () => {
    const prior: Record<string, number> = { p1: 4, p2: 0, p3: 0, p4: 0 };
    // Hand size 1 — 1-rounds are excluded from the streak.
    const result = computeRoundScores(entry([1, 0, 0, 0], [1, 0, 0, 0]), 1, PLAYERS, scoring, prior);
    expect(result.p1).toBe(6); // hitBonus 5 + tricks 1, no premiere
  });

  it('awards the premiere again on every multiple of the streak length', () => {
    const prior: Record<string, number> = { p1: 9, p2: 0, p3: 0, p4: 0 };
    // Streak 9 → 10, second multiple of 5, second premiere.
    const result = computeRoundScores(entry([2, 2, 0, 0], [2, 2, 0, 0]), 4, PLAYERS, scoring, prior);
    expect(result.p1).toBe(17); // same +10 bonus
  });

  it('does NOT award the premiere on a miss, even at a multiple-of-5 prior streak', () => {
    const prior: Record<string, number> = { p1: 4, p2: 0, p3: 0, p4: 0 };
    const result = computeRoundScores(entry([3, 1, 2, 2], [2, 2, 2, 2]), 8, PLAYERS, scoring, prior);
    // p1 missed by 1 — premiere doesn't fire
    expect(result.p1).toBe(-1);
  });

  it('does NOT award the premiere when premiereBonus is 0 (rule disabled)', () => {
    const scoringOff: WhistScoringConfig = { ...scoring, premiereBonus: 0 };
    const prior: Record<string, number> = { p1: 4 };
    const result = computeRoundScores(entry([2, 0, 0, 0], [2, 0, 0, 0]), 4, [PLAYERS[0]], scoringOff, prior);
    expect(result.p1).toBe(7); // hitBonus 5 + tricks 2, no bonus
  });

  it('full streak flow: 5 wins in a row across non-1 rounds gives +10 on the 5th', () => {
    // Build a synthetic history: 4 prior non-1 hits for p1, then this is hit #5.
    const rounds: WhistRound[] = [
      round(0, 1, [0, 0, 0, 1], [0, 0, 0, 1]), // 1-round (skipped) — p4 hits
      round(1, 2, [1, 0, 0, 1], [1, 0, 0, 1]), // p1 hits #1
      round(2, 3, [1, 0, 0, 2], [1, 0, 0, 2]), // p1 hits #2
      round(3, 4, [1, 0, 0, 3], [1, 0, 0, 3]), // p1 hits #3
      round(4, 5, [1, 0, 0, 4], [1, 0, 0, 4]), // p1 hits #4
    ];
    const prior = priorStreaks(PLAYERS, rounds);
    expect(prior.p1).toBe(4);

    // Next non-1 round: p1 hits #5 — premiere fires.
    const result = computeRoundScores(entry([1, 0, 0, 5], [1, 0, 0, 5]), 6, PLAYERS, scoring, prior);
    expect(result.p1).toBe(5 + 1 + 10); // hitBonus + tricks + premiere
  });
});
