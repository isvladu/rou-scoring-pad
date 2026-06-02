import { describe, expect, it } from 'vitest';
import { computeHandScores, totalScores } from '../../../src/games/remi/domain/scoring';
import {
  cloneDefaultRemiScoring,
  type RemiScoringConfig,
} from '../../../src/games/remi/config/scoringDefaults';
import {
  blankPerPlayer,
  type Player,
  type RemiHand,
  type RemiHandEntry,
  type RemiPerPlayerEntry,
} from '../../../src/games/remi/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function pp(overrides: Partial<RemiPerPlayerEntry> = {}): RemiPerPlayerEntry {
  return { ...blankPerPlayer(), ...overrides };
}

describe('computeHandScores — worked example from the spec', () => {
  const scoring = cloneDefaultRemiScoring();

  const entry: RemiHandEntry = {
    winnerId: 'p1',
    selfWin: true,
    winnerDiscardedJoly: false,
    perPlayer: {
      p1: pp({ melded: true, meldedValue: 85, rackValue: 0, jolyFirstMelded: true }),
      p2: pp({ melded: true, meldedValue: 60, rackValue: 35, declaredIdenticalExposed: true }),
      p3: pp({ melded: false, meldedValue: 0, rackValue: 70, jolyOnRack: true }),
      p4: pp({ melded: true, meldedValue: 40, rackValue: 15 }),
    },
  };

  it('Adi the winner with self-win + Joly first-meld → 85 + 100 + 100 + 50 = 335', () => {
    expect(computeHandScores(entry, PLAYERS, scoring).p1).toBe(335);
  });

  it('Mihai with identical-exposed declaration → 60 − 35 + 25 = 50', () => {
    expect(computeHandScores(entry, PLAYERS, scoring).p2).toBe(50);
  });

  it('Dan with no-meld + Joly-on-rack in fixed mode → −200 − 25 = −225', () => {
    expect(computeHandScores(entry, PLAYERS, scoring).p3).toBe(-225);
  });

  it('Ioana plain → 40 − 15 = 25', () => {
    expect(computeHandScores(entry, PLAYERS, scoring).p4).toBe(25);
  });
});

describe('computeHandScores — winnerBonus and selfWinBonus', () => {
  const scoring = cloneDefaultRemiScoring();

  it('winnerBonus added once for the winning player', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({ meldedValue: 70 }) },
    };
    expect(computeHandScores(entry, [PLAYERS[0]], scoring).p1).toBe(170);
  });

  it('selfWinBonus only applies when winnerId is set', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: true,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({ meldedValue: 70 }) },
    };
    expect(computeHandScores(entry, [PLAYERS[0]], scoring).p1).toBe(270);
  });

  it('no winnerBonus when winnerId is null (wall ran out)', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({ meldedValue: 70, rackValue: 5 }) },
    };
    expect(computeHandScores(entry, [PLAYERS[0]], scoring).p1).toBe(65);
  });
});

describe('computeHandScores — no-meld penalty modes', () => {
  it('fixed mode: −noMeldPenalty regardless of rack value', () => {
    const scoring = cloneDefaultRemiScoring();
    const entry: RemiHandEntry = {
      winnerId: 'p2',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: false, rackValue: 70 }),
        p2: pp({ meldedValue: 80 }),
      },
    };
    expect(computeHandScores(entry, PLAYERS.slice(0, 2), scoring).p1).toBe(-200);
  });

  it('rackBased mode: −100 − rackValue', () => {
    const scoring: RemiScoringConfig = {
      ...cloneDefaultRemiScoring(),
      noMeldPenaltyMode: 'rackBased',
    };
    const entry: RemiHandEntry = {
      winnerId: 'p2',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: false, rackValue: 70 }),
        p2: pp({ meldedValue: 80 }),
      },
    };
    expect(computeHandScores(entry, PLAYERS.slice(0, 2), scoring).p1).toBe(-170);
  });

  it('Joly-on-rack still applies on top of the no-meld branch in fixed mode', () => {
    const scoring = cloneDefaultRemiScoring();
    const entry: RemiHandEntry = {
      winnerId: 'p2',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: false, rackValue: 70, jolyOnRack: true }),
        p2: pp({ meldedValue: 80 }),
      },
    };
    expect(computeHandScores(entry, PLAYERS.slice(0, 2), scoring).p1).toBe(-225);
  });
});

describe('computeHandScores — flag adjustments', () => {
  const scoring = cloneDefaultRemiScoring();

  it('identicalExposedBonus applied per declarant', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ meldedValue: 50, declaredIdenticalExposed: true }),
      },
    };
    expect(computeHandScores(entry, [PLAYERS[0]], scoring).p1).toBe(75);
  });

  it('jolyFirstMelded gives +50 (default) to that player only', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ meldedValue: 50, jolyFirstMelded: true }),
        p2: pp({ meldedValue: 50 }),
      },
    };
    const out = computeHandScores(entry, PLAYERS.slice(0, 2), scoring);
    expect(out.p1).toBe(100);
    expect(out.p2).toBe(50);
  });
});

describe('computeHandScores — doubleScoreOnJolyDiscardWin', () => {
  it('doubles the winner score when both the rule is on AND the flag is set', () => {
    const scoring: RemiScoringConfig = {
      ...cloneDefaultRemiScoring(),
      doubleScoreOnJolyDiscardWin: true,
    };
    // Adi wins with self-win + Joly first-meld; base = 85 + 100 + 100 + 50 = 335; ×2 = 670.
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: true,
      winnerDiscardedJoly: true,
      perPlayer: {
        p1: pp({ melded: true, meldedValue: 85, rackValue: 0, jolyFirstMelded: true }),
        p2: pp({ melded: true, meldedValue: 60, rackValue: 35 }),
      },
    };
    const out = computeHandScores(entry, PLAYERS.slice(0, 2), scoring);
    expect(out.p1).toBe(670);
    // Other players unaffected.
    expect(out.p2).toBe(25);
  });

  it('does not double when the rule is off, even if the flag is set', () => {
    const scoring = cloneDefaultRemiScoring(); // rule defaults to false
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: true,
      perPlayer: { p1: pp({ meldedValue: 70 }) },
    };
    expect(computeHandScores(entry, [PLAYERS[0]], scoring).p1).toBe(170);
  });

  it('does not double when the flag is unset, even if the rule is on', () => {
    const scoring: RemiScoringConfig = {
      ...cloneDefaultRemiScoring(),
      doubleScoreOnJolyDiscardWin: true,
    };
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({ meldedValue: 70 }) },
    };
    expect(computeHandScores(entry, [PLAYERS[0]], scoring).p1).toBe(170);
  });
});

describe('totalScores', () => {
  it('sums per-hand scores across the game', () => {
    const h0: RemiHand = {
      index: 0,
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ meldedValue: 100 }),
        p2: pp({ meldedValue: 50, rackValue: 10 }),
      },
      scores: { p1: 200, p2: 40 },
      committedAt: '2026-06-02T00:00:00Z',
    };
    const h1: RemiHand = {
      index: 1,
      winnerId: 'p2',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {},
      scores: { p1: -50, p2: 175 },
      committedAt: '2026-06-02T00:01:00Z',
    };
    expect(totalScores(PLAYERS.slice(0, 2), [h0, h1])).toEqual({ p1: 150, p2: 215 });
  });
});
