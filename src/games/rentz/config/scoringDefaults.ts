/**
 * Default point values for every contract. Editable per game in NewGame screen.
 * The user may want to correct these values to match their table's house rules —
 * the structure is the contract; the numbers are conventions.
 */
/**
 * All per-unit / per-taker values are stored as **non-negative magnitudes**.
 * The scoring calculator applies the sign based on each contract's
 * `CONTRACT_META[id].sign`. See `src/domain/contracts.ts` for the sign table.
 */
export const SCORING_DEFAULTS = {
  noTricks: { perTrick: 50 },
  noDiamonds: { perDiamond: 30 },
  noQueens: { perQueen: 40 },
  noKingOfHearts: { takingIt: 200 },
  tenOfClubs: { takingIt: 200 },
  whist: { perTrick: 50 },
  rentz: {
    byPosition: {
      3: [200, 100, 0],
      4: [300, 200, 100, 0],
      5: [400, 300, 200, 100, 0],
      6: [500, 400, 300, 200, 100, 0],
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
  whist: { perTrick: number };
  rentz: { byPosition: Record<3 | 4 | 5 | 6, number[]> };
  blindMultiplier: number;
};

export function cloneDefaultScoring(): ScoringConfig {
  return JSON.parse(JSON.stringify(SCORING_DEFAULTS)) as ScoringConfig;
}
