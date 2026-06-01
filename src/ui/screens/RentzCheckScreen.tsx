import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../state/gameStore';
import {
  rentzRefusalCount,
  rentzRefusalThreshold,
} from '../../domain/rentzRefusals';

export default function RentzCheckScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, rotation, recordRentzRefusal } = useGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  const rot = rotation();
  if (!rot || !rot.currentPickerId) {
    navigate(`/game/${active.id}/summary`, { replace: true });
    return null;
  }
  const picker = active.players.find((p) => p.id === rot.currentPickerId);
  const dealer = active.players.find((p) => p.id === rot.currentDealerId);
  const others = active.players.filter((p) => p.id !== rot.currentPickerId);

  const handleRefuse = async (refuserId: string, refuserName: string): Promise<void> => {
    await recordRentzRefusal(refuserId);
    navigate(`/game/${active.id}/pick`, {
      replace: true,
      state: { refusedBy: refuserName },
    });
  };

  const handleProceed = (): void => {
    navigate(`/game/${active.id}/round/rentz`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {t('contracts.rentz.label')}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">
          {picker ? t('rentzCheck.intro', { name: picker.name }) : ''}
        </h2>
        {dealer && (
          <p className="text-xs text-slate-500">
            {t('game.dealerIs', { name: dealer.name })}
          </p>
        )}
      </div>

      <p className="text-sm text-slate-400">{t('rentzCheck.help')}</p>

      <ul className="space-y-2">
        {others.map((p) => {
          const count = rentzRefusalCount(active, p.id);
          const threshold = rentzRefusalThreshold(count);
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-slate-100">{p.name}</span>
                <span className="text-xs text-slate-400">
                  {t('rentzCheck.statusLine', { count, threshold })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleRefuse(p.id, p.name)}
                className="rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
              >
                {t('rentzCheck.refuse')}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleProceed}
        className="w-full rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600"
      >
        {t('rentzCheck.proceed')}
      </button>

      <button
        type="button"
        onClick={() => navigate(`/game/${active.id}/pick`)}
        className="text-sm text-slate-400 underline"
      >
        ← {t('common.back')}
      </button>
    </div>
  );
}
