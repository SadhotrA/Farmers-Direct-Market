'use client';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const MultilingualExample = () => {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLang(lng);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('common.language')} Demo
      </h2>
      
      {/* Language Switcher */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Switch Language:</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-md ${
              currentLang === 'en'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🇺🇸 English
          </button>
          <button
            onClick={() => changeLanguage('es')}
            className={`px-4 py-2 rounded-md ${
              currentLang === 'es'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🇪🇸 Español
          </button>
        </div>
      </div>

      {/* Translation Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Navigation */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{t('navigation.title') || 'Navigation'}</h4>
          <ul className="space-y-2">
            <li>{t('navigation.home')}</li>
            <li>{t('navigation.products')}</li>
            <li>{t('navigation.orders')}</li>
            <li>{t('navigation.chat')}</li>
            <li>{t('navigation.profile')}</li>
          </ul>
        </div>

        {/* Common Actions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{t('common.title') || 'Common Actions'}</h4>
          <ul className="space-y-2">
            <li>{t('common.save')}</li>
            <li>{t('common.cancel')}</li>
            <li>{t('common.edit')}</li>
            <li>{t('common.delete')}</li>
            <li>{t('common.search')}</li>
          </ul>
        </div>

        {/* Home Page Content */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{t('home.title') || 'Home Page'}</h4>
          <div className="space-y-2">
            <p><strong>{t('home.hero.title')}</strong></p>
            <p className="text-sm text-gray-600">{t('home.hero.subtitle')}</p>
            <p><strong>{t('home.features.title')}</strong></p>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{t('products.title')}</h4>
          <ul className="space-y-2">
            <li>{t('products.product.addToCart')}</li>
            <li>{t('products.product.contactFarmer')}</li>
            <li>{t('products.product.price')}</li>
            <li>{t('products.product.quantity')}</li>
            <li>{t('products.product.description')}</li>
          </ul>
        </div>

        {/* Order Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{t('orders.title')}</h4>
          <ul className="space-y-2">
            <li>{t('orders.status.placed')}</li>
            <li>{t('orders.status.confirmed')}</li>
            <li>{t('orders.status.packed')}</li>
            <li>{t('orders.status.shipped')}</li>
            <li>{t('orders.status.delivered')}</li>
          </ul>
        </div>

        {/* Chat Messages */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{t('chat.title')}</h4>
          <ul className="space-y-2">
            <li>{t('chat.message.placeholder')}</li>
            <li>{t('chat.message.send')}</li>
            <li>{t('chat.message.typing')}</li>
            <li>{t('chat.message.online')}</li>
            <li>{t('chat.message.offline')}</li>
          </ul>
        </div>
      </div>

      {/* Current Language Info */}
      <div className="mt-6 p-4 bg-primary-50 rounded-lg">
        <p className="text-sm text-primary-700">
          <strong>Current Language:</strong> {currentLang === 'en' ? 'English' : 'Español'}
        </p>
        <p className="text-sm text-primary-600 mt-1">
          Language code: {currentLang}
        </p>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How to Use:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Import useTranslation: <code>import { '{ useTranslation }' } from 'react-i18next'</code></li>
          <li>• Use in component: <code>const { '{ t }' } = useTranslation()</code></li>
          <li>• Translate text: <code>{ 't(\'key.path\')' }</code></li>
          <li>• Change language: <code>i18n.changeLanguage('es')</code></li>
        </ul>
      </div>
    </div>
  );
};

export default MultilingualExample;
