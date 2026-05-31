import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';

export default function AppHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
      <Link to="/" className="flex items-baseline gap-2 text-slate-100">
        <span className="text-xl font-semibold tracking-tight">{t('app.title')}</span>
        <span className="text-xs text-slate-400">{t('app.tagline')}</span>
      </Link>
      <LanguageToggle />
    </header>
  );
}
