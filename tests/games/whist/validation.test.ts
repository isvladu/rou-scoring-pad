import { describe, expect, it } from 'vitest';
import { validateRoundEntry } from '../../../src/games/whist/domain/validation';
import {
  cloneDefaultWhistScoring,
  type WhistScoringConfig,
} from '../../../src/games/whist/config/scoringDefaults';
import type { Player, WhistRoundEntry } from '../../../src/games/whist/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function entry(bids: number[], tricks: number[]): WhistRoundEntry {
  return {
    bids: { p1: bids[0], p2: bids[1], p3: bids[2], p4: bids[3] },
    tricks: { p1: tricks[0], p2: tricks[1], p3: tricks[2], p4: tricks[3] },
  };
}

describe('validateRoundEntry', () => {
  const scoring = cloneDefaultWhistScoring();

  it('accepts a sound round with dealer constraint satisfied', () => {
    const r = validateRoundEntry(entry([3, 2, 2, 0], [3, 4, 0, 1]), 8, PLAYERS, scoring);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('returns tricksSumMismatch when tricks do not total handSize', () => {
    const r = validateRoundEntry(entry([3, 2, 2, 0], [3, 3, 0, 1]), 8, PLAYERS, scoring);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'tricksSumMismatch', expected: 8, actual: 7 });
  });

  it('returns dealerConstraint when bids sum to handSize (default enforced)', () => {
    const r = validateRoundEntry(entry([2, 2, 2, 2], [2, 2, 2, 2]), 8, PLAYERS, scoring);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'dealerConstraint', handSize: 8 });
  });

  it('allows bids === handSize when constraint disabled', () => {
    const lax: WhistScoringConfig = { ...scoring, enforceDealerConstraint: false };
    const r = validateRoundEntry(entry([2, 2, 2, 2], [2, 2, 2, 2]), 8, PLAYERS, lax);
    expect(r.ok).toBe(true);
  });

  it('returns bidOutOfRange for bids above handSize', () => {
    const r = validateRoundEntry(entry([9, 0, 0, 0], [8, 0, 0, 0]), 8, PLAYERS, scoring);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'bidOutOfRange', name: 'Adi', max: 8 });
  });

  it('returns bidOutOfRange for non-integer bids', () => {
    const r = validateRoundEntry(
      { bids: { p1: 1.5, p2: 0, p3: 0, p4: 0 }, tricks: { p1: 8, p2: 0, p3: 0, p4: 0 } },
      8,
      PLAYERS,
      scoring,
    );
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === 'bidOutOfRange' && e.name === 'Adi')).toBe(true);
  });

  it('returns errors for missing per-player values', () => {
    const r = validateRoundEntry(
      { bids: { p1: 0, p2: 0, p3: 0 }, tricks: { p1: 0, p2: 0, p3: 0 } } as WhistRoundEntry,
      1,
      PLAYERS,
      scoring,
    );
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === 'bidOutOfRange' && e.name === 'Ioana')).toBe(true);
    expect(r.errors.some((e) => e.code === 'tricksOutOfRange' && e.name === 'Ioana')).toBe(true);
  });
});
