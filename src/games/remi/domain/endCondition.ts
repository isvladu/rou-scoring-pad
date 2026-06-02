import type { Player, PlayerId, RemiGame } from './types';

/**
 * Game-over check. Two modes:
 *   - `targetScore`: any player has reached or passed the target — the
 *     hand-in-progress is the LAST hand (it's committed first, then the
 *     game flips to finished).
 *   - `handCount`: a fixed number of hands has been played.
 */
export function isGameOver(
  game: RemiGame,
  totals: Record<PlayerId, number>,
): boolean {
  if (game.endCondition.kind === 'handCount') {
    return game.hands.length >= game.endCondition.handCount;
  }
  const target = game.endCondition.targetScore;
  return game.players.some((p) => (totals[p.id] ?? 0) >= target);
}

/**
 * Winner = highest total score (Remi scoring is positive-good). Returns
 * null if the game is still in progress. Ties resolved by the first
 * player in seat order — the UI is expected to surface a tie banner
 * if it ever matters.
 */
export function winnerOf(
  game: RemiGame,
  totals: Record<PlayerId, number>,
): Player | null {
  if (!isGameOver(game, totals)) return null;
  return [...game.players].reduce((best, p) =>
    (totals[p.id] ?? 0) > (totals[best.id] ?? 0) ? p : best,
  );
}
