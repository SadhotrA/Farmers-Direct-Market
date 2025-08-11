// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login a user
Cypress.Commands.add('login', (email = Cypress.env('testUser').email, password = Cypress.env('testUser').password) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.wait('@login')
})

// Custom command to register a user
Cypress.Commands.add('register', (userData = Cypress.env('testUser')) => {
  cy.visit('/register')
  cy.get('input[name="name"]').type(userData.name)
  cy.get('input[name="email"]').type(userData.email)
  cy.get('input[name="password"]').type(userData.password)
  cy.get('input[name="confirmPassword"]').type(userData.password)
  cy.get('select[name="role"]').select(userData.role)
  
  if (userData.role === 'farmer' && userData.farmName) {
    cy.get('input[name="farmName"]').type(userData.farmName)
  }
  
  cy.get('input[name="terms"]').check()
  cy.get('button[type="submit"]').click()
  cy.wait('@register')
})

// Custom command to add product to cart
Cypress.Commands.add('addToCart', (productIndex = 0) => {
  cy.visit('/products')
  cy.wait('@getProducts')
  cy.get('[data-testid="add-to-cart"]').eq(productIndex).click()
})

// Custom command to search for products
Cypress.Commands.add('searchProducts', (query) => {
  cy.visit('/products')
  cy.get('input[placeholder*="search"]').type(query)
  cy.get('button[type="submit"]').click()
})

// Custom command to filter products by category
Cypress.Commands.add('filterByCategory', (category) => {
  cy.visit('/products')
  cy.get('select').select(category)
})

// Custom command to check if user is logged in
Cypress.Commands.add('isLoggedIn', () => {
  cy.window().its('localStorage').invoke('getItem', 'token').should('exist')
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.window().its('localStorage').invoke('clear')
  cy.visit('/')
})

// Custom command to create a product (for farmers)
Cypress.Commands.add('createProduct', (productData = Cypress.env('testProduct')) => {
  cy.login(Cypress.env('testFarmer').email, Cypress.env('testFarmer').password)
  cy.visit('/dashboard/products/new')
  
  cy.get('input[name="title"]').type(productData.title)
  cy.get('textarea[name="description"]').type(productData.description)
  cy.get('select[name="category"]').select(productData.category)
  cy.get('input[name="pricePerUnit"]').type(productData.price)
  cy.get('input[name="availableQuantity"]').type(productData.quantity)
  cy.get('input[name="unit"]').type(productData.unit)
  
  cy.get('button[type="submit"]').click()
})

// Custom command to place an order
Cypress.Commands.add('placeOrder', () => {
  cy.addToCart()
  cy.visit('/cart')
  cy.get('button').contains('Proceed to Checkout').click()
  
  // Fill shipping details
  cy.get('input[name="address"]').type('123 Test Street')
  cy.get('input[name="city"]').type('Test City')
  cy.get('input[name="postalCode"]').type('12345')
  
  // Select payment method
  cy.get('input[name="paymentMethod"]').check('cod')
  
  cy.get('button[type="submit"]').click()
})

// Custom command to check order status
Cypress.Commands.add('checkOrderStatus', (orderId) => {
  cy.visit(`/orders/${orderId}`)
  cy.get('[data-testid="order-status"]').should('be.visible')
})

// Custom command to upload image
Cypress.Commands.add('uploadImage', (fileName = 'test-image.jpg') => {
  cy.fixture(fileName).then(fileContent => {
    cy.get('input[type="file"]').attachFile({
      fileContent: fileContent.toString(),
      fileName: fileName,
      mimeType: 'image/jpeg'
    })
  })
})

// Custom command to test responsive design
Cypress.Commands.add('testResponsive', () => {
  const viewports = [
    { width: 375, height: 667, device: 'mobile' },
    { width: 768, height: 1024, device: 'tablet' },
    { width: 1280, height: 720, device: 'desktop' }
  ]
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height)
    cy.log(`Testing on ${viewport.device} (${viewport.width}x${viewport.height})`)
  })
})

// Custom command to test accessibility
Cypress.Commands.add('testAccessibility', () => {
  cy.injectAxe()
  cy.checkA11y()
})

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.get('[data-testid="loading"]').should('not.exist')
})

// Custom command to test form validation
Cypress.Commands.add('testFormValidation', (formSelector, invalidData) => {
  cy.get(formSelector).within(() => {
    Object.entries(invalidData).forEach(([field, value]) => {
      cy.get(`[name="${field}"]`).clear().type(value)
    })
    
    cy.get('button[type="submit"]').click()
    
    // Check for validation errors
    cy.get('[data-testid="error-message"]').should('be.visible')
  })
})

// Override existing commands
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // Add custom logic before visiting
  cy.log(`Visiting: ${url}`)
  
  return originalFn(url, options)
})
