import type { Player, WhistRoundEntry } from './types';
import type { WhistScoringConfig } from '../config/scoringDefaults';

/**
 * Structured validation error. Domain returns codes + params; the UI maps
 * them to translated strings via `t('roundEntry.errors.<code>', { ... })`.
 * Keeping this pure (no string formatting) is what makes EN/RO swap work
 * on the round-entry screen.
 */
export type ValidationErrorCode =
  | { code: 'bidOutOfRange'; name: string; max: number }
  | { code: 'tricksOutOfRange'; name: string; max: number }
  | { code: 'tricksSumMismatch'; expected: number; actual: number }
  | { code: 'dealerConstraint'; handSize: number };

export interface ValidationResult {
  ok: boolean;
  errors: ValidationErrorCode[];
}

export function validateRoundEntry(
  entry: WhistRoundEntry,
  handSize: number,
  players: Player[],
  scoring: WhistScoringConfig,
): ValidationResult {
  const errors: ValidationErrorCode[] = [];

  for (const p of players) {
    const bid = entry.bids[p.id];
    const tricks = entry.tricks[p.id];
    if (typeof bid !== 'number' || !Number.isInteger(bid) || bid < 0 || bid > handSize) {
      errors.push({ code: 'bidOutOfRange', name: p.name, max: handSize });
    }
    if (
      typeof tricks !== 'number' ||
      !Number.isInteger(tricks) ||
      tricks < 0 ||
      tricks > handSize
    ) {
      errors.push({ code: 'tricksOutOfRange', name: p.name, max: handSize });
    }
  }

  const trickSum = players.reduce((acc, p) => acc + (entry.tricks[p.id] ?? 0), 0);
  if (trickSum !== handSize) {
    errors.push({ code: 'tricksSumMismatch', expected: handSize, actual: trickSum });
  }

  if (scoring.enforceDealerConstraint) {
    const bidSum = players.reduce((acc, p) => acc + (entry.bids[p.id] ?? 0), 0);
    if (bidSum === handSize) {
      errors.push({ code: 'dealerConstraint', handSize });
    }
  }

  return { ok: errors.length === 0, errors };
}
