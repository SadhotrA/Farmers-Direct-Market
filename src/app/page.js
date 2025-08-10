'use client'

import { useState } from 'react'
import { Search, MapPin, Truck, Users, Shield, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function HomePage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    setMessage(`Searching for: ${searchQuery} in: ${location}`)
    console.log('Searching for:', searchQuery, 'in:', location)
  }

  const handleButtonClick = (action) => {
    setMessage(`${action} button clicked!`)
    console.log(`${action} button clicked!`)
  }

  const handleLogin = () => {
    handleButtonClick('Login')
    // TODO: Navigate to login page
  }

  const handleRegister = () => {
    handleButtonClick('Register')
    // TODO: Navigate to register page
  }

  const handleStartShopping = () => {
    handleButtonClick('Start Shopping')
    // TODO: Navigate to products page
  }

  const handleLearnMore = () => {
    handleButtonClick('Learn More')
    // TODO: Navigate to about page
  }

  const handleRegisterFarmer = () => {
    handleButtonClick('Register as Farmer')
    // TODO: Navigate to farmer registration
  }

  const handleStartShoppingCTA = () => {
    handleButtonClick('Start Shopping CTA')
    // TODO: Navigate to products page
  }

  return (
    <div className="min-h-screen">
      {/* Message Display */}
      {message && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          {message}
          <button 
            onClick={() => setMessage('')}
            className="ml-2 text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-green-600">FarmDirect</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">{t('home.features.title')}</a>
                <a href="#about" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">About</a>
                <button 
                  onClick={handleLogin}
                  className="btn-secondary"
                >
                  {t('navigation.login')}
                </button>
                <button 
                  onClick={handleRegister}
                  className="btn-primary"
                >
                  {t('navigation.register')}
                </button>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={t('products.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={t('products.filters.location')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <button type="submit" className="btn-primary whitespace-nowrap">
                  {t('common.search')}
                </button>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleStartShopping}
                className="btn-primary text-lg px-8 py-3"
              >
                {t('home.hero.cta')}
              </button>
              <button 
                onClick={handleLearnMore}
                className="btn-secondary text-lg px-8 py-3"
              >
                {t('home.hero.learnMore')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides everything you need for a seamless farm-to-table experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.features.direct.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.direct.description')}
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.features.fresh.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.fresh.description')}
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.features.quality.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.quality.description')}
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Local Focus</h3>
              <p className="text-gray-600">
                Find farms and products within your local area for faster delivery
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assured</h3>
              <p className="text-gray-600">
                Quality ratings and reviews ensure you get the best products
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Discovery</h3>
              <p className="text-gray-600">
                Advanced search and filtering to find exactly what you need
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-green-100">Active Farmers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">1000+</div>
              <div className="text-green-100">Happy Buyers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-green-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24hr</div>
              <div className="text-green-100">Average Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers and buyers who are already benefiting from direct connections
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleRegisterFarmer}
              className="btn-primary text-lg px-8 py-3"
            >
              Register as Farmer
            </button>
            <button 
              onClick={handleStartShoppingCTA}
              className="btn-secondary text-lg px-8 py-3"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">FarmDirect</h3>
              <p className="text-gray-400">
                Connecting farmers with buyers for a better tomorrow.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">How it Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Products</a></li>
                <li><a href="#" className="hover:text-white">Delivery Info</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FarmDirect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
