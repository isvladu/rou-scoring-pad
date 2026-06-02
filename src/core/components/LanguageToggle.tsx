import { useTranslation } from 'react-i18next';
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-700 text-xs">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={
            'px-3 py-1.5 font-medium uppercase tracking-wider transition-colors ' +
            (current === lang
              ? 'bg-brand-500 text-slate-900'
              : 'bg-transparent text-slate-300 hover:bg-slate-800')
          }
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
