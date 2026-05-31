import { describe, expect, it } from 'vitest';
import { cloneDefaultScoring } from '../src/config/scoringDefaults';
import { computeRoundScores, totalScores } from '../src/domain/scoring';
import { validateRoundEntry } from '../src/domain/validation';
import type { Player } from '../src/domain/types';

function makePlayers(n: 4 | 5 | 6): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
}

describe('noTricks scoring', () => {
  it('assigns -2 per trick taken (default)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'noTricks', counts: { p1: 3, p2: 0, p3: 5, p4: 0 } },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: -6, p2: 0, p3: -10, p4: 0 });
  });

  it('rejects entries whose tricks do not sum to 8', () => {
    const players = makePlayers(4);
    const r = validateRoundEntry(
      { contract: 'noTricks', counts: { p1: 1, p2: 1, p3: 1, p4: 1 } },
      players,
    );
    expect(r.ok).toBe(false);
  });

  it('accepts entries whose tricks sum to 8', () => {
    const players = makePlayers(4);
    const r = validateRoundEntry(
      { contract: 'noTricks', counts: { p1: 2, p2: 2, p3: 2, p4: 2 } },
      players,
    );
    expect(r.ok).toBe(true);
  });
});

describe('noDiamonds scoring', () => {
  it('uses 8 diamonds for 4 players', () => {
    const players = makePlayers(4);
    const r = validateRoundEntry(
      { contract: 'noDiamonds', counts: { p1: 2, p2: 2, p3: 2, p4: 2 } },
      players,
    );
    expect(r.ok).toBe(true);
  });

  it('uses 10 diamonds for 5 players', () => {
    const players = makePlayers(5);
    const r = validateRoundEntry(
      { contract: 'noDiamonds', counts: { p1: 2, p2: 2, p3: 2, p4: 2, p5: 2 } },
      players,
    );
    expect(r.ok).toBe(true);
  });

  it('uses 12 diamonds for 6 players', () => {
    const players = makePlayers(6);
    const r = validateRoundEntry(
      { contract: 'noDiamonds', counts: { p1: 2, p2: 2, p3: 2, p4: 2, p5: 2, p6: 2 } },
      players,
    );
    expect(r.ok).toBe(true);
  });
});

describe('noQueens scoring', () => {
  it('always expects 4 queens regardless of player count', () => {
    const r5 = validateRoundEntry(
      {
        contract: 'noQueens',
        counts: { p1: 1, p2: 1, p3: 1, p4: 1, p5: 0 },
      },
      makePlayers(5),
    );
    expect(r5.ok).toBe(true);

    const r6 = validateRoundEntry(
      {
        contract: 'noQueens',
        counts: { p1: 2, p2: 2, p3: 0, p4: 0, p5: 0, p6: 0 },
      },
      makePlayers(6),
    );
    expect(r6.ok).toBe(true);
  });

  it('assigns -6 per queen', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'noQueens', counts: { p1: 4, p2: 0, p3: 0, p4: 0 } },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: -24, p2: 0, p3: 0, p4: 0 });
  });
});

describe('noKingOfHearts scoring', () => {
  it('puts -20 on the taker, 0 on everyone else', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'noKingOfHearts', takerId: 'p3' },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 0, p2: 0, p3: -20, p4: 0 });
  });
});

describe('tenOfClubs scoring', () => {
  it('puts +10 on the taker', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'tenOfClubs', takerId: 'p2' },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 0, p2: 10, p3: 0, p4: 0 });
  });
});

describe('totals scoring', () => {
  it('sums all negatives and multiplies by 2 (default)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      {
        contract: 'totals',
        tricks: { p1: 8, p2: 0, p3: 0, p4: 0 },
        diamonds: { p1: 8, p2: 0, p3: 0, p4: 0 },
        queens: { p1: 4, p2: 0, p3: 0, p4: 0 },
        kingOfHeartsTakerId: 'p1',
      },
      players,
      scoring,
    );
    const expectedP1 = (-2 * 8 + -2 * 8 + -6 * 4 + -20) * 2;
    expect(scores.p1).toBe(expectedP1);
    expect(scores.p2).toBe(0);
    expect(scores.p3).toBe(0);
    expect(scores.p4).toBe(0);
  });
});

describe('whist scoring', () => {
  it('assigns +2 per trick (default)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'whist', counts: { p1: 3, p2: 2, p3: 2, p4: 1 } },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 6, p2: 4, p3: 4, p4: 2 });
  });
});

describe('rentz scoring', () => {
  it('assigns position points in finishing order (4 players)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'rentz', finishingOrder: ['p3', 'p1', 'p4', 'p2'] },
      players,
      scoring,
    );
    expect(scores).toEqual({ p3: 30, p1: 20, p4: -10, p2: -20 });
  });

  it('rejects entries missing players', () => {
    const players = makePlayers(4);
    const r = validateRoundEntry(
      { contract: 'rentz', finishingOrder: ['p1', 'p2', 'p3'] },
      players,
    );
    expect(r.ok).toBe(false);
  });

  it('rejects duplicate players', () => {
    const players = makePlayers(4);
    const r = validateRoundEntry(
      { contract: 'rentz', finishingOrder: ['p1', 'p2', 'p3', 'p1'] },
      players,
    );
    expect(r.ok).toBe(false);
  });
});

describe('totalScores', () => {
  it('sums per-player across rounds', () => {
    const players = makePlayers(4);
    const totals = totalScores(players, [
      { scores: { p1: 10, p2: -10, p3: 0, p4: 0 } },
      { scores: { p1: -5, p2: 5, p3: 5, p4: -5 } },
      { scores: { p1: 0, p2: 0, p3: 10, p4: -10 } },
    ]);
    expect(totals).toEqual({ p1: 5, p2: -5, p3: 15, p4: -15 });
  });
});
