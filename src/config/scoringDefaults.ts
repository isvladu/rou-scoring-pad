/**
 * Default point values for every contract. Editable per game in NewGame screen.
 * The user may want to correct these values to match their table's house rules —
 * the structure is the contract; the numbers are conventions.
 */
export const SCORING_DEFAULTS = {
  noTricks: { perTrick: -2 },
  noDiamonds: { perDiamond: -2 },
  noQueens: { perQueen: -6 },
  noKingOfHearts: { takingIt: -20 },
  tenOfClubs: { takingIt: 10 },
  totals: { multiplier: 1 },
  whist: { perTrick: 2 },
  rentz: {
    byPosition: {
      4: [30, 20, -10, -20],
      5: [40, 20, 0, -20, -30],
      6: [50, 30, 10, -10, -30, -40],
    },
  },
  /** Multiplier applied to the round's scores when the picker declared blind. */
  blindMultiplier: 2,
} as const;

export type ScoringConfig = {
  noTricks: { perTrick: number };
  noDiamonds: { perDiamond: number };
  noQueens: { perQueen: number };
  noKingOfHearts: { takingIt: number };
  tenOfClubs: { takingIt: number };
  totals: { multiplier: number };
  whist: { perTrick: number };
  rentz: { byPosition: Record<4 | 5 | 6, number[]> };
  blindMultiplier: number;
};

export function cloneDefaultScoring(): ScoringConfig {
  return JSON.parse(JSON.stringify(SCORING_DEFAULTS)) as ScoringConfig;
}
