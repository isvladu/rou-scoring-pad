import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type GameId = 'rentz' | 'whist' | 'phase10' | 'remi';

const TILES: ReadonlyArray<{ id: GameId; to: string | null }> = [
  { id: 'rentz', to: '/rentz' },
  { id: 'whist', to: '/whist' },
  { id: 'phase10', to: '/phase10' },
  { id: 'remi', to: null },
];

type Status = { kind: 'idle' } | { kind: 'ok'; message: string } | { kind: 'err'; message: string };

export default function HomeScreen() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleExport = async (): Promise<void> => {
    setBusy(true);
    setStatus({ kind: 'idle' });
    try {
      // Dynamic imports keep the landing chunk clean: the unified module
      // + adapters only ship when the user clicks Export/Import.
      const { exportAllAsUnified } = await import('../../core/storage/unifiedExportImport');
      const { triggerDownload } = await import('../../core/storage/triggerDownload');
      const json = await exportAllAsUnified();
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(`scoring-pad-${date}.json`, json);
    } catch (err) {
      setStatus({ kind: 'err', message: String(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus({ kind: 'idle' });
    try {
      const text = await file.text();
      const { importFromAnyFormat } = await import('../../core/storage/unifiedExportImport');
      const result = await importFromAnyFormat(text);
      setStatus({
        kind: 'ok',
        message: t('landing.backup.importSuccess', { total: result.totalImported }),
      });
    } catch (err) {
      setStatus({ kind: 'err', message: String(err) });
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

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

      <section className="space-y-2 border-t border-slate-800 pt-5">
        <h2 className="text-xs uppercase tracking-wide text-slate-500">
          {t('landing.backup.title')}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleExport()}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            {t('landing.backup.exportAll')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            {t('landing.backup.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {status.kind === 'ok' && (
          <p className="rounded-md bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200">
            {status.message}
          </p>
        )}
        {status.kind === 'err' && (
          <p className="rounded-md bg-rose-900/30 px-3 py-2 text-sm text-rose-300">
            {status.message}
          </p>
        )}
      </section>
    </div>
  );
}
