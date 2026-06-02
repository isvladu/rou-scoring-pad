import {
  diamondsInDeck,
  QUEENS_IN_DECK,
  TRICKS_PER_HAND,
  type Player,
  type PlayerCount,
  type PlayerId,
  type RoundEntry,
} from './types';

/**
 * Structured validation error. Domain returns codes + params; the UI maps
 * them to translated strings if it ever needs to display them. The Rentz
 * UI currently uses validation only to gate the Save button, but the codes
 * are designed so that if/when error text is shown to the user, it can be
 * localised via `t('roundEntry.errors.<code>', { ... })`.
 */
export type CountCategory = 'tricks' | 'diamonds' | 'queens';
export type TakerRole = 'kingOfHearts' | 'tenOfClubs';

export type ValidationErrorCode =
  | { code: 'countsMustBeNonNeg'; category: CountCategory }
  | { code: 'countSumMismatch'; category: CountCategory; expected: number; actual: number }
  | { code: 'pickTaker'; role: TakerRole }
  | { code: 'rentzRankAll'; expected: number }
  | { code: 'rentzDuplicate' }
  | { code: 'rentzUnknownPlayer'; playerId: string };

export interface ValidationResult {
  ok: boolean;
  errors: ValidationErrorCode[];
}

function sumOf(counts: Record<PlayerId, number>, players: Player[]): number {
  return players.reduce((acc, p) => acc + (counts[p.id] ?? 0), 0);
}

function nonNegative(counts: Record<PlayerId, number>, players: Player[]): boolean {
  return players.every((p) => (counts[p.id] ?? 0) >= 0 && Number.isInteger(counts[p.id] ?? 0));
}

function validateCounter(
  counts: Record<PlayerId, number>,
  players: Player[],
  expected: number,
  category: CountCategory,
): ValidationResult {
  const errors: ValidationErrorCode[] = [];
  if (!nonNegative(counts, players)) {
    errors.push({ code: 'countsMustBeNonNeg', category });
  }
  const actual = sumOf(counts, players);
  if (actual !== expected) {
    errors.push({ code: 'countSumMismatch', category, expected, actual });
  }
  return { ok: errors.length === 0, errors };
}

function validateTaker(
  takerId: PlayerId | undefined,
  players: Player[],
  role: TakerRole,
): ValidationResult {
  const errors: ValidationErrorCode[] = [];
  if (!takerId || !players.some((p) => p.id === takerId)) {
    errors.push({ code: 'pickTaker', role });
  }
  return { ok: errors.length === 0, errors };
}

export function validateRoundEntry(
  entry: RoundEntry,
  players: Player[],
): ValidationResult {
  const playerCount = players.length as PlayerCount;
  switch (entry.contract) {
    case 'noTricks':
    case 'whist':
      return validateCounter(entry.counts, players, TRICKS_PER_HAND, 'tricks');
    case 'noDiamonds':
      return validateCounter(entry.counts, players, diamondsInDeck(playerCount), 'diamonds');
    case 'noQueens':
      return validateCounter(entry.counts, players, QUEENS_IN_DECK, 'queens');
    case 'noKingOfHearts':
      return validateTaker(entry.takerId, players, 'kingOfHearts');
    case 'tenOfClubs':
      return validateTaker(entry.takerId, players, 'tenOfClubs');
    case 'totals': {
      const tricks = validateCounter(entry.tricks, players, TRICKS_PER_HAND, 'tricks');
      const diamonds = validateCounter(
        entry.diamonds,
        players,
        diamondsInDeck(playerCount),
        'diamonds',
      );
      const queens = validateCounter(entry.queens, players, QUEENS_IN_DECK, 'queens');
      const king = validateTaker(entry.kingOfHeartsTakerId, players, 'kingOfHearts');
      const errors = [...tricks.errors, ...diamonds.errors, ...queens.errors, ...king.errors];
      return { ok: errors.length === 0, errors };
    }
    case 'rentz': {
      const errors: ValidationErrorCode[] = [];
      if (entry.finishingOrder.length !== players.length) {
        errors.push({ code: 'rentzRankAll', expected: players.length });
      }
      const uniq = new Set(entry.finishingOrder);
      if (uniq.size !== entry.finishingOrder.length) {
        errors.push({ code: 'rentzDuplicate' });
      }
      for (const pid of entry.finishingOrder) {
        if (!players.some((p) => p.id === pid)) {
          errors.push({ code: 'rentzUnknownPlayer', playerId: pid });
          break;
        }
      }
      return { ok: errors.length === 0, errors };
    }
  }
}
