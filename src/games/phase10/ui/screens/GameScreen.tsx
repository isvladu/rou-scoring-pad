import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePhase10GameStore } from '../../state/gameStore';
import { totalScores } from '../../domain/scoring';
import { displayPhase, hasClearedAllPhases } from '../../domain/phases';
import type { Phase10Game } from '../../domain/types';
import Phase10HandHistory from '../components/Phase10HandHistory';

export default function GameScreen() {
  const { t } = useTranslation('phase10');
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, undoLastHand } = usePhase10GameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  if (active.status === 'finished')
    return <Navigate to={`/phase10/game/${active.id}/summary`} replace />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {t('game.handsPlayed', { n: active.hands.length })}
        </div>
      </section>

      <PlayerPhaseBoard game={active} />

      {active.hands.length > 0 && (
        <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <summary className="cursor-pointer text-sm text-slate-400">
            {t('history.title')}
          </summary>
          <div className="mt-3">
            <Phase10HandHistory game={active} />
          </div>
        </details>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/phase10/game/${active.id}/hand`)}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600"
        >
          {t('game.nextHand')}
        </button>
        {active.hands.length > 0 && (
          <button
            type="button"
            onClick={() => void undoLastHand()}
            className="rounded-lg border border-slate-700 px-4 py-4 text-sm text-slate-300 hover:border-slate-500"
          >
            ↶ {t('game.undoHand')}
          </button>
        )}
      </div>
    </div>
  );
}

function PlayerPhaseBoard({ game }: { game: Phase10Game }) {
  const { t } = useTranslation('phase10');
  const totals = totalScores(game.players, game.hands);
  // Sort by lowest total (winning order in Phase 10).
  const ranked = [...game.players].sort(
    (a, b) => (totals[a.id] ?? 0) - (totals[b.id] ?? 0),
  );
  return (
    <div className="grid grid-cols-1 gap-2">
      {ranked.map((p) => {
        const phase = displayPhase(p.id, game.hands);
        const done = hasClearedAllPhases(p.id, game.hands);
        const score = totals[p.id] ?? 0;
        return (
          <div
            key={p.id}
            className="flex items-baseline justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-medium text-slate-100">{p.name}</span>
              <span
                className={
                  'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ' +
                  (done
                    ? 'bg-emerald-700/40 text-emerald-200'
                    : 'bg-slate-800 text-slate-300')
                }
              >
                {done ? t('game.phaseDone') : t('game.phase', { n: phase })}
              </span>
            </div>
            <span
              className={
                'tabular-nums text-2xl font-semibold ' +
                (score === 0 ? 'text-slate-400' : 'text-rose-400')
              }
            >
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
