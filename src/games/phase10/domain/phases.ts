import type { Player, PlayerId, Phase10Game, Phase10Hand } from './types';

/**
 * Number of phases a player has CLEARED, plus 1 — i.e. their current phase
 * to play next. Range is [1, 11]. A value of 11 means the player has
 * completed all 10 phases.
 *
 * Pure function of the recorded hand history; nothing is stored about a
 * player's current phase directly, so undo-ing a hand correctly reverts it.
 */
export function currentPhase(
  playerId: PlayerId,
  hands: readonly Phase10Hand[],
): number {
  let phase = 1;
  for (const h of hands) {
    if (h.completedPhase[playerId]) phase++;
  }
  return phase;
}

/** Like {@link currentPhase} but clamped to 10 for display. */
export function displayPhase(
  playerId: PlayerId,
  hands: readonly Phase10Hand[],
): number {
  return Math.min(10, currentPhase(playerId, hands));
}

export function hasClearedAllPhases(
  playerId: PlayerId,
  hands: readonly Phase10Hand[],
): boolean {
  return currentPhase(playerId, hands) > 10;
}

/**
 * Game ends the moment a player goes out AND that hand clears their 10th
 * phase. We allow multiple players to have cleared all phases across
 * different hands; the winner among them is the one with the lowest
 * total penalty.
 */
export function isGameOver(game: Phase10Game): boolean {
  const last = game.hands[game.hands.length - 1];
  if (!last) return false;
  return hasClearedAllPhases(last.wentOutId, game.hands);
}

/**
 * Winner = lowest-total-penalty player among those who have cleared all
 * 10 phases. Returns null if the game is still in progress.
 */
export function winnerOf(
  game: Phase10Game,
  totalsBy: (playerId: PlayerId) => number,
): Player | null {
  if (!isGameOver(game)) return null;
  const cleared = game.players.filter((p) => hasClearedAllPhases(p.id, game.hands));
  if (cleared.length === 0) return null;
  return cleared.reduce((best, p) => (totalsBy(p.id) < totalsBy(best.id) ? p : best));
}
