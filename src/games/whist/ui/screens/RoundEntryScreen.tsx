import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useWhistGameStore, type WhistRoundInfo } from '../../state/gameStore';
import {
  validateRoundEntry,
  type ValidationErrorCode,
} from '../../domain/validation';
import {
  type Player,
  type PlayerId,
  type WhistGame,
  type WhistRoundEntry,
} from '../../domain/types';
import PlayerStepper from '../../../../core/components/PlayerStepper';
import WhistBidStepper from '../components/WhistBidStepper';

function emptyCounts(players: Player[]): Record<PlayerId, number> {
  return Object.fromEntries(players.map((p) => [p.id, 0]));
}

function translateError(
  t: (key: string, params?: Record<string, unknown>) => string,
  err: ValidationErrorCode,
): string {
  switch (err.code) {
    case 'bidOutOfRange':
      return t('roundEntry.errors.bidOutOfRange', { name: err.name, max: err.max });
    case 'tricksOutOfRange':
      return t('roundEntry.errors.tricksOutOfRange', { name: err.name, max: err.max });
    case 'tricksSumMismatch':
      return t('roundEntry.errors.tricksSumMismatch', {
        expected: err.expected,
        actual: err.actual,
      });
    case 'dealerConstraint':
      return t('roundEntry.errors.dealerConstraint', { handSize: err.handSize });
  }
}

export default function RoundEntryScreen() {
  const { id } = useParams();
  const { active, load, currentRoundInfo } = useWhistGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  const info = currentRoundInfo();
  if (!info) return null;

  // Key on game id + round index so React re-mounts the form (and resets
  // local state) when either changes — no setState-in-effect needed.
  return <RoundEntryForm key={`${active.id}-${info.roundIndex}`} game={active} info={info} />;
}

function RoundEntryForm({ game, info }: { game: WhistGame; info: WhistRoundInfo }) {
  const { t } = useTranslation('whist');
  const navigate = useNavigate();
  const { commitRound } = useWhistGameStore();

  const [bids, setBids] = useState<Record<PlayerId, number>>(() => emptyCounts(game.players));
  const [tricks, setTricks] = useState<Record<PlayerId, number>>(() => emptyCounts(game.players));

  const entry: WhistRoundEntry = useMemo(() => ({ bids, tricks }), [bids, tricks]);

  const v = validateRoundEntry(entry, info.handSize, game.players, game.scoring);
  const dealer = game.players.find((p) => p.id === info.dealerId);

  // Hide the "tricks must sum to N (got 0)" error before the user has touched
  // tricks — it's misleading on the very first render. Show all other errors.
  const tricksUntouched = game.players.every((p) => (tricks[p.id] ?? 0) === 0);
  const visibleErrors = v.errors.filter(
    (e) => !(tricksUntouched && e.code === 'tricksSumMismatch'),
  );

  const onSubmit = async (): Promise<void> => {
    if (!v.ok) return;
    await commitRound(entry);
    navigate(`/whist/game/${game.id}`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {t('game.roundOf', { n: info.roundIndex + 1, total: info.totalRounds })}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">
          {t('game.handSize', { n: info.handSize })}
        </h2>
        {dealer && (
          <p className="text-xs text-slate-500">{t('game.dealerIs', { name: dealer.name })}</p>
        )}
      </div>

      <WhistBidStepper
        players={game.players}
        values={bids}
        maxPerPlayer={info.handSize}
        forbiddenSum={game.scoring.enforceDealerConstraint ? info.handSize : null}
        onChange={setBids}
        label={t('roundEntry.bids')}
      />

      <PlayerStepper
        players={game.players}
        values={tricks}
        expectedSum={info.handSize}
        onChange={setTricks}
        label={t('roundEntry.tricks')}
      />

      {visibleErrors.length > 0 && (
        <ul className="rounded-md bg-amber-900/30 px-3 py-2 text-sm text-amber-200">
          {visibleErrors.map((e, i) => (
            <li key={i}>{translateError(t, e)}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/whist/game/${game.id}`)}
          className="rounded-lg border border-slate-700 px-4 py-3 text-slate-200"
        >
          {t('common.back')}
        </button>
        <button
          type="button"
          disabled={!v.ok}
          onClick={() => void onSubmit()}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-lg font-medium text-slate-900 hover:bg-brand-600 disabled:opacity-50"
        >
          {t('roundEntry.save')}
        </button>
      </div>
    </div>
  );
}
