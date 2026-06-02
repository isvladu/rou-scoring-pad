import type { Player, WhistPlayerCount } from './types';

/**
 * Whist Românesc round schedule:
 *   1 (×N), 2, 3, 4, 5, 6, 7, 8 (×N), 7, 6, 5, 4, 3, 2, 1 (×N)
 *
 * Both extreme hand sizes (1 and 8) repeat N times so every player gets to
 * deal each. Total rounds = 3N + 12 (24 for 4p, 27 for 5p, 30 for 6p).
 */
export function generateSchedule(playerCount: WhistPlayerCount): number[] {
  const ones = Array(playerCount).fill(1) as number[];
  const ascending = [2, 3, 4, 5, 6, 7];
  const eights = Array(playerCount).fill(8) as number[];
  const descending = [7, 6, 5, 4, 3, 2];
  return [...ones, ...ascending, ...eights, ...descending, ...ones];
}

export function totalRoundsFor(playerCount: WhistPlayerCount): number {
  return 3 * playerCount + 12;
}

/** The player who picks and leads this round. Rotates by seat. */
export function pickerForRound(roundIndex: number, players: Player[]): Player {
  return players[roundIndex % players.length];
}

/** The dealer for this round — the seat immediately before the picker. */
export function dealerForRound(roundIndex: number, players: Player[]): Player {
  const pickerIndex = roundIndex % players.length;
  const dealerIndex = (pickerIndex - 1 + players.length) % players.length;
  return players[dealerIndex];
}
