import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../state/gameStore';
import { totalScores } from '../../domain/scoring';
import { serializeGames } from '../../storage/exportImport';
import { triggerDownload } from '../../../../core/storage/triggerDownload';
import Scoreboard from '../../../../core/components/Scoreboard';
import RoundHistory from '../components/RoundHistory';

export default function GameSummaryScreen() {
  const { t } = useTranslation('rentz');
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, finish } = useGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  useEffect(() => {
    // Guard against the stale-active race: the load effect above may still
    // be fetching the URL game; until `active.id === id`, the store could
    // be holding a previously-opened game we must NOT mark finished.
    if (active && active.id === id && active.status !== 'finished') void finish();
  }, [active, id, finish]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  const totals = totalScores(active.players, active.rounds);
  const winner = [...active.players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))[0];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">{t('summary.title')}</h2>
      {winner && (
        <div className="rounded-lg border border-brand-500 bg-brand-500/15 px-4 py-3 text-center text-lg text-slate-100">
          🏆 {t('summary.winner', { name: winner.name })}
        </div>
      )}
      <Scoreboard players={active.players} totals={totals} />
      {(active.rounds.length > 0 || active.rentzRefusals.length > 0) && (
        <section className="space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-slate-400">
            {t('history.title')}
          </h3>
          <RoundHistory game={active} />
        </section>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            triggerDownload(
              `rentz-${active.id.slice(0, 8)}.json`,
              serializeGames([active]),
            )
          }
          className="flex-1 rounded-lg border border-slate-700 px-4 py-3 text-slate-200 hover:border-slate-500"
        >
          {t('summary.exportJson')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/rentz')}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-3 font-medium text-slate-900 hover:bg-brand-600"
        >
          {t('summary.backHome')}
        </button>
      </div>
    </div>
  );
}
