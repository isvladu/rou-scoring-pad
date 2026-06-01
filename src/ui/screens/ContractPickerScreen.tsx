import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../state/gameStore';
import { canBeBlind } from '../../domain/contracts';

export default function ContractPickerScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, rotation } = useGameStore();
  const [blind, setBlind] = useState(false);

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
  const blindAvailable = rot.legalContracts.length > 1;
  const blindActive = blind && blindAvailable;
  const blindMultiplier = active.scoring.blindMultiplier;

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

      <div
        className={
          'rounded-lg border p-3 ' +
          (blindActive
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-slate-800 bg-slate-900/50')
        }
      >
        <label
          className={
            'flex items-center justify-between gap-3 ' +
            (blindAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50')
          }
        >
          <span className="flex items-baseline gap-2">
            <span className="text-base font-medium text-slate-100">
              {t('game.blindToggle')}
            </span>
            <span className="text-xs text-slate-400">
              ×{blindMultiplier}
            </span>
          </span>
          <input
            type="checkbox"
            checked={blindActive}
            disabled={!blindAvailable}
            onChange={(e) => setBlind(e.target.checked)}
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-700 transition-colors checked:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
          />
        </label>
        <p className="mt-2 text-xs text-slate-400">
          {blindAvailable
            ? t('game.blindHelp', { m: blindMultiplier })
            : t('game.blindUnavailable')}
        </p>
      </div>

      <ul className="space-y-2">
        {rot.legalContracts.map((c) => {
          const allowBlindForThis = canBeBlind(c);
          const lockedByBlind = blindActive && !allowBlindForThis;
          const submitBlind = blindActive && allowBlindForThis;
          return (
            <li key={c}>
              <button
                type="button"
                disabled={lockedByBlind}
                onClick={() =>
                  navigate(
                    `/game/${active.id}/round/${c}${submitBlind ? '?blind=1' : ''}`,
                  )
                }
                className={
                  'flex w-full items-center justify-between rounded-lg border px-4 py-4 text-left transition-colors ' +
                  (lockedByBlind
                    ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 opacity-50'
                    : 'border-slate-800 bg-slate-900 hover:border-brand-500')
                }
              >
                <span className="flex flex-col gap-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-base font-medium text-slate-100">
                      {t(`contracts.${c}.label`)}
                    </span>
                    {submitBlind && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
                        {t('game.blindBadge')}
                      </span>
                    )}
                  </span>
                  {lockedByBlind && (
                    <span className="text-[11px] text-amber-300/80">
                      {t('game.blindNotAllowedForContract')}
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-400">{t(`contracts.${c}.kind`)}</span>
              </button>
            </li>
          );
        })}
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
