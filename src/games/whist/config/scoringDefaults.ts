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
}

export const DEFAULT_WHIST_SCORING: WhistScoringConfig = {
  hitBonus: 5,
  missPenaltyPerTrick: 1,
  zeroBidHitBonus: 0,
  maxBidHitBonus: 0,
  enforceDealerConstraint: true,
};

export function cloneDefaultWhistScoring(): WhistScoringConfig {
  return { ...DEFAULT_WHIST_SCORING };
}
