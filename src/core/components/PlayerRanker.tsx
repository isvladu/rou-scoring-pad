import type { Player, PlayerId } from '../types';

interface Props {
  players: Player[];
  order: PlayerId[];
  onChange(order: PlayerId[]): void;
  label?: string;
}

export default function PlayerRanker({ players, order, onChange, label }: Props) {
  const ranked = new Set(order);
  const unranked = players.filter((p) => !ranked.has(p.id));

  const togglePlayer = (id: PlayerId): void => {
    if (ranked.has(id)) {
      onChange(order.filter((x) => x !== id));
    } else {
      onChange([...order, id]);
    }
  };

  return (
    <div className="space-y-4">
      {label && <div className="text-sm uppercase tracking-wide text-slate-400">{label}</div>}
      <ol className="space-y-2">
        {order.map((pid, idx) => {
          const p = players.find((x) => x.id === pid);
          if (!p) return null;
          return (
            <li
              key={pid}
              className="flex items-center justify-between rounded-lg border border-brand-500 bg-brand-500/10 px-3 py-2"
            >
              <span className="flex items-baseline gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-sm font-bold text-slate-900">
                  {idx + 1}
                </span>
                <span className="text-base text-slate-100">{p.name}</span>
              </span>
              <button
                type="button"
                onClick={() => togglePlayer(pid)}
                className="text-xs uppercase tracking-wide text-slate-400 hover:text-rose-400"
              >
                ×
              </button>
            </li>
          );
        })}
      </ol>
      {unranked.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {unranked.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlayer(p.id)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-left text-base text-slate-200 hover:border-slate-700"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
