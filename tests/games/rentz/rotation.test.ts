import { describe, expect, it } from 'vitest';
import { computeRotation, dealerForPicker } from '../../../src/games/rentz/domain/rotation';
import { ALL_CONTRACTS, type Player, type Round } from '../../../src/games/rentz/domain/types';

function makePlayers(n: 4 | 5 | 6): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
}

function fakeRound(
  index: number,
  pickerId: string,
  contract: (typeof ALL_CONTRACTS)[number],
): Round {
  return {
    index,
    pickerId,
    blind: false,
    entry:
      contract === 'rentz'
        ? { contract: 'rentz', finishingOrder: [] }
        : contract === 'tenOfClubs' || contract === 'noKingOfHearts'
          ? { contract, takerId: pickerId }
          : contract === 'totals'
            ? {
                contract: 'totals',
                tricks: {},
                diamonds: {},
                queens: {},
                kingOfHeartsTakerId: pickerId,
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

  it('rotates picker clockwise each round', () => {
    const players = makePlayers(4);
    const rounds: Round[] = [];
    expect(computeRotation(players, rounds).currentPickerId).toBe('p1');

    rounds.push(fakeRound(0, 'p1', 'noTricks'));
    expect(computeRotation(players, rounds).currentPickerId).toBe('p2');

    rounds.push(fakeRound(1, 'p2', 'noTricks'));
    expect(computeRotation(players, rounds).currentPickerId).toBe('p3');
  });

  it('dealer is always the seat immediately before the picker (wraps)', () => {
    const players = makePlayers(4);

    // round 0 — picker = p1, dealer = p4 (wraps)
    const r0 = computeRotation(players, []);
    expect(r0.currentPickerId).toBe('p1');
    expect(r0.currentDealerId).toBe('p4');

    // round 1 — picker = p2, dealer = p1
    const r1 = computeRotation(players, [fakeRound(0, 'p1', 'noTricks')]);
    expect(r1.currentPickerId).toBe('p2');
    expect(r1.currentDealerId).toBe('p1');

    // round 2 — picker = p3, dealer = p2
    const r2 = computeRotation(players, [
      fakeRound(0, 'p1', 'noTricks'),
      fakeRound(1, 'p2', 'noTricks'),
    ]);
    expect(r2.currentPickerId).toBe('p3');
    expect(r2.currentDealerId).toBe('p2');
  });

  it('dealerForPicker wraps correctly for the first seat', () => {
    const players = makePlayers(5);
    expect(dealerForPicker(players, 'p1')).toBe('p5');
    expect(dealerForPicker(players, 'p2')).toBe('p1');
    expect(dealerForPicker(players, 'p5')).toBe('p4');
  });

  it('shrinks the legal-contract list for the current picker', () => {
    const players = makePlayers(4);
    const rounds: Round[] = [
      fakeRound(0, 'p1', 'noTricks'),
      fakeRound(1, 'p2', 'noTricks'),
      fakeRound(2, 'p3', 'noTricks'),
      fakeRound(3, 'p4', 'noTricks'),
      // back to p1
    ];
    const next = computeRotation(players, rounds);
    expect(next.currentPickerId).toBe('p1');
    expect(next.legalContracts).not.toContain('noTricks');
    expect(next.legalContracts).toHaveLength(7);
  });

  it('finishes after every player has picked every contract', () => {
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
    expect(state.currentPickerId).toBeNull();
    expect(state.currentDealerId).toBeNull();
    expect(state.legalContracts).toEqual([]);
  });
});
