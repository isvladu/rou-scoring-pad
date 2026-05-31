import { describe, expect, it } from 'vitest';
import { computeRotation } from '../src/domain/rotation';
import { ALL_CONTRACTS, type Player, type Round } from '../src/domain/types';

function makePlayers(n: 4 | 5 | 6): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
}

function fakeRound(index: number, dealerId: string, contract: (typeof ALL_CONTRACTS)[number]): Round {
  return {
    index,
    dealerId,
    entry:
      contract === 'rentz'
        ? { contract: 'rentz', finishingOrder: [] }
        : contract === 'tenOfClubs' || contract === 'noKingOfHearts'
          ? { contract, takerId: dealerId }
          : contract === 'totals'
            ? {
                contract: 'totals',
                tricks: {},
                diamonds: {},
                queens: {},
                kingOfHeartsTakerId: dealerId,
              }
            : { contract, counts: {} },
    scores: {},
    committedAt: new Date().toISOString(),
  };
}

describe('rotation', () => {
  it('produces players × 8 total rounds', () => {
    const p4 = computeRotation(makePlayers(4), []);
    expect(p4.totalRounds).toBe(32);
    expect(p4.isFinished).toBe(false);

    const p5 = computeRotation(makePlayers(5), []);
    expect(p5.totalRounds).toBe(40);

    const p6 = computeRotation(makePlayers(6), []);
    expect(p6.totalRounds).toBe(48);
  });

  it('rotates dealer clockwise each round', () => {
    const players = makePlayers(4);
    const rounds: Round[] = [];
    const start = computeRotation(players, rounds);
    expect(start.currentDealerId).toBe('p1');

    rounds.push(fakeRound(0, 'p1', 'noTricks'));
    expect(computeRotation(players, rounds).currentDealerId).toBe('p2');

    rounds.push(fakeRound(1, 'p2', 'noTricks'));
    expect(computeRotation(players, rounds).currentDealerId).toBe('p3');
  });

  it('shrinks the legal-contract list for the current dealer', () => {
    const players = makePlayers(4);
    const rounds: Round[] = [
      fakeRound(0, 'p1', 'noTricks'),
      fakeRound(1, 'p2', 'noTricks'),
      fakeRound(2, 'p3', 'noTricks'),
      fakeRound(3, 'p4', 'noTricks'),
      // back to p1
    ];
    const next = computeRotation(players, rounds);
    expect(next.currentDealerId).toBe('p1');
    expect(next.legalContracts).not.toContain('noTricks');
    expect(next.legalContracts).toHaveLength(7);
  });

  it('finishes after every player has dealt every contract', () => {
    const players = makePlayers(4);
    const rounds: Round[] = [];
    let idx = 0;
    for (const c of ALL_CONTRACTS) {
      for (const p of players) {
        rounds.push(fakeRound(idx++, p.id, c));
      }
    }
    const state = computeRotation(players, rounds);
    expect(state.isFinished).toBe(true);
    expect(state.currentDealerId).toBeNull();
    expect(state.legalContracts).toEqual([]);
  });
});
