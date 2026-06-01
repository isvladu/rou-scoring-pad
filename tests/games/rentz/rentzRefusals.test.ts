import { describe, expect, it } from 'vitest';
import {
  FIRST_REFUSAL_EDGES,
  SUBSEQUENT_REFUSAL_EDGES,
  rentzRefusalCount,
  rentzRefusalThreshold,
} from '../../../src/games/rentz/domain/rentzRefusals';
import { cloneDefaultScoring } from '../../../src/games/rentz/config/scoringDefaults';
import type { Game, RentzRefusal } from '../../../src/games/rentz/domain/types';

function gameWith(refusals: RentzRefusal[]): Game {
  const now = new Date().toISOString();
  return {
    id: 'g1',
    createdAt: now,
    updatedAt: now,
    players: [
      { id: 'p1', name: 'P1' },
      { id: 'p2', name: 'P2' },
      { id: 'p3', name: 'P3' },
      { id: 'p4', name: 'P4' },
    ],
    scoring: cloneDefaultScoring(),
    rounds: [],
    rentzRefusals: refusals,
    status: 'in_progress',
  };
}

function refusal(refuserId: string, pickerId = 'p1'): RentzRefusal {
  return { pickerId, refuserId, occurredAt: new Date().toISOString() };
}

describe('rentzRefusalThreshold', () => {
  it('returns 3 when the player has never refused', () => {
    expect(rentzRefusalThreshold(0)).toBe(FIRST_REFUSAL_EDGES);
    expect(rentzRefusalThreshold(0)).toBe(3);
  });

  it('returns 4 after the first refusal and stays there', () => {
    expect(rentzRefusalThreshold(1)).toBe(SUBSEQUENT_REFUSAL_EDGES);
    expect(rentzRefusalThreshold(2)).toBe(4);
    expect(rentzRefusalThreshold(5)).toBe(4);
  });
});

describe('rentzRefusalCount', () => {
  it('counts only refusals made by the given player', () => {
    const g = gameWith([
      refusal('p2'),
      refusal('p3'),
      refusal('p2'),
      refusal('p4'),
    ]);
    expect(rentzRefusalCount(g, 'p1')).toBe(0);
    expect(rentzRefusalCount(g, 'p2')).toBe(2);
    expect(rentzRefusalCount(g, 'p3')).toBe(1);
    expect(rentzRefusalCount(g, 'p4')).toBe(1);
  });
});
