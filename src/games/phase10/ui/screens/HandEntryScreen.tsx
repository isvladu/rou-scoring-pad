import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { usePhase10GameStore } from '../../state/gameStore';
import {
  validateHandEntry,
  type Phase10ValidationErrorCode,
} from '../../domain/validation';
import { displayPhase } from '../../domain/phases';
import type {
  Phase10Game,
  Phase10HandEntry,
  Player,
  PlayerId,
} from '../../domain/types';
import PlayerSinglePick from '../../../../core/components/PlayerSinglePick';

function emptyCounts(players: Player[]): Record<PlayerId, number> {
  return Object.fromEntries(players.map((p) => [p.id, 0]));
}

function emptyFlags(players: Player[]): Record<PlayerId, boolean> {
  return Object.fromEntries(players.map((p) => [p.id, false]));
}

function translateError(
  t: (key: string, params?: Record<string, unknown>) => string,
  err: Phase10ValidationErrorCode,
): string {
  switch (err.code) {
    case 'noWentOut':
      return t('handEntry.errors.noWentOut');
    case 'unknownWentOut':
      return t('handEntry.errors.unknownWentOut');
    case 'wentOutMustHaveZeroPenalty':
      return t('handEntry.errors.wentOutMustHaveZeroPenalty', {
        name: err.name,
        actual: err.actual,
      });
    case 'penaltyMustBeNonNegInt':
      return t('handEntry.errors.penaltyMustBeNonNegInt', { name: err.name });
  }
}

export default function HandEntryScreen() {
  const { id } = useParams();
  const { active, load } = usePhase10GameStore();

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
  game: Phase10Game;
  handIndex: number;
}) {
  const { t } = useTranslation('phase10');
  const navigate = useNavigate();
  const { commitHand } = usePhase10GameStore();

  const [wentOutId, setWentOutId] = useState<PlayerId | null>(null);
  const [penalties, setPenalties] = useState<Record<PlayerId, number>>(() =>
    emptyCounts(game.players),
  );
  const [completed, setCompleted] = useState<Record<PlayerId, boolean>>(() =>
    emptyFlags(game.players),
  );

  // The wentOut player's penalty is locked to 0 and their completedPhase is
  // locked to true. We DERIVE that here rather than syncing it back into
  // state via an effect — the inputs render the locked values from `entry`,
  // and the raw `penalties`/`completed` retain whatever the user typed for
  // that player BEFORE they were picked as wentOut, so undoing the pick
  // restores their inputs.
  const entry: Phase10HandEntry = useMemo(() => {
    if (!wentOutId) {
      return {
        wentOutId: '',
        remainingPenalty: penalties,
        completedPhase: completed,
      };
    }
    return {
      wentOutId,
      remainingPenalty: { ...penalties, [wentOutId]: 0 },
      completedPhase: { ...completed, [wentOutId]: true },
    };
  }, [wentOutId, penalties, completed]);

  const v = validateHandEntry(entry, game.players);

  const setPenalty = (id: PlayerId, value: number): void => {
    setPenalties((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(value)) }));
  };
  const addPenalty = (id: PlayerId, amount: number): void => {
    setPenalties((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + amount }));
  };
  const toggleCompleted = (id: PlayerId, on: boolean): void => {
    setCompleted((prev) => ({ ...prev, [id]: on }));
  };

  const onSubmit = async (): Promise<void> => {
    if (!v.ok) return;
    await commitHand(entry);
    navigate(`/phase10/game/${game.id}`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {t('history.handLine', { n: handIndex + 1, name: '—' })}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">{t('handEntry.title')}</h2>
      </div>

      <section className="space-y-2">
        <PlayerSinglePick
          players={game.players}
          selectedId={wentOutId}
          onSelect={setWentOutId}
          label={t('handEntry.wentOut')}
        />
      </section>

      <section className="space-y-3">
        <div className="text-sm uppercase tracking-wide text-slate-400">
          {t('handEntry.penaltyHeader')}
        </div>
        <p className="text-xs text-slate-500">
          {t('handEntry.penaltyHint', {
            low: game.scoring.penaltyLow,
            high: game.scoring.penaltyHigh,
            skip: game.scoring.penaltySkip,
            wild: game.scoring.penaltyWild,
          })}
        </p>
        <ul className="space-y-2">
          {game.players.map((p) => {
            const phase = displayPhase(p.id, game.hands);
            const isOut = p.id === wentOutId;
            // Display the locked values when this player is the wentOut.
            const penalty = isOut ? 0 : (penalties[p.id] ?? 0);
            const isCompleted = isOut ? true : (completed[p.id] ?? false);
            return (
              <li
                key={p.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base text-slate-100">{p.name}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {t('game.phase', { n: phase })}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    disabled={isOut}
                    value={penalty}
                    onChange={(e) => setPenalty(p.id, Number(e.target.value) || 0)}
                    className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right tabular-nums text-slate-100 disabled:opacity-50"
                  />
                </div>
                {!isOut && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      game.scoring.penaltyLow,
                      game.scoring.penaltyHigh,
                      game.scoring.penaltySkip,
                      game.scoring.penaltyWild,
                    ].map((amount, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addPenalty(p.id, amount)}
                        className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                      >
                        +{amount}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPenalty(p.id, 0)}
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-slate-500"
                    >
                      0
                    </button>
                  </div>
                )}
                <label className="mt-2 flex items-start gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    disabled={isOut}
                    checked={isCompleted}
                    onChange={(e) => toggleCompleted(p.id, e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    {t('handEntry.completedPhase', { n: phase })}
                    {isOut && (
                      <span className="ml-1 text-xs text-slate-500">
                        {t('handEntry.wentOutPhaseAuto')}
                      </span>
                    )}
                  </span>
                </label>
                {isOut && (
                  <p className="mt-1 text-xs text-slate-500">
                    {t('handEntry.wentOutAuto')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
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
          onClick={() => navigate(`/phase10/game/${game.id}`)}
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
