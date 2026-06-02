import { useTranslation } from 'react-i18next';
import { ALL_CONTRACTS, type Player, type Round } from '../../domain/types';
import type { RotationState } from '../../domain/rotation';

interface Props {
  players: Player[];
  rounds: Round[];
  rotation: RotationState;
}

export default function RotationGrid({ players, rounds, rotation }: Props) {
  const { t } = useTranslation('rentz');
  const playedMap = new Map<string, { blind: boolean }>();
  for (const r of rounds) {
    playedMap.set(`${r.pickerId}:${r.entry.contract}`, { blind: r.blind });
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-slate-950 px-2 py-1 text-left font-medium text-slate-400">
              {t('common.player')}
            </th>
            {ALL_CONTRACTS.map((c) => (
              <th
                key={c}
                className="px-2 py-1 text-center font-medium text-slate-400"
                title={t(`contracts.${c}.label`)}
              >
                {t(`contracts.${c}.short`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td
                className={
                  'sticky left-0 z-10 bg-slate-950 px-2 py-1 text-left text-slate-200 ' +
                  (p.id === rotation.currentPickerId ? 'font-bold text-brand-500' : '')
                }
              >
                {p.name}
              </td>
              {ALL_CONTRACTS.map((c) => {
                const played = playedMap.get(`${p.id}:${c}`);
                const isCurrent =
                  p.id === rotation.currentPickerId && rotation.legalContracts.includes(c);
                return (
                  <td
                    key={c}
                    className={
                      'h-7 w-7 border border-slate-800 text-center text-base ' +
                      (played
                        ? played.blind
                          ? 'bg-amber-500/15 font-bold text-amber-400'
                          : 'bg-slate-800 text-slate-500'
                        : isCurrent
                          ? 'bg-brand-500/10 text-brand-500'
                          : 'text-slate-700')
                    }
                  >
                    {played ? (played.blind ? 'B' : '·') : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
