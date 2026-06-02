export interface WhistScoringConfig {
  /** Flat bonus added on top of tricks when a player makes their bid exactly. */
  hitBonus: number;
  /** Per-trick penalty multiplier for missed bids. Magnitude only; sign applied by the scorer. */
  missPenaltyPerTrick: number;
  /** Extra bonus for hitting a bid of 0 specifically. */
  zeroBidHitBonus: number;
  /** Extra bonus for hitting the maximum bid (= handSize) specifically. */
  maxBidHitBonus: number;
  /** Whether to enforce the rule "sum of bids must not equal handSize". */
  enforceDealerConstraint: boolean;
  /** Length of a consecutive-hit streak that earns the premiere bonus.
   *  Hand-size-1 rounds are excluded from the streak — they neither grow it
   *  nor break it. Default 5. */
  premiereStreakLength: number;
  /** Magnitude of the premiere bonus, added to the player's score in the
   *  round that completes a streak. The bonus fires again on every
   *  subsequent multiple of `premiereStreakLength` while the streak
   *  continues. 0 disables the rule. Default 10. */
  premiereBonus: number;
}

export const DEFAULT_WHIST_SCORING: WhistScoringConfig = {
  hitBonus: 5,
  missPenaltyPerTrick: 1,
  zeroBidHitBonus: 0,
  maxBidHitBonus: 0,
  enforceDealerConstraint: true,
  premiereStreakLength: 5,
  premiereBonus: 10,
};

export function cloneDefaultWhistScoring(): WhistScoringConfig {
  return { ...DEFAULT_WHIST_SCORING };
}
