import { describe, expect, it } from 'vitest';
import { cloneDefaultScoring } from '../src/config/scoringDefaults';
import { computeRoundScores, totalScores } from '../src/domain/scoring';
import { signed } from '../src/domain/contracts';
import { validateRoundEntry } from '../src/domain/validation';
import type { Player } from '../src/domain/types';

function makePlayers(n: 4 | 5 | 6): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
}

describe('noTricks scoring', () => {
  it('assigns signed perTrick × count for each player', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const per = signed('noTricks', scoring.noTricks.perTrick);
    const scores = computeRoundScores(
      { contract: 'noTricks', counts: { p1: 3, p2: 0, p3: 5, p4: 0 } },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 3 * per, p2: 0, p3: 5 * per, p4: 0 });
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

  it('assigns signed perQueen × count', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const per = signed('noQueens', scoring.noQueens.perQueen);
    const scores = computeRoundScores(
      { contract: 'noQueens', counts: { p1: 4, p2: 0, p3: 0, p4: 0 } },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 4 * per, p2: 0, p3: 0, p4: 0 });
  });
});

describe('noKingOfHearts scoring', () => {
  it('puts the signed penalty on the taker, 0 on everyone else', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const value = signed('noKingOfHearts', scoring.noKingOfHearts.takingIt);
    const scores = computeRoundScores(
      { contract: 'noKingOfHearts', takerId: 'p3' },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 0, p2: 0, p3: value, p4: 0 });
    expect(value).toBeLessThan(0);
  });
});

describe('tenOfClubs scoring', () => {
  it('puts the bonus on the taker (always positive)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const value = signed('tenOfClubs', scoring.tenOfClubs.takingIt);
    const scores = computeRoundScores(
      { contract: 'tenOfClubs', takerId: 'p2' },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 0, p2: value, p3: 0, p4: 0 });
    expect(value).toBeGreaterThan(0);
  });
});

describe('totals scoring', () => {
  it('sums all four negative penalties for the worst-case player', () => {
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
    const rawSum =
      8 * signed('noTricks', scoring.noTricks.perTrick) +
      8 * signed('noDiamonds', scoring.noDiamonds.perDiamond) +
      4 * signed('noQueens', scoring.noQueens.perQueen) +
      signed('noKingOfHearts', scoring.noKingOfHearts.takingIt);
    expect(scores.p1).toBe(rawSum);
    expect(scores.p2).toBe(0);
    expect(scores.p3).toBe(0);
    expect(scores.p4).toBe(0);
  });
});

describe('whist scoring', () => {
  it('assigns signed perTrick × tricks (always non-negative since whist is positive)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const per = signed('whist', scoring.whist.perTrick);
    const scores = computeRoundScores(
      { contract: 'whist', counts: { p1: 3, p2: 2, p3: 2, p4: 1 } },
      players,
      scoring,
    );
    expect(scores).toEqual({ p1: 3 * per, p2: 2 * per, p3: 2 * per, p4: 1 * per });
    expect(per).toBeGreaterThan(0);
  });
});

describe('rentz scoring', () => {
  it('assigns position points in finishing order (last earns 0)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const pts = scoring.rentz.byPosition[4];
    const scores = computeRoundScores(
      { contract: 'rentz', finishingOrder: ['p3', 'p1', 'p4', 'p2'] },
      players,
      scoring,
    );
    expect(scores).toEqual({ p3: pts[0], p1: pts[1], p4: pts[2], p2: pts[3] });
    expect(pts[pts.length - 1]).toBe(0);
  });

  it('never scores negative for any position with default config', () => {
    const players = makePlayers(6);
    const scoring = cloneDefaultScoring();
    const scores = computeRoundScores(
      { contract: 'rentz', finishingOrder: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] },
      players,
      scoring,
    );
    for (const v of Object.values(scores)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
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

describe('blind eligibility', () => {
  it('rentz cannot be played blind', async () => {
    const { canBeBlind } = await import('../src/domain/contracts');
    expect(canBeBlind('rentz')).toBe(false);
  });

  it('every other contract can be played blind', async () => {
    const { canBeBlind } = await import('../src/domain/contracts');
    for (const c of [
      'noTricks',
      'noDiamonds',
      'noQueens',
      'noKingOfHearts',
      'tenOfClubs',
      'totals',
      'whist',
    ] as const) {
      expect(canBeBlind(c)).toBe(true);
    }
  });
});

describe('blind multiplier', () => {
  it("multiplies every player's score by blindMultiplier when blind=true", () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const per = signed('noTricks', scoring.noTricks.perTrick);
    const m = scoring.blindMultiplier;
    const scores = computeRoundScores(
      { contract: 'noTricks', counts: { p1: 3, p2: 0, p3: 5, p4: 0 } },
      players,
      scoring,
      true,
    );
    expect(scores).toEqual({ p1: 3 * per * m, p2: 0, p3: 5 * per * m, p4: 0 });
  });

  it('applies blindMultiplier to a Totals round (no other multiplier in play)', () => {
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
      true,
    );
    const rawSum =
      8 * signed('noTricks', scoring.noTricks.perTrick) +
      8 * signed('noDiamonds', scoring.noDiamonds.perDiamond) +
      4 * signed('noQueens', scoring.noQueens.perQueen) +
      signed('noKingOfHearts', scoring.noKingOfHearts.takingIt);
    expect(scores.p1).toBe(rawSum * scoring.blindMultiplier);
    expect(scores.p2).toBe(0);
  });

  it('respects a custom blindMultiplier value', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    scoring.blindMultiplier = 3;
    const value = signed('tenOfClubs', scoring.tenOfClubs.takingIt);
    const scores = computeRoundScores(
      { contract: 'tenOfClubs', takerId: 'p2' },
      players,
      scoring,
      true,
    );
    expect(scores).toEqual({ p1: 0, p2: value * 3, p3: 0, p4: 0 });
  });

  it('does not modify scores when blind=false (default)', () => {
    const players = makePlayers(4);
    const scoring = cloneDefaultScoring();
    const per = signed('whist', scoring.whist.perTrick);
    const plain = computeRoundScores(
      { contract: 'whist', counts: { p1: 3, p2: 2, p3: 2, p4: 1 } },
      players,
      scoring,
    );
    expect(plain).toEqual({ p1: 3 * per, p2: 2 * per, p3: 2 * per, p4: 1 * per });
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
