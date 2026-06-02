import { describe, expect, it } from 'vitest';
import { validateHandEntry } from '../../../src/games/phase10/domain/validation';
import type {
  Phase10HandEntry,
  Player,
} from '../../../src/games/phase10/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function entry(
  wentOutId: string,
  pens: Record<string, number>,
  completed: Record<string, boolean> = {},
): Phase10HandEntry {
  return {
    wentOutId,
    remainingPenalty: pens,
    completedPhase: {
      p1: completed.p1 ?? false,
      p2: completed.p2 ?? false,
      p3: completed.p3 ?? false,
      p4: completed.p4 ?? false,
    },
  };
}

describe('validateHandEntry', () => {
  it('accepts a sound hand', () => {
    const r = validateHandEntry(
      entry('p1', { p1: 0, p2: 25, p3: 35, p4: 15 }),
      PLAYERS,
    );
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects when wentOutId is empty', () => {
    const r = validateHandEntry(
      entry('', { p1: 0, p2: 0, p3: 0, p4: 0 }),
      PLAYERS,
    );
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'noWentOut' });
  });

  it('rejects when wentOutId does not match any player', () => {
    const r = validateHandEntry(
      entry('pX', { p1: 0, p2: 0, p3: 0, p4: 0 }),
      PLAYERS,
    );
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'unknownWentOut' });
  });

  it('rejects when the wentOut player has a non-zero penalty', () => {
    const r = validateHandEntry(
      entry('p1', { p1: 5, p2: 0, p3: 0, p4: 0 }),
      PLAYERS,
    );
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({
      code: 'wentOutMustHaveZeroPenalty',
      name: 'Adi',
      actual: 5,
    });
  });

  it('rejects non-integer or negative penalties', () => {
    const r = validateHandEntry(
      entry('p1', { p1: 0, p2: -5, p3: 3.5, p4: 10 }),
      PLAYERS,
    );
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'penaltyMustBeNonNegInt', name: 'Mihai' });
    expect(r.errors).toContainEqual({ code: 'penaltyMustBeNonNegInt', name: 'Dan' });
  });

  it('rejects missing per-player penalty values', () => {
    const r = validateHandEntry(
      entry('p1', { p1: 0, p2: 10, p3: 5 }),
      PLAYERS,
    );
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === 'penaltyMustBeNonNegInt' && e.name === 'Ioana')).toBe(true);
  });
});
