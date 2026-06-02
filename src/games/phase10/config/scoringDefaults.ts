/**
 * Card-category penalties that drive the quick-add hint shown on the hand
 * entry screen. The app does not enforce which cards contribute to a
 * player's penalty total — it just sums what the user enters. The defaults
 * follow the standard Mattel rule:
 *   1–9          → 5
 *   10–12        → 10
 *   Skip cards   → 15
 *   Wild cards   → 25
 */
export interface Phase10ScoringConfig {
  penaltyLow: number;
  penaltyHigh: number;
  penaltySkip: number;
  penaltyWild: number;
}

export const DEFAULT_PHASE10_SCORING: Phase10ScoringConfig = {
  penaltyLow: 5,
  penaltyHigh: 10,
  penaltySkip: 15,
  penaltyWild: 25,
};

export function cloneDefaultPhase10Scoring(): Phase10ScoringConfig {
  return { ...DEFAULT_PHASE10_SCORING };
}
