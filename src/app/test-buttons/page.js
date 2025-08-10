'use client'

import { useState } from 'react'

export default function TestButtonsPage() {
  const [clickCount, setClickCount] = useState(0)
  const [message, setMessage] = useState('')

  const handleButtonClick = (buttonName) => {
    setClickCount(prev => prev + 1)
    setMessage(`Button "${buttonName}" clicked! Total clicks: ${clickCount + 1}`)
    console.log(`Button "${buttonName}" clicked!`)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setMessage('Form submitted successfully!')
    console.log('Form submitted!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Button Functionality Test</h1>
        
        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <p className="text-gray-600 mb-2">Total button clicks: <span className="font-bold text-green-600">{clickCount}</span></p>
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
        </div>

        {/* Basic Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Basic Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => handleButtonClick('Primary')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Primary Button
            </button>
            
            <button 
              onClick={() => handleButtonClick('Secondary')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Secondary Button
            </button>
            
            <button 
              onClick={() => handleButtonClick('Outline')}
              className="border border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Outline Button
            </button>
          </div>
        </div>

        {/* Form Test */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Form Test</h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Input
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter some text..."
              />
            </div>
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Submit Form
            </button>
          </form>
        </div>

        {/* Link Test */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Link Test</h2>
          <div className="flex flex-wrap gap-4">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleButtonClick('Link')
              }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Test Link
            </a>
            
            <a 
              href="/"
              className="text-green-600 hover:text-green-800 underline"
            >
              Back to Home
            </a>
          </div>
        </div>

        {/* Console Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Debug Instructions</h2>
          <p className="text-yellow-700 mb-2">1. Open browser developer console (F12)</p>
          <p className="text-yellow-700 mb-2">2. Click the buttons above</p>
          <p className="text-yellow-700 mb-2">3. Check for any error messages in the console</p>
          <p className="text-yellow-700">4. If buttons work here but not on main page, the issue is with i18n or other dependencies</p>
        </div>
      </div>
    </div>
  )
}
