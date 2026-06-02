import { describe, expect, it } from 'vitest';
import {
  currentPhase,
  displayPhase,
  hasClearedAllPhases,
  isGameOver,
  winnerOf,
} from '../../../src/games/phase10/domain/phases';
import type {
  Phase10Game,
  Phase10Hand,
  Phase10HandEntry,
  Player,
} from '../../../src/games/phase10/domain/types';
import { cloneDefaultPhase10Scoring } from '../../../src/games/phase10/config/scoringDefaults';
import { totalScores } from '../../../src/games/phase10/domain/scoring';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

function makeHand(idx: number, e: Phase10HandEntry): Phase10Hand {
  return { ...e, index: idx, committedAt: '2026-06-02T00:00:00Z' };
}

function entry(
  wentOutId: string,
  completed: Partial<Record<string, boolean>>,
  pens: Partial<Record<string, number>> = {},
): Phase10HandEntry {
  return {
    wentOutId,
    remainingPenalty: {
      p1: pens.p1 ?? 0,
      p2: pens.p2 ?? 0,
      p3: pens.p3 ?? 0,
      p4: pens.p4 ?? 0,
    },
    completedPhase: {
      p1: completed.p1 ?? false,
      p2: completed.p2 ?? false,
      p3: completed.p3 ?? false,
      p4: completed.p4 ?? false,
    },
  };
}

function makeGame(hands: Phase10Hand[]): Phase10Game {
  return {
    id: 'g',
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: '2026-06-02T00:00:00Z',
    players: PLAYERS,
    scoring: cloneDefaultPhase10Scoring(),
    hands,
    status: 'in_progress',
  };
}

describe('currentPhase', () => {
  it('starts at phase 1 for everyone', () => {
    for (const p of PLAYERS) expect(currentPhase(p.id, [])).toBe(1);
  });

  it('advances only players whose completedPhase is true that hand', () => {
    const hands = [
      makeHand(0, entry('p1', { p1: true, p3: true })),
      makeHand(1, entry('p2', { p2: true })),
    ];
    expect(currentPhase('p1', hands)).toBe(2);
    expect(currentPhase('p2', hands)).toBe(2);
    expect(currentPhase('p3', hands)).toBe(2);
    expect(currentPhase('p4', hands)).toBe(1);
  });

  it('returns 11 once a player has cleared all 10 phases', () => {
    const hands = Array.from({ length: 10 }, (_, i) =>
      makeHand(i, entry('p1', { p1: true })),
    );
    expect(currentPhase('p1', hands)).toBe(11);
    expect(displayPhase('p1', hands)).toBe(10);
    expect(hasClearedAllPhases('p1', hands)).toBe(true);
  });
});

describe('isGameOver', () => {
  it('false before any hand', () => {
    expect(isGameOver(makeGame([]))).toBe(false);
  });

  it('false while the just-went-out player is still on phase <= 10', () => {
    const hands = Array.from({ length: 9 }, (_, i) =>
      makeHand(i, entry('p1', { p1: true })),
    );
    expect(isGameOver(makeGame(hands))).toBe(false);
  });

  it('true once the wentOut player has cleared phase 10', () => {
    const hands = Array.from({ length: 10 }, (_, i) =>
      makeHand(i, entry('p1', { p1: true })),
    );
    expect(isGameOver(makeGame(hands))).toBe(true);
  });

  it('stays false when an earlier non-wentOut player cleared all phases but the latest wentOut has not', () => {
    // p1 completes phase 10 in hand 9 WITHOUT going out (someone else did)
    const hands: Phase10Hand[] = [];
    for (let i = 0; i < 10; i++) {
      hands.push(makeHand(i, entry('p2', { p1: true, p2: true })));
    }
    // Last wentOut was p2 who is now on phase 11 too — game IS over.
    // Adjust: make the last hand's wentOut be p3 who is only on phase 1.
    hands[9] = makeHand(9, entry('p3', { p1: true, p2: true, p3: false }));
    expect(isGameOver(makeGame(hands))).toBe(false);
  });
});

describe('winnerOf', () => {
  it('is null while the game is in progress', () => {
    expect(winnerOf(makeGame([]), () => 0)).toBeNull();
  });

  it('returns the only finisher when one player has cleared all phases', () => {
    const hands = Array.from({ length: 10 }, (_, i) =>
      makeHand(i, entry('p1', { p1: true }, { p2: 5 })),
    );
    const game = makeGame(hands);
    const totals = totalScores(game.players, game.hands);
    const w = winnerOf(game, (id) => totals[id] ?? 0);
    expect(w?.id).toBe('p1');
  });

  it('breaks ties by lowest total penalty among phase-10 finishers', () => {
    // Both p1 and p2 clear all 10 phases over the same 10 hands, but p1
    // accumulated more penalty along the way.
    const hands: Phase10Hand[] = [];
    for (let i = 0; i < 9; i++) {
      hands.push(
        makeHand(
          i,
          entry('p3', { p1: true, p2: true }, { p1: 30, p2: 5 }),
        ),
      );
    }
    // Last hand: p2 went out + completed phase 10. p1 also completes phase 10.
    hands.push(
      makeHand(
        9,
        entry('p2', { p1: true, p2: true }, { p1: 20 }),
      ),
    );
    const game = makeGame(hands);
    const totals = totalScores(game.players, game.hands);
    const w = winnerOf(game, (id) => totals[id] ?? 0);
    // p2 has the lowest accumulated penalty across the phase-10 finishers.
    expect(w?.id).toBe('p2');
  });
});
