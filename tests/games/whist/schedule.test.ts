import { describe, expect, it } from 'vitest';
import {
  generateSchedule,
  totalRoundsFor,
  pickerForRound,
  dealerForRound,
} from '../../../src/games/whist/domain/schedule';
import type { Player } from '../../../src/games/whist/domain/types';

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Adi' },
  { id: 'p2', name: 'Mihai' },
  { id: 'p3', name: 'Dan' },
  { id: 'p4', name: 'Ioana' },
];

describe('schedule', () => {
  it('3-player schedule is 1×3, 2..7, 8×3, 7..2, 1×3 (21 rounds)', () => {
    const schedule = generateSchedule(3);
    expect(schedule).toEqual([
      1, 1, 1,
      2, 3, 4, 5, 6, 7,
      8, 8, 8,
      7, 6, 5, 4, 3, 2,
      1, 1, 1,
    ]);
    expect(schedule).toHaveLength(21);
    expect(totalRoundsFor(3)).toBe(21);
  });

  it('4-player schedule is 1×4, 2..7, 8×4, 7..2, 1×4 (24 rounds)', () => {
    const schedule = generateSchedule(4);
    expect(schedule).toEqual([
      1, 1, 1, 1,
      2, 3, 4, 5, 6, 7,
      8, 8, 8, 8,
      7, 6, 5, 4, 3, 2,
      1, 1, 1, 1,
    ]);
    expect(schedule).toHaveLength(24);
    expect(totalRoundsFor(4)).toBe(24);
  });

  it('5-player schedule has 27 rounds with five 1s at each end and five 8s in the middle', () => {
    const schedule = generateSchedule(5);
    expect(schedule).toHaveLength(27);
    expect(totalRoundsFor(5)).toBe(27);
    expect(schedule.slice(0, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(schedule.slice(-5)).toEqual([1, 1, 1, 1, 1]);
    expect(schedule.filter((n) => n === 8)).toHaveLength(5);
  });

  it('6-player schedule has 30 rounds', () => {
    expect(generateSchedule(6)).toHaveLength(30);
    expect(totalRoundsFor(6)).toBe(30);
  });
});

describe('rotation', () => {
  it('picker rotates by seat each round', () => {
    expect(pickerForRound(0, PLAYERS).id).toBe('p1');
    expect(pickerForRound(1, PLAYERS).id).toBe('p2');
    expect(pickerForRound(4, PLAYERS).id).toBe('p1');
    expect(pickerForRound(7, PLAYERS).id).toBe('p4');
  });

  it('dealer is the seat immediately before the picker, wrapping', () => {
    // picker p1 (round 0) → dealer is the last seat (p4)
    expect(dealerForRound(0, PLAYERS).id).toBe('p4');
    // picker p2 → dealer p1
    expect(dealerForRound(1, PLAYERS).id).toBe('p1');
    // picker p4 → dealer p3
    expect(dealerForRound(3, PLAYERS).id).toBe('p3');
  });
});
