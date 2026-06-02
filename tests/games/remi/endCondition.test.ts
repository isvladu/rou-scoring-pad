import { describe, expect, it } from 'vitest';
import { isGameOver, winnerOf } from '../../../src/games/remi/domain/endCondition';
import {
  blankPerPlayer,
  type Player,
  type RemiGame,
  type RemiHand,
} from '../../../src/games/remi/domain/types';
import { cloneDefaultRemiScoring } from '../../../src/games/remi/config/scoringDefaults';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
];

function gameWith(
  endCondition: RemiGame['endCondition'],
  hands: RemiHand[] = [],
): RemiGame {
  return {
    id: 'g',
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: '2026-06-02T00:00:00Z',
    players: PLAYERS,
    endCondition,
    scoring: cloneDefaultRemiScoring(),
    hands,
    status: 'in_progress',
  };
}

function hand(index: number, scores: Record<string, number>): RemiHand {
  return {
    index,
    winnerId: null,
    selfWin: false,
    winnerDiscardedJoly: false,
    perPlayer: { p1: blankPerPlayer(), p2: blankPerPlayer(), p3: blankPerPlayer() },
    scores,
    committedAt: '2026-06-02T00:00:00Z',
  };
}

describe('isGameOver — targetScore mode', () => {
  it('false while no player has hit the target', () => {
    const g = gameWith({ kind: 'targetScore', targetScore: 1000 }, [
      hand(0, { p1: 400, p2: 300, p3: 250 }),
    ]);
    expect(isGameOver(g, { p1: 400, p2: 300, p3: 250 })).toBe(false);
  });

  it('true as soon as someone meets or exceeds the target', () => {
    const g = gameWith({ kind: 'targetScore', targetScore: 1000 });
    expect(isGameOver(g, { p1: 1000, p2: 200, p3: 200 })).toBe(true);
    expect(isGameOver(g, { p1: 1100, p2: 200, p3: 200 })).toBe(true);
  });
});

describe('isGameOver — handCount mode', () => {
  it('false while fewer hands have been played', () => {
    const g = gameWith({ kind: 'handCount', handCount: 5 }, [
      hand(0, {}),
      hand(1, {}),
      hand(2, {}),
    ]);
    expect(isGameOver(g, { p1: 0, p2: 0, p3: 0 })).toBe(false);
  });

  it('true once the handCount is reached', () => {
    const g = gameWith(
      { kind: 'handCount', handCount: 3 },
      Array.from({ length: 3 }, (_, i) => hand(i, {})),
    );
    expect(isGameOver(g, { p1: 0, p2: 0, p3: 0 })).toBe(true);
  });
});

describe('winnerOf', () => {
  it('null while game in progress', () => {
    const g = gameWith({ kind: 'targetScore', targetScore: 1000 });
    expect(winnerOf(g, { p1: 100, p2: 50, p3: 0 })).toBeNull();
  });

  it('highest score wins (Remi is positive-good)', () => {
    const g = gameWith({ kind: 'targetScore', targetScore: 500 });
    const w = winnerOf(g, { p1: 200, p2: 600, p3: 400 });
    expect(w?.id).toBe('p2');
  });
});
