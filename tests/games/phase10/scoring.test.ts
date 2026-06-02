import { describe, expect, it } from 'vitest';
import { computeHandScores, totalScores } from '../../../src/games/phase10/domain/scoring';
import type {
  Player,
  Phase10Hand,
  Phase10HandEntry,
} from '../../../src/games/phase10/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function entry(
  wentOutId: string,
  pens: [number, number, number, number],
  completed: [boolean, boolean, boolean, boolean] = [false, false, false, false],
): Phase10HandEntry {
  return {
    wentOutId,
    remainingPenalty: { p1: pens[0], p2: pens[1], p3: pens[2], p4: pens[3] },
    completedPhase: { p1: completed[0], p2: completed[1], p3: completed[2], p4: completed[3] },
  };
}

function hand(idx: number, e: Phase10HandEntry): Phase10Hand {
  return { ...e, index: idx, committedAt: '2026-06-02T00:00:00Z' };
}

describe('computeHandScores', () => {
  it('wentOut player gets 0; others get their remainingPenalty', () => {
    const result = computeHandScores(entry('p1', [0, 25, 35, 15]), PLAYERS);
    expect(result).toEqual({ p1: 0, p2: 25, p3: 35, p4: 15 });
  });

  it('treats missing penalty values as 0', () => {
    const e: Phase10HandEntry = {
      wentOutId: 'p1',
      remainingPenalty: { p1: 0, p2: 25 },
      completedPhase: { p1: true, p2: false, p3: false, p4: false },
    };
    const result = computeHandScores(e, PLAYERS);
    expect(result).toEqual({ p1: 0, p2: 25, p3: 0, p4: 0 });
  });
});

describe('totalScores', () => {
  it('sums hand scores across all hands, ignoring missing entries', () => {
    const h1 = hand(0, entry('p1', [0, 25, 35, 15]));
    const h2 = hand(1, entry('p2', [40, 0, 10, 30]));
    const totals = totalScores(PLAYERS, [h1, h2]);
    expect(totals).toEqual({ p1: 40, p2: 25, p3: 45, p4: 45 });
  });

  it('returns zeros when no hands have been played', () => {
    expect(totalScores(PLAYERS, [])).toEqual({ p1: 0, p2: 0, p3: 0, p4: 0 });
  });
});
