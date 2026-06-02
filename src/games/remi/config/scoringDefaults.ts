/**
 * Remi (Romanian Rummy) scoring configuration.
 *
 *   score(player) =
 *       sum(meldedValue)
 *     − sum(rackValue)
 *     + jolyFirstMeldBonus     if this player first-melded a Joly
 *     − jolyRackPenalty        if Joly ended on their rack
 *     + identicalExposedBonus  if they declared the dealt-identical-to-exposed
 *     + winnerBonus            if they won the hand
 *     + selfWinBonus           if it was an all-14-at-once self-win
 *     − noMeldPenalty          if they melded NOTHING this hand
 *                              (in `rackBased` mode the formula instead is
 *                               −100 − rackValue, with rack accounting
 *                               suppressed elsewhere)
 *
 *  Magnitudes are stored non-negative — the scorer applies the sign.
 */
export type NoMeldPenaltyMode = 'fixed' | 'rackBased';

export interface RemiScoringConfig {
  /** Bonus added to the winner's score. */
  winnerBonus: number;
  /** Extra bonus on top of winnerBonus when the winner melded all 14 tiles
   *  at once without any prior meld. */
  selfWinBonus: number;
  /** +N awarded to the first player who melds a Joly that hand. */
  jolyFirstMeldBonus: number;
  /** −N applied to a player who ends the hand with a Joly on their rack. */
  jolyRackPenalty: number;
  /** +N for a player who declared the identical-to-exposed tile they were dealt. */
  identicalExposedBonus: number;
  /** Magnitude of the no-meld penalty in `fixed` mode. Applied as a negative. */
  noMeldPenalty: number;
  /** Variant — fixed replaces normal melded-rack accounting; rackBased uses
   *  −100 − rackValue. */
  noMeldPenaltyMode: NoMeldPenaltyMode;
  /** Threshold the first meld must clear (display-only; not enforced by the
   *  app since melds aren't structurally validated). */
  initialMeldThreshold: number;
  /** House rule: when the winner's final discard is a Joly, their hand
   *  score is doubled (after all bonuses). Tracked per hand via
   *  RemiHandEntry.winnerDiscardedJoly. Default off. */
  doubleScoreOnJolyDiscardWin: boolean;
}

export const DEFAULT_REMI_SCORING: RemiScoringConfig = {
  winnerBonus: 100,
  selfWinBonus: 100,
  jolyFirstMeldBonus: 50,
  jolyRackPenalty: 25,
  identicalExposedBonus: 25,
  noMeldPenalty: 200,
  noMeldPenaltyMode: 'fixed',
  initialMeldThreshold: 50,
  doubleScoreOnJolyDiscardWin: false,
};

export function cloneDefaultRemiScoring(): RemiScoringConfig {
  return { ...DEFAULT_REMI_SCORING };
}
