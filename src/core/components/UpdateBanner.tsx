import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { registerSW } from 'virtual:pwa-register';

export default function UpdateBanner() {
  const { t } = useTranslation();
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
  }, []);

  if (!needRefresh) return null;
  return (
    <div className="flex items-center justify-between gap-2 bg-amber-600 px-4 py-2 text-sm text-white">
      <span>{t('common.updateAvailable')}</span>
      <button
        type="button"
        onClick={() => updateSWRef.current?.(true)}
        className="rounded bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
      >
        {t('common.reload')}
      </button>
    </div>
  );
}
