import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en_common from './locales/en.json';
import ro_common from './locales/ro.json';

export const SUPPORTED_LANGUAGES = ['en', 'ro'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANG_STORAGE_KEY = 'rentz.lang';

// Only the `common` namespace ships in the initial bundle. Per-game
// namespaces (rentz, whist, …) are registered by their game module's
// top-level via i18n.addResourceBundle, so they ride along in the
// per-game lazy chunk created by React.lazy in App.tsx.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en_common },
      ro: { common: ro_common },
    },
    ns: ['common'],
    defaultNS: 'common',
    fallbackNS: 'common',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export function setLanguage(lang: SupportedLanguage): void {
  void i18n.changeLanguage(lang);
}

export default i18n;
