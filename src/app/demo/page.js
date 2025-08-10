'use client';
import MultilingualExample from '../../components/MultilingualExample';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multilingual UI Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            This page demonstrates the multilingual functionality of the Farmers' Direct Market application
          </p>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Demo Component */}
        <MultilingualExample />

        {/* Additional Information */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Implementation Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Features Implemented:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• English and Spanish translations</li>
                <li>• Language detection and persistence</li>
                <li>• Language switcher component</li>
                <li>• Translation keys for all UI elements</li>
                <li>• Fallback to English for missing translations</li>
                <li>• Browser language detection</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Files Created:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <code>src/lib/i18n.js</code> - i18n configuration</li>
                <li>• <code>src/lib/locales/en.json</code> - English translations</li>
                <li>• <code>src/lib/locales/es.json</code> - Spanish translations</li>
                <li>• <code>src/components/LanguageSwitcher.js</code> - Language switcher</li>
                <li>• <code>src/components/I18nProvider.js</code> - i18n provider</li>
                <li>• <code>src/components/MultilingualExample.js</code> - Demo component</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
