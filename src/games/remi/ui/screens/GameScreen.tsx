import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useRemiGameStore } from '../../state/gameStore';
import { totalScores } from '../../domain/scoring';
import Scoreboard from '../../../../core/components/Scoreboard';
import RemiHandHistory from '../components/RemiHandHistory';

export default function GameScreen() {
  const { t } = useTranslation('remi');
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, undoLastHand } = useRemiGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  if (active.status === 'finished')
    return <Navigate to={`/remi/game/${active.id}/summary`} replace />;

  const totals = totalScores(active.players, active.hands);
  const modeLine =
    active.endCondition.kind === 'targetScore'
      ? t('game.targetMode', { target: active.endCondition.targetScore })
      : t('game.handCountMode', {
          n: active.hands.length + 1,
          total: active.endCondition.handCount,
        });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {t('game.handsPlayed', { n: active.hands.length })} · {modeLine}
        </div>
      </section>

      <Scoreboard players={active.players} totals={totals} />

      {active.hands.length > 0 && (
        <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <summary className="cursor-pointer text-sm text-slate-400">
            {t('history.title')}
          </summary>
          <div className="mt-3">
            <RemiHandHistory game={active} />
          </div>
        </details>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/remi/game/${active.id}/hand`)}
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
