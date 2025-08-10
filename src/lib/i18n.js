'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  }
};

// Initialize i18n only once
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en', // default language
      fallbackLng: 'en',
      debug: false,
      
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      
      react: {
        useSuspense: false, // This is important for Next.js
      }
    });
}

export default i18n;
