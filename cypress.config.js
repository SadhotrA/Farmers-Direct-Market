const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    env: {
      // Test data
      testUser: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!',
        role: 'buyer'
      },
      testFarmer: {
        name: 'Test Farmer',
        email: 'farmer@example.com',
        password: 'TestPass123!',
        role: 'farmer',
        farmName: 'Test Farm'
      },
      testProduct: {
        title: 'Test Product',
        description: 'Test product description',
        category: 'vegetables',
        price: 10.50,
        quantity: 100,
        unit: 'kg'
      }
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
})
