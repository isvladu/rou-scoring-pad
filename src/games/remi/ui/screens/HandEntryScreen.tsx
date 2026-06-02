import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useRemiGameStore } from '../../state/gameStore';
import { computeHandScores } from '../../domain/scoring';
import {
  validateHandEntry,
  type RemiValidationErrorCode,
} from '../../domain/validation';
import {
  blankPerPlayer,
  type Player,
  type PlayerId,
  type RemiGame,
  type RemiHandEntry,
  type RemiPerPlayerEntry,
} from '../../domain/types';

function emptyPerPlayer(players: Player[]): Record<PlayerId, RemiPerPlayerEntry> {
  return Object.fromEntries(players.map((p) => [p.id, blankPerPlayer()]));
}

function translateError(
  t: (key: string, params?: Record<string, unknown>) => string,
  err: RemiValidationErrorCode,
): string {
  switch (err.code) {
    case 'meldedValueNegative':
      return t('handEntry.errors.meldedValueNegative', { name: err.name });
    case 'rackValueNegative':
      return t('handEntry.errors.rackValueNegative', { name: err.name });
    case 'meldedFalseWithValue':
      return t('handEntry.errors.meldedFalseWithValue', { name: err.name });
    case 'winnerDidNotMeld':
      return t('handEntry.errors.winnerDidNotMeld', { name: err.name });
    case 'winnerHasRackValue':
      return t('handEntry.errors.winnerHasRackValue', {
        name: err.name,
        actual: err.actual,
      });
    case 'winnerHasJolyOnRack':
      return t('handEntry.errors.winnerHasJolyOnRack', { name: err.name });
    case 'selfWinWithoutWinner':
      return t('handEntry.errors.selfWinWithoutWinner');
    case 'multipleFirstMelders':
      return t('handEntry.errors.multipleFirstMelders');
    case 'unknownWinner':
      return t('handEntry.errors.unknownWinner');
    case 'missingPerPlayerEntry':
      return t('handEntry.errors.missingPerPlayerEntry', { name: err.name });
    case 'multipleIdenticalExposedDeclarants':
      return t('handEntry.errors.multipleIdenticalExposedDeclarants');
    case 'discardedJolyWithoutWinner':
      return t('handEntry.errors.discardedJolyWithoutWinner');
  }
}

export default function HandEntryScreen() {
  const { id } = useParams();
  const { active, load } = useRemiGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;

  return (
    <HandEntryForm
      key={`${active.id}-${active.hands.length}`}
      game={active}
      handIndex={active.hands.length}
    />
  );
}

