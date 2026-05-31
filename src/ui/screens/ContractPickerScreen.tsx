import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../state/gameStore';

export default function ContractPickerScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, rotation } = useGameStore();

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

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="text-sm font-medium text-slate-200">
        {picker ? t('game.pickerIs', { name: picker.name }) : ''}
      </div>
      {dealer && (
        <div className="-mt-3 text-xs text-slate-500">
          {t('game.dealerIs', { name: dealer.name })}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-100">{t('game.pickContract')}</h2>
      <ul className="space-y-2">
        {rot.legalContracts.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => navigate(`/game/${active.id}/round/${c}`)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-4 text-left hover:border-brand-500"
            >
              <span className="text-base font-medium text-slate-100">
                {t(`contracts.${c}.label`)}
              </span>
              <span className="text-xs text-slate-400">{t(`contracts.${c}.kind`)}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigate(`/game/${active.id}`)}
        className="text-sm text-slate-400 underline"
      >
        ← {t('common.back')}
      </button>
    </div>
  );
}
