import type { Player, Phase10HandEntry } from './types';

/**
 * Structured validation errors. UI translates via
 * `t('handEntry.errors.<code>', { ... })`.
 */
export type Phase10ValidationErrorCode =
  | { code: 'noWentOut' }
  | { code: 'unknownWentOut' }
  | { code: 'wentOutMustHaveZeroPenalty'; name: string; actual: number }
  | { code: 'penaltyMustBeNonNegInt'; name: string };

export interface ValidationResult {
  ok: boolean;
  errors: Phase10ValidationErrorCode[];
}

export function validateHandEntry(
  entry: Phase10HandEntry,
  players: Player[],
): ValidationResult {
  const errors: Phase10ValidationErrorCode[] = [];

  if (!entry.wentOutId) {
    errors.push({ code: 'noWentOut' });
  } else if (!players.some((p) => p.id === entry.wentOutId)) {
    errors.push({ code: 'unknownWentOut' });
  }

  for (const p of players) {
    const penalty = entry.remainingPenalty[p.id];
    if (
      typeof penalty !== 'number' ||
      !Number.isInteger(penalty) ||
      penalty < 0
    ) {
      errors.push({ code: 'penaltyMustBeNonNegInt', name: p.name });
      continue;
    }
    if (p.id === entry.wentOutId && penalty !== 0) {
      errors.push({
        code: 'wentOutMustHaveZeroPenalty',
        name: p.name,
        actual: penalty,
      });
    }
  }

  return { ok: errors.length === 0, errors };
}
