import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type GameId = 'rentz' | 'whist' | 'phase10' | 'remi';

const TILES: ReadonlyArray<{ id: GameId; to: string | null }> = [
  { id: 'rentz', to: '/rentz' },
  { id: 'whist', to: null },
  { id: 'phase10', to: null },
  { id: 'remi', to: null },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-100">{t('landing.title')}</h1>
      <ul className="space-y-2">
        {TILES.map((tile) => {
          const label = t(`landing.${tile.id}.label`);
          const tagline = t(`landing.${tile.id}.tagline`);
          if (tile.to) {
            return (
              <li key={tile.id}>
                <Link
                  to={tile.to}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 hover:border-brand-500"
                >
                  <div>
                    <div className="text-base font-medium text-slate-100">{label}</div>
                    <div className="text-xs text-slate-400">{tagline}</div>
                  </div>
                  <span className="text-2xl leading-none text-slate-500">›</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={tile.id}>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 opacity-60">
                <div>
                  <div className="text-base font-medium text-slate-300">{label}</div>
                  <div className="text-xs text-slate-500">{tagline}</div>
                </div>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                  {t('landing.comingSoon')}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
