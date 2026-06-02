import { describe, expect, it } from 'vitest';
import { validateHandEntry } from '../../../src/games/remi/domain/validation';
import {
  blankPerPlayer,
  type Player,
  type RemiHandEntry,
} from '../../../src/games/remi/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function pp(o: Partial<ReturnType<typeof blankPerPlayer>> = {}) {
  return { ...blankPerPlayer(), ...o };
}

describe('validateHandEntry', () => {
  it('accepts a sound winning hand', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: true, meldedValue: 100, rackValue: 0 }),
        p2: pp({ melded: true, meldedValue: 50, rackValue: 20 }),
      },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(true);
  });

  it('rejects melded=false combined with non-zero meldedValue', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p2',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: false, meldedValue: 30, rackValue: 40 }),
        p2: pp({ melded: true, meldedValue: 100 }),
      },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'meldedFalseWithValue', name: 'Adi' });
  });

  it('rejects negative melded or rack values', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: true, meldedValue: -10 }),
        p2: pp({ melded: true, rackValue: -5 }),
      },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'meldedValueNegative', name: 'Adi' });
    expect(r.errors).toContainEqual({ code: 'rackValueNegative', name: 'Mihai' });
  });

  it('rejects when the winner did not meld', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: false, rackValue: 0 }),
      },
    };
    const r = validateHandEntry(entry, [PLAYERS[0]]);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'winnerDidNotMeld', name: 'Adi' });
  });

  it('rejects when the winner has rackValue > 0', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: true, rackValue: 5 }),
      },
    };
    const r = validateHandEntry(entry, [PLAYERS[0]]);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({
      code: 'winnerHasRackValue',
      name: 'Adi',
      actual: 5,
    });
  });

  it('rejects when the winner has jolyOnRack', () => {
    const entry: RemiHandEntry = {
      winnerId: 'p1',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ melded: true, jolyOnRack: true }),
      },
    };
    const r = validateHandEntry(entry, [PLAYERS[0]]);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'winnerHasJolyOnRack', name: 'Adi' });
  });

  it('rejects selfWin without a winnerId', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: true,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({}) },
    };
    const r = validateHandEntry(entry, [PLAYERS[0]]);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'selfWinWithoutWinner' });
  });

  it('rejects when more than one player is flagged as first Joly melder', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ jolyFirstMelded: true }),
        p2: pp({ jolyFirstMelded: true }),
      },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'multipleFirstMelders' });
  });

  it('rejects an unknown winnerId not in players', () => {
    const entry: RemiHandEntry = {
      winnerId: 'pX',
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({}), p2: pp({}) },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'unknownWinner' });
  });

  it('rejects a missing perPlayer row instead of silently zero-filling it', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: { p1: pp({}) },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'missingPerPlayerEntry', name: 'Mihai' });
  });

  it('rejects more than one identical-exposed declarant', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: false,
      perPlayer: {
        p1: pp({ declaredIdenticalExposed: true }),
        p2: pp({ declaredIdenticalExposed: true }),
      },
    };
    const r = validateHandEntry(entry, PLAYERS.slice(0, 2));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'multipleIdenticalExposedDeclarants' });
  });

  it('rejects winnerDiscardedJoly=true when there is no winner', () => {
    const entry: RemiHandEntry = {
      winnerId: null,
      selfWin: false,
      winnerDiscardedJoly: true,
      perPlayer: { p1: pp({}) },
    };
    const r = validateHandEntry(entry, [PLAYERS[0]]);
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual({ code: 'discardedJolyWithoutWinner' });
  });
});
