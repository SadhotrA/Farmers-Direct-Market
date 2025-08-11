// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Script error')) {
    return false
  }
  return true
})

// Global before hook
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Intercept and mock API calls if needed
  cy.intercept('POST', '/api/auth/login', { fixture: 'login-success.json' }).as('login')
  cy.intercept('POST', '/api/auth/register', { fixture: 'register-success.json' }).as('register')
  cy.intercept('GET', '/api/products*', { fixture: 'products.json' }).as('getProducts')
})

// Global after hook
afterEach(() => {
  // Clean up any test data
  cy.log('Test completed')
})
