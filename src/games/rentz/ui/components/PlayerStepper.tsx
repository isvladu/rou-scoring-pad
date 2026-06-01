import type { Player, PlayerId } from '../../domain/types';

interface Props {
  players: Player[];
  values: Record<PlayerId, number>;
  expectedSum: number;
  onChange(values: Record<PlayerId, number>): void;
  label?: string;
}

export default function PlayerStepper({ players, values, expectedSum, onChange, label }: Props) {
  const sum = players.reduce((acc, p) => acc + (values[p.id] ?? 0), 0);
  const remaining = expectedSum - sum;
  const valid = sum === expectedSum;

  const set = (id: PlayerId, v: number): void => {
    const next = Math.max(0, Math.min(expectedSum, v));
    onChange({ ...values, [id]: next });
  };

  return (
    <div className="space-y-3">
      {label && <div className="text-sm uppercase tracking-wide text-slate-400">{label}</div>}
      {players.map((p) => {
        const v = values[p.id] ?? 0;
        return (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
          >
            <span className="text-base text-slate-100">{p.name}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set(p.id, v - 1)}
                disabled={v <= 0}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-xl text-slate-200 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums text-xl text-slate-100">{v}</span>
              <button
                type="button"
                onClick={() => set(p.id, v + 1)}
                disabled={remaining <= 0}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-xl text-slate-200 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
      <div
        className={
          'rounded-md px-3 py-2 text-sm ' +
          (valid
            ? 'bg-emerald-900/30 text-emerald-300'
            : 'bg-amber-900/30 text-amber-300')
        }
      >
        {sum} / {expectedSum}
      </div>
    </div>
  );
}
