import type { Player, RemiHandEntry } from './types';

/**
 * Structured validation errors translated by the UI via
 * `t('handEntry.errors.<code>', { ... })`.
 */
export type RemiValidationErrorCode =
  | { code: 'meldedValueNegative'; name: string }
  | { code: 'rackValueNegative'; name: string }
  | { code: 'meldedFalseWithValue'; name: string }
  | { code: 'winnerDidNotMeld'; name: string }
  | { code: 'winnerHasRackValue'; name: string; actual: number }
  | { code: 'winnerHasJolyOnRack'; name: string }
  | { code: 'selfWinWithoutWinner' }
  | { code: 'multipleFirstMelders' }
  | { code: 'unknownWinner' }
  | { code: 'missingPerPlayerEntry'; name: string }
  | { code: 'multipleIdenticalExposedDeclarants' }
  | { code: 'discardedJolyWithoutWinner' };

export interface ValidationResult {
  ok: boolean;
  errors: RemiValidationErrorCode[];
}

export function validateHandEntry(
  entry: RemiHandEntry,
  players: Player[],
): ValidationResult {
  const errors: RemiValidationErrorCode[] = [];

  if (entry.winnerId !== null && !players.some((p) => p.id === entry.winnerId)) {
    errors.push({ code: 'unknownWinner' });
  }

  let firstMelders = 0;
  let identicalExposedDeclarants = 0;

  for (const p of players) {
    const pp = entry.perPlayer[p.id];
    if (!pp) {
      // Silently skipping a missing row would hide the bug that produced it.
      // The UI never produces this state, but importers/store calls might.
      errors.push({ code: 'missingPerPlayerEntry', name: p.name });
      continue;
    }
    if (pp.meldedValue < 0 || !Number.isFinite(pp.meldedValue)) {
      errors.push({ code: 'meldedValueNegative', name: p.name });
    }
    if (pp.rackValue < 0 || !Number.isFinite(pp.rackValue)) {
      errors.push({ code: 'rackValueNegative', name: p.name });
    }
    if (!pp.melded && pp.meldedValue !== 0) {
      errors.push({ code: 'meldedFalseWithValue', name: p.name });
    }
    if (pp.jolyFirstMelded) firstMelders++;
    if (pp.declaredIdenticalExposed) identicalExposedDeclarants++;
    if (entry.winnerId !== null && p.id === entry.winnerId) {
      if (!pp.melded) {
        errors.push({ code: 'winnerDidNotMeld', name: p.name });
      }
      if (pp.rackValue !== 0) {
        errors.push({
          code: 'winnerHasRackValue',
          name: p.name,
          actual: pp.rackValue,
        });
      }
      if (pp.jolyOnRack) {
        errors.push({ code: 'winnerHasJolyOnRack', name: p.name });
      }
    }
  }

  if (entry.selfWin && entry.winnerId === null) {
    errors.push({ code: 'selfWinWithoutWinner' });
  }

  if (entry.winnerDiscardedJoly && entry.winnerId === null) {
    errors.push({ code: 'discardedJolyWithoutWinner' });
  }

  if (firstMelders > 1) {
    errors.push({ code: 'multipleFirstMelders' });
  }

  if (identicalExposedDeclarants > 1) {
    // Only one player can actually hold the dealt-identical-to-exposed tile,
    // so at most one player may declare it.
    errors.push({ code: 'multipleIdenticalExposedDeclarants' });
  }

  return { ok: errors.length === 0, errors };
}
