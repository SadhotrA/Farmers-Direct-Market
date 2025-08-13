const {
  JWT_SECRET,
  generateTokens,
  verifyToken,
  hashUserPassword,
  compareUserPassword
} = require('../../lib/auth')
const { validationSchemas, sanitizeInput, validate } = require('../../lib/validation')

describe('Security Utilities', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashUserPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20)
    })

    test('should compare password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashUserPassword(password)
      
      const isValid = await compareUserPassword(password, hash)
      const isInvalid = await compareUserPassword('WrongPassword', hash)
      
      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })

    test('should handle empty password', async () => {
      const password = ''
      const hash = await hashUserPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
    })
  })

  describe('Input Sanitization', () => {
    test('should sanitize string inputs', () => {
      const input = {
        name: '  John  ',
        nested: { value: '  data ' }
      }
      const result = sanitizeInput(input)
      expect(result.name).toBe('John')
      expect(result.nested.value).toBe('data')
    })

    test('should handle nested objects', () => {
      const input = { user: { name: '  Jane  ' }, tags: [' a ', 'b '] }
      const result = sanitizeInput(input)
      expect(result.user.name).toBe('Jane')
      expect(result.tags).toEqual(['a', 'b'])
    })

    test('should handle null and undefined values', () => {
      const input = { name: null, email: undefined, age: 25 }
      const result = sanitizeInput(input)
      expect(result.name).toBeNull()
      expect(result.email).toBeUndefined()
      expect(result.age).toBe(25)
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

    // Product validation schema is not defined in current codebase; skipping
  })

  // Skipping rate limiter tests (not implemented)

  // Skipping error handler tests; routes handle error responses directly

  describe('JWT utilities', () => {
    test('generates and verifies tokens', () => {
      const { accessToken } = generateTokens('user-id', 'buyer')
      const decoded = verifyToken(accessToken)
      expect(decoded.userId).toBe('user-id')
      expect(decoded.role).toBe('buyer')
    })
  })
})