function HandEntryForm({
  game,
  handIndex,
}: {
  game: RemiGame;
  handIndex: number;
}) {
  const { t } = useTranslation('remi');
  const navigate = useNavigate();
  const { commitHand } = useRemiGameStore();

  const [winnerId, setWinnerId] = useState<PlayerId | null>(null);
  const [selfWin, setSelfWin] = useState(false);
  const [winnerDiscardedJoly, setWinnerDiscardedJoly] = useState(false);
  const [perPlayer, setPerPlayer] = useState<Record<PlayerId, RemiPerPlayerEntry>>(() =>
    emptyPerPlayer(game.players),
  );

  // Derive: winner's row gets locked (melded=true, rackValue=0, jolyOnRack=false).
  // Like Phase 10, the user's pre-pick state is preserved so changing winner
  // restores the previous inputs. selfWin and winnerDiscardedJoly fall back
  // to false when there is no winner (their toggles are hidden in the UI).
  const entry: RemiHandEntry = useMemo(() => {
    const out: Record<PlayerId, RemiPerPlayerEntry> = {};
    for (const p of game.players) {
      const pp = perPlayer[p.id];
      if (winnerId && p.id === winnerId) {
        out[p.id] = { ...pp, melded: true, rackValue: 0, jolyOnRack: false };
      } else {
        out[p.id] = pp;
      }
    }
    return {
      winnerId,
      selfWin: winnerId !== null && selfWin,
      winnerDiscardedJoly: winnerId !== null && winnerDiscardedJoly,
      perPlayer: out,
    };
  }, [winnerId, selfWin, winnerDiscardedJoly, perPlayer, game.players]);

  const v = validateHandEntry(entry, game.players);
  const previewScores = useMemo(
    () => computeHandScores(entry, game.players, game.scoring),
    [entry, game.players, game.scoring],
  );

  const updatePP = (pid: PlayerId, patch: Partial<RemiPerPlayerEntry>): void => {
    setPerPlayer((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], ...patch },
    }));
  };

  const onSubmit = async (): Promise<void> => {
    if (!v.ok) return;
    await commitHand(entry);
    navigate(`/remi/game/${game.id}`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {t('history.handLine', { n: handIndex + 1 })}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">{t('handEntry.title')}</h2>
      </div>

      <section className="space-y-2">
        <div className="text-sm uppercase tracking-wide text-slate-400">
          {t('handEntry.winnerSection')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {game.players.map((p) => {
            const active = winnerId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setWinnerId(active ? null : p.id)}
                className={
                  'rounded-lg border px-3 py-2 text-sm ' +
                  (active
                    ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700')
                }
              >
                {p.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setWinnerId(null)}
            className={
              'col-span-2 rounded-lg border px-3 py-2 text-sm ' +
              (winnerId === null
                ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700')
            }
          >
            {t('handEntry.noWinner')}
          </button>
        </div>
        {winnerId !== null && (
          <>
            <label className="flex items-start gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={selfWin}
                onChange={(e) => setSelfWin(e.target.checked)}
                className="mt-0.5"
              />
              <span>{t('handEntry.selfWin')}</span>
            </label>
            {game.scoring.doubleScoreOnJolyDiscardWin && (
              <label className="flex items-start gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={winnerDiscardedJoly}
                  onChange={(e) => setWinnerDiscardedJoly(e.target.checked)}
                  className="mt-0.5"
                />
                <span>{t('handEntry.winnerDiscardedJoly')}</span>
              </label>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="text-sm uppercase tracking-wide text-slate-400">
          {t('handEntry.perPlayerSection')}
        </div>
        {game.players.map((p) => {
          const isWinner = winnerId === p.id;
          const pp = entry.perPlayer[p.id];
          const score = previewScores[p.id] ?? 0;
          const sign = score > 0 ? '+' : '';
          return (
            <div
              key={p.id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-3"
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-base font-medium text-slate-100">{p.name}</span>
                <span
                  className={
                    'tabular-nums text-lg font-semibold ' +
                    (score > 0
                      ? 'text-emerald-400'
                      : score < 0
                        ? 'text-rose-400'
                        : 'text-slate-400')
                  }
                >
                  {sign}
                  {score}
                </span>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-400">
                  <span className="block uppercase tracking-wide">
                    {t('handEntry.meldedValue')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={!pp.melded}
                    value={pp.meldedValue}
                    onChange={(e) =>
                      updatePP(p.id, {
                        meldedValue: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-right tabular-nums text-slate-100 disabled:opacity-40"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  <span className="block uppercase tracking-wide">
                    {t('handEntry.rackValue')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={isWinner}
                    value={pp.rackValue}
                    onChange={(e) =>
                      updatePP(p.id, {
                        rackValue: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-right tabular-nums text-slate-100 disabled:opacity-40"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-1 text-sm text-slate-200">
                <Flag
                  label={t('handEntry.melded')}
                  checked={pp.melded}
                  disabled={isWinner}
                  onChange={(on) =>
                    updatePP(p.id, {
                      melded: on,
                      meldedValue: on ? perPlayer[p.id].meldedValue : 0,
                    })
                  }
                />
                <Flag
                  label={t('handEntry.jolyFirstMelded')}
                  checked={pp.jolyFirstMelded}
                  onChange={(on) => updatePP(p.id, { jolyFirstMelded: on })}
                />
                <Flag
                  label={t('handEntry.jolyOnRack')}
                  checked={pp.jolyOnRack}
                  disabled={isWinner}
                  onChange={(on) => updatePP(p.id, { jolyOnRack: on })}
                />
                <Flag
                  label={t('handEntry.declaredIdenticalExposed')}
                  checked={pp.declaredIdenticalExposed}
                  onChange={(on) => updatePP(p.id, { declaredIdenticalExposed: on })}
                />
              </div>
            </div>
          );
        })}
      </section>

      {!v.ok && v.errors.length > 0 && (
        <ul className="rounded-md bg-amber-900/30 px-3 py-2 text-sm text-amber-200">
          {v.errors.map((e, i) => (
            <li key={i}>{translateError(t, e)}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/remi/game/${game.id}`)}
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
          {t('handEntry.save')}
        </button>
      </div>
    </div>
  );
}

function Flag({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange(on: boolean): void;
  disabled?: boolean;
}) {
  return (
    <label
      className={
        'flex items-start gap-2 ' + (disabled ? 'opacity-50' : '')
      }
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>{label}</span>
    </label>
  );
}
