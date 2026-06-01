import type { Game, PlayerId } from './types';

/**
 * Default house rule: to refuse another player's Rentz contract, you must
 * claim you hold a minimum number of "suit edges" (aces and the lowest rank
 * of each suit in the current deck — 7s for 4p, 5s for 5p, 3s for 6p).
 *
 * Threshold steps up after your first refusal in the game and stays there,
 * so a frequent refuser must demonstrate proportionally stronger hands.
 */
export const FIRST_REFUSAL_EDGES = 3;
export const SUBSEQUENT_REFUSAL_EDGES = 4;

/** How many times this player has already refused a Rentz in this game. */
export function rentzRefusalCount(game: Game, playerId: PlayerId): number {
  return game.rentzRefusals.filter((r) => r.refuserId === playerId).length;
}

/** Minimum suit-edge count this player must claim to refuse the next Rentz. */
export function rentzRefusalThreshold(count: number): number {
  return count === 0 ? FIRST_REFUSAL_EDGES : SUBSEQUENT_REFUSAL_EDGES;
}
