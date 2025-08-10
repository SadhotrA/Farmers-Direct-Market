# Multilingual UI Implementation

This document describes the multilingual implementation for the Farmers' Direct Market application using `react-i18next`.

## Overview

The application now supports multiple languages with a complete translation system that includes:
- English and Spanish translations
- Language detection and persistence
- Language switcher component
- Translation keys for all UI elements
- Fallback to English for missing translations

## Files Structure

```
src/
├── lib/
│   ├── i18n.js                    # i18n configuration
│   └── locales/
│       ├── en.json               # English translations
│       └── es.json               # Spanish translations
├── components/
│   ├── I18nProvider.js           # i18n provider wrapper
│   ├── LanguageSwitcher.js       # Language switcher component
│   └── MultilingualExample.js    # Demo component
└── app/
    ├── layout.js                 # Updated with i18n provider
    ├── page.js                   # Updated with translations
    └── demo/
        └── page.js               # Demo page
```

## Installation

The required packages have been installed:

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

## Configuration

### 1. i18n Configuration (`src/lib/i18n.js`)

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });
```

### 2. Layout Integration (`src/app/layout.js`)

```javascript
import '../lib/i18n' // Initialize i18n
import I18nProvider from '../components/I18nProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
```

## Usage

### 1. Basic Translation

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
    </div>
  );
}
```

### 2. Language Switching

```javascript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('es')}>Español</button>
    </div>
  );
}
```

### 3. Using the LanguageSwitcher Component

```javascript
import LanguageSwitcher from '../components/LanguageSwitcher';

function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation items */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

## Translation Keys Structure

The translation files are organized hierarchically:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save",
    "cancel": "Cancel"
  },
  "navigation": {
    "home": "Home",
    "products": "Products",
    "orders": "Orders"
  },
  "home": {
    "hero": {
      "title": "Farmers' Direct Market",
      "subtitle": "Connect directly with local farmers..."
    },
    "features": {
      "title": "Why Choose Farmers' Direct Market?",
      "fresh": {
        "title": "Fresh from Farm",
        "description": "Get produce directly from local farmers..."
      }
    }
  }
}
```

## Features

### 1. Language Detection
- Automatically detects browser language
- Falls back to English if language not supported
- Persists language choice in localStorage

### 2. Language Switcher
- Dropdown with flag icons
- Shows current language
- Smooth transitions
- Accessible design

### 3. Translation Coverage
- Complete UI text coverage
- Error messages
- Success messages
- Form labels and placeholders
- Navigation items
- Page content

### 4. Fallback System
- Falls back to English for missing translations
- Graceful handling of translation keys
- Development mode shows missing keys

## Demo

Visit `/demo` to see the multilingual functionality in action. The demo page includes:
- Language switcher
- Translation examples
- Implementation details
- Usage instructions

## Adding New Languages

To add a new language (e.g., French):

1. Create `src/lib/locales/fr.json`:
```json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
  // ... rest of translations
}
```

2. Update `src/lib/i18n.js`:
```javascript
import frTranslations from './locales/fr.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations }
};
```

3. Update `LanguageSwitcher.js`:
```javascript
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];
```

## Best Practices

1. **Use descriptive keys**: `home.hero.title` instead of `title`
2. **Group related translations**: Keep related text under the same namespace
3. **Use interpolation for dynamic content**: `t('welcome', { name: userName })`
4. **Test all languages**: Ensure translations fit in the UI
5. **Maintain consistency**: Use the same terminology across languages

## Troubleshooting

### Common Issues

1. **Translations not showing**: Ensure `I18nProvider` wraps your app
2. **Language not persisting**: Check localStorage permissions
3. **Missing translations**: Add fallback text or check key names
4. **Build errors**: Ensure all translation files are valid JSON

### Debug Mode

Enable debug mode in development:
```javascript
debug: process.env.NODE_ENV === 'development'
```

This will show missing translation keys in the console.

## Performance Considerations

- Translation files are loaded on demand
- Language detection happens once on app load
- Translations are cached in localStorage
- Minimal bundle size impact

## Future Enhancements

- Add more languages (French, German, etc.)
- Implement RTL support for Arabic
- Add translation management interface
- Implement dynamic translation loading
- Add pluralization support
