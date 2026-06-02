import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { usePhase10GameStore } from '../../state/gameStore';
import { totalScores } from '../../domain/scoring';
import { displayPhase, hasClearedAllPhases, winnerOf } from '../../domain/phases';
import { serializeGames } from '../../storage/exportImport';
import { triggerDownload } from '../../../../core/storage/triggerDownload';
import Phase10HandHistory from '../components/Phase10HandHistory';

export default function GameSummaryScreen() {
  const { t } = useTranslation('phase10');
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, finish } = usePhase10GameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  useEffect(() => {
    // Same stale-active guard pattern as Rentz / Whist summary screens.
    if (active && active.id === id && active.status !== 'finished') void finish();
  }, [active, id, finish]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  const totals = totalScores(active.players, active.hands);
  const winner = winnerOf(active, (pid) => totals[pid] ?? Infinity);
  // Standings sorted by lowest total (Phase 10: lower is better).
  const ranked = [...active.players].sort(
    (a, b) => (totals[a.id] ?? 0) - (totals[b.id] ?? 0),
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">{t('summary.title')}</h2>
      {winner && (
        <div className="rounded-lg border border-brand-500 bg-brand-500/15 px-4 py-3 text-center text-lg text-slate-100">
          🏆 {t('summary.winner', { name: winner.name })}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-2">
        {ranked.map((p) => {
          const phase = displayPhase(p.id, active.hands);
          const done = hasClearedAllPhases(p.id, active.hands);
          const score = totals[p.id] ?? 0;
          return (
            <li
              key={p.id}
              className="flex items-baseline justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-medium text-slate-100">{p.name}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
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
            </li>
          );
        })}
      </ul>

      {active.hands.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-slate-400">
            {t('history.title')}
          </h3>
          <Phase10HandHistory game={active} />
        </section>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            triggerDownload(
              `phase10-${active.id.slice(0, 8)}.json`,
              serializeGames([active]),
            )
          }
          className="flex-1 rounded-lg border border-slate-700 px-4 py-3 text-slate-200 hover:border-slate-500"
        >
          {t('summary.exportJson')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/phase10')}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-3 font-medium text-slate-900 hover:bg-brand-600"
        >
          {t('summary.backHome')}
        </button>
      </div>
    </div>
  );
}
