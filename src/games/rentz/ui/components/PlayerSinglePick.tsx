import type { Player, PlayerId } from '../../domain/types';

interface Props {
  players: Player[];
  selectedId: PlayerId | null;
  onSelect(id: PlayerId): void;
  label?: string;
}

export default function PlayerSinglePick({ players, selectedId, onSelect, label }: Props) {
  return (
    <div className="space-y-3">
      {label && <div className="text-sm uppercase tracking-wide text-slate-400">{label}</div>}
      <div className="grid grid-cols-2 gap-2">
        {players.map((p) => {
          const active = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={
                'rounded-lg border px-4 py-4 text-left text-lg transition-colors ' +
                (active
                  ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700')
              }
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
