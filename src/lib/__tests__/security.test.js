const {
  hashPassword,
  comparePassword,
  validationSchemas,
  sanitizeInput,
  validate,
  rateLimiters,
  errorHandler
} = require('../security')

describe('Security Utilities', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20)
    })

    test('should compare password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(password, hash)
      const isInvalid = await comparePassword('WrongPassword', hash)
      
      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })

    test('should handle empty password', async () => {
      const password = ''
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
    })
  })

  describe('Input Sanitization', () => {
    test('should sanitize string inputs', () => {
      const req = {
        body: {
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          query: { $where: 'malicious' }
        },
        query: { search: '<img src=x onerror=alert(1)>' },
        params: { id: '123' }
      }

      const res = {}
      const next = jest.fn()

      sanitizeInput(req, res, next)

      expect(req.body.name).toBe('scriptalert("xss")/script')
      expect(req.body.email).toBe('test@example.com')
      expect(req.body.query).toBe('wheremalicious')
      expect(req.query.search).toBe('img src=x onerror=alert(1)')
      expect(req.params.id).toBe('123')
      expect(next).toHaveBeenCalled()
    })

    test('should handle nested objects', () => {
      const req = {
        body: {
          user: {
            name: '<script>alert("xss")</script>',
            profile: {
              bio: 'Safe text'
            }
          },
          tags: ['<script>', 'safe', '<img>']
        }
      }

      const res = {}
      const next = jest.fn()

      sanitizeInput(req, res, next)

      expect(req.body.user.name).toBe('scriptalert("xss")/script')
      expect(req.body.user.profile.bio).toBe('Safe text')
      expect(req.body.tags).toEqual(['script', 'safe', 'img'])
      expect(next).toHaveBeenCalled()
    })

    test('should handle null and undefined values', () => {
      const req = {
        body: {
          name: null,
          email: undefined,
          age: 25
        }
      }

      const res = {}
      const next = jest.fn()

      sanitizeInput(req, res, next)

      expect(req.body.name).toBeNull()
      expect(req.body.email).toBeUndefined()
      expect(req.body.age).toBe(25)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('Validation Schemas', () => {
    describe('User Registration', () => {
      test('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          role: 'buyer',
          phone: '+1234567890',
          address: '123 Main St',
          farmName: 'Green Farm'
        }

        const { error } = validationSchemas.userRegistration.validate(validData)
        expect(error).toBeUndefined()
      })

      test('should reject weak password', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
          confirmPassword: 'weak',
          role: 'buyer'
        }

        const { error } = validationSchemas.userRegistration.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('Password must contain')
      })

      test('should reject mismatched passwords', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!',
          role: 'buyer'
        }

        const { error } = validationSchemas.userRegistration.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('Passwords must match')
      })

      test('should reject invalid email', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          role: 'buyer'
        }

        const { error } = validationSchemas.userRegistration.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('email')
      })

      test('should reject invalid role', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          role: 'invalid-role'
        }

        const { error } = validationSchemas.userRegistration.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('role')
      })
    })

    describe('User Login', () => {
      test('should validate correct login data', () => {
        const validData = {
          email: 'john@example.com',
          password: 'SecurePass123!'
        }

        const { error } = validationSchemas.userLogin.validate(validData)
        expect(error).toBeUndefined()
      })

      test('should reject missing email', () => {
        const invalidData = {
          password: 'SecurePass123!'
        }

        const { error } = validationSchemas.userLogin.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('email')
      })

      test('should reject missing password', () => {
        const invalidData = {
          email: 'john@example.com'
        }

        const { error } = validationSchemas.userLogin.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('password')
      })
    })

    describe('Product Validation', () => {
      test('should validate correct product data', () => {
        const validData = {
          title: 'Fresh Tomatoes',
          description: 'Fresh organic tomatoes from our farm',
          category: 'vegetables',
          pricePerUnit: 2.50,
          availableQuantity: 100,
          unit: 'kg',
          harvestDate: '2024-01-15'
        }

        const { error } = validationSchemas.product.validate(validData)
        expect(error).toBeUndefined()
      })

      test('should reject negative price', () => {
        const invalidData = {
          title: 'Fresh Tomatoes',
          description: 'Fresh organic tomatoes',
          category: 'vegetables',
          pricePerUnit: -2.50,
          availableQuantity: 100,
          unit: 'kg'
        }

        const { error } = validationSchemas.product.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('positive')
      })

      test('should reject zero quantity', () => {
        const invalidData = {
          title: 'Fresh Tomatoes',
          description: 'Fresh organic tomatoes',
          category: 'vegetables',
          pricePerUnit: 2.50,
          availableQuantity: 0,
          unit: 'kg'
        }

        const { error } = validationSchemas.product.validate(invalidData)
        expect(error).toBeDefined()
        expect(error.details[0].message).toContain('greater than or equal to 1')
      })
    })
  })

  describe('Rate Limiters', () => {
    test('should have general rate limiter configured', () => {
      expect(rateLimiters.general).toBeDefined()
      expect(rateLimiters.general).toHaveProperty('windowMs')
      expect(rateLimiters.general).toHaveProperty('max')
    })

    test('should have auth rate limiter configured', () => {
      expect(rateLimiters.auth).toBeDefined()
      expect(rateLimiters.auth).toHaveProperty('windowMs')
      expect(rateLimiters.auth).toHaveProperty('max')
      expect(rateLimiters.auth.max).toBeLessThan(rateLimiters.general.max)
    })

    test('should have upload rate limiter configured', () => {
      expect(rateLimiters.upload).toBeDefined()
      expect(rateLimiters.upload).toHaveProperty('windowMs')
      expect(rateLimiters.upload).toHaveProperty('max')
    })

    test('should have search rate limiter configured', () => {
      expect(rateLimiters.search).toBeDefined()
      expect(rateLimiters.search).toHaveProperty('windowMs')
      expect(rateLimiters.search).toHaveProperty('max')
    })
  })

  describe('Error Handler', () => {
    test('should handle validation errors', () => {
      const err = new Error('Validation failed')
      err.name = 'ValidationError'
      err.errors = {
        email: { path: 'email', message: 'Invalid email' },
        password: { path: 'password', message: 'Password required' }
      }

      const req = {}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation Error',
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Password required' }
        ]
      })
    })

    test('should handle JWT errors', () => {
      const err = new Error('Invalid token')
      err.name = 'JsonWebTokenError'

      const req = {}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      })
    })

    test('should handle MongoDB duplicate key errors', () => {
      const err = new Error('Duplicate key')
      err.code = 11000
      err.keyValue = { email: 'test@example.com' }

      const req = {}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'email already exists'
      })
    })

    test('should handle generic errors', () => {
      const err = new Error('Something went wrong')

      const req = {}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong'
      })
    })
  })
})
