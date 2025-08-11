describe('Complete User Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('User Registration and Login', () => {
    it('should register a new buyer account', () => {
      const userData = {
        name: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'TestPass123!',
        role: 'buyer'
      }

      cy.register(userData)
      cy.url().should('include', '/login')
      cy.get('[data-testid="success-message"]').should('contain', 'Registration successful')
    })

    it('should register a new farmer account', () => {
      const farmerData = {
        name: 'Test Farmer',
        email: 'farmer@test.com',
        password: 'TestPass123!',
        role: 'farmer',
        farmName: 'Test Farm'
      }

      cy.register(farmerData)
      cy.url().should('include', '/login')
      cy.get('[data-testid="success-message"]').should('contain', 'Registration successful')
    })

    it('should login successfully', () => {
      cy.login()
      cy.isLoggedIn()
      cy.url().should('not.include', '/login')
    })

    it('should show validation errors for invalid login', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('invalid-email')
      cy.get('input[name="password"]').type('weak')
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="error-message"]').should('be.visible')
    })
  })

  describe('Product Search and Browsing', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should search for products', () => {
      cy.searchProducts('tomato')
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
      cy.get('[data-testid="product-card"]').first().should('contain', 'tomato')
    })

    it('should filter products by category', () => {
      cy.filterByCategory('vegetables')
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
    })

    it('should display product details', () => {
      cy.visit('/products')
      cy.get('[data-testid="product-card"]').first().click()
      cy.get('[data-testid="product-title"]').should('be.visible')
      cy.get('[data-testid="product-price"]').should('be.visible')
      cy.get('[data-testid="product-description"]').should('be.visible')
    })

    it('should show no results for invalid search', () => {
      cy.searchProducts('nonexistentproduct12345')
      cy.get('[data-testid="no-results"]').should('be.visible')
    })
  })

  describe('Shopping Cart', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should add product to cart', () => {
      cy.addToCart()
      cy.get('[data-testid="cart-count"]').should('contain', '1')
      cy.get('[data-testid="success-message"]').should('contain', 'Added to cart')
    })

    it('should update product quantity in cart', () => {
      cy.addToCart()
      cy.visit('/cart')
      cy.get('[data-testid="quantity-increase"]').first().click()
      cy.get('[data-testid="quantity-value"]').first().should('contain', '2')
    })

    it('should remove product from cart', () => {
      cy.addToCart()
      cy.visit('/cart')
      cy.get('[data-testid="remove-item"]').first().click()
      cy.get('[data-testid="empty-cart"]').should('be.visible')
    })

    it('should calculate total correctly', () => {
      cy.addToCart()
      cy.visit('/cart')
      cy.get('[data-testid="cart-total"]').should('be.visible')
      cy.get('[data-testid="subtotal"]').should('be.visible')
      cy.get('[data-testid="delivery-fee"]').should('be.visible')
    })
  })

  describe('Order Placement', () => {
    beforeEach(() => {
      cy.login()
      cy.addToCart()
    })

    it('should place order successfully', () => {
      cy.placeOrder()
      cy.get('[data-testid="order-confirmation"]').should('be.visible')
      cy.get('[data-testid="order-number"]').should('be.visible')
    })

    it('should validate shipping address', () => {
      cy.visit('/cart')
      cy.get('button').contains('Proceed to Checkout').click()
      
      // Try to submit without address
      cy.get('button[type="submit"]').click()
      cy.get('[data-testid="error-message"]').should('contain', 'Address is required')
    })

    it('should select payment method', () => {
      cy.visit('/cart')
      cy.get('button').contains('Proceed to Checkout').click()
      
      // Fill shipping details
      cy.get('input[name="address"]').type('123 Test Street')
      cy.get('input[name="city"]').type('Test City')
      cy.get('input[name="postalCode"]').type('12345')
      
      // Select COD payment
      cy.get('input[name="paymentMethod"][value="cod"]').check()
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="order-confirmation"]').should('be.visible')
    })
  })

  describe('Order Status Updates', () => {
    beforeEach(() => {
      cy.login()
      cy.placeOrder()
    })

    it('should display order status', () => {
      cy.get('[data-testid="order-number"]').then(($orderNumber) => {
        const orderId = $orderNumber.text()
        cy.checkOrderStatus(orderId)
        cy.get('[data-testid="order-status"]').should('contain', 'PLACED')
      })
    })

    it('should show order history', () => {
      cy.get('[data-testid="order-number"]').then(($orderNumber) => {
        const orderId = $orderNumber.text()
        cy.visit(`/orders/${orderId}`)
        cy.get('[data-testid="order-history"]').should('be.visible')
        cy.get('[data-testid="order-timeline"]').should('be.visible')
      })
    })

    it('should update order status (farmer perspective)', () => {
      // Login as farmer
      cy.logout()
      cy.login(Cypress.env('testFarmer').email, Cypress.env('testFarmer').password)
      
      cy.visit('/dashboard/orders')
      cy.get('[data-testid="order-item"]').first().click()
      cy.get('[data-testid="update-status"]').click()
      cy.get('select[name="status"]').select('CONFIRMED')
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="order-status"]').should('contain', 'CONFIRMED')
    })
  })

  describe('Farmer Dashboard', () => {
    beforeEach(() => {
      cy.login(Cypress.env('testFarmer').email, Cypress.env('testFarmer').password)
    })

    it('should create a new product', () => {
      cy.createProduct()
      cy.get('[data-testid="success-message"]').should('contain', 'Product created successfully')
    })

    it('should upload product images', () => {
      cy.visit('/dashboard/products/new')
      cy.get('input[name="title"]').type('Test Product with Image')
      cy.get('textarea[name="description"]').type('Test description')
      cy.get('select[name="category"]').select('vegetables')
      cy.get('input[name="pricePerUnit"]').type('10.50')
      cy.get('input[name="availableQuantity"]').type('100')
      cy.get('input[name="unit"]').type('kg')
      
      // Upload image
      cy.uploadImage('test-product.jpg')
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Product created successfully')
    })

    it('should manage inventory', () => {
      cy.visit('/dashboard/products')
      cy.get('[data-testid="product-item"]').first().click()
      cy.get('[data-testid="edit-quantity"]').clear().type('50')
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Product updated successfully')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero stock products', () => {
      cy.login()
      cy.visit('/products')
      
      // Find a product with zero stock
      cy.get('[data-testid="product-card"]').each(($card) => {
        cy.wrap($card).within(() => {
          cy.get('[data-testid="stock-quantity"]').then(($stock) => {
            if ($stock.text().includes('0')) {
              cy.get('[data-testid="add-to-cart"]').should('be.disabled')
              cy.get('[data-testid="out-of-stock"]').should('be.visible')
            }
          })
        })
      })
    })

    it('should handle image upload failures', () => {
      cy.login(Cypress.env('testFarmer').email, Cypress.env('testFarmer').password)
      cy.visit('/dashboard/products/new')
      
      // Try to upload invalid file
      cy.get('input[type="file"]').attachFile({
        fileContent: 'invalid content',
        fileName: 'test.txt',
        mimeType: 'text/plain'
      })
      
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid file type')
    })

    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/products*', { forceNetworkError: true }).as('networkError')
      
      cy.login()
      cy.visit('/products')
      
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load products')
    })
  })

  describe('Role-based Access Control', () => {
    it('should restrict buyer access to farmer dashboard', () => {
      cy.login() // Login as buyer
      cy.visit('/dashboard/products')
      cy.url().should('include', '/unauthorized')
    })

    it('should restrict farmer access to buyer features', () => {
      cy.login(Cypress.env('testFarmer').email, Cypress.env('testFarmer').password)
      cy.visit('/buyer-dashboard')
      cy.url().should('include', '/unauthorized')
    })

    it('should allow admin access to all features', () => {
      // This would require admin credentials
      cy.login('admin@test.com', 'AdminPass123!')
      cy.visit('/admin/dashboard')
      cy.get('[data-testid="admin-panel"]').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport(375, 667)
      cy.visit('/')
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
      
      cy.visit('/products')
      cy.get('[data-testid="product-card"]').should('be.visible')
    })

    it('should work on tablet devices', () => {
      cy.viewport(768, 1024)
      cy.visit('/')
      cy.get('[data-testid="tablet-layout"]').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', () => {
      cy.visit('/')
      cy.testAccessibility()
      
      cy.visit('/products')
      cy.testAccessibility()
      
      cy.visit('/login')
      cy.testAccessibility()
    })

    it('should support keyboard navigation', () => {
      cy.visit('/')
      cy.get('body').tab()
      cy.focused().should('be.visible')
    })
  })
})
