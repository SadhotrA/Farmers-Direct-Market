const request = require('supertest')
const { createServer } = require('http')
const next = require('next')

// Mock the database connection
jest.mock('../../../../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}))

// Mock the User model
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  role: 'buyer',
  isVerified: true,
  createdAt: new Date()
}

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn()
}

jest.mock('../../../../models', () => ({
  User: mockUserModel
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token')
}))

describe('Auth API Endpoints', () => {
  let app
  let server

  beforeAll(async () => {
    // Create Next.js app
    const dev = process.env.NODE_ENV !== 'production'
    const hostname = 'localhost'
    const port = 3001

    app = next({ dev, hostname, port })
    await app.prepare()
    
    // Create HTTP server
    server = createServer(async (req, res) => {
      try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
        await app.getRequestHandler()(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })
  })

  afterAll(async () => {
    server.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        role: 'buyer',
        phone: '+1234567890',
        address: '123 Main St'
      }

      mockUserModel.findOne.mockResolvedValue(null) // User doesn't exist
      mockUserModel.create.mockResolvedValue({
        ...mockUser,
        ...userData,
        passwordHash: 'hashedPassword'
      })

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.tokens).toBeDefined()
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
      expect(mockUserModel.create).toHaveBeenCalled()
    })

    test('should reject registration with existing email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        role: 'buyer'
      }

      mockUserModel.findOne.mockResolvedValue(mockUser) // User exists

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User with this email already exists')
    })

    test('should reject registration with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        role: 'buyer'
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })

    test('should reject registration with mismatched passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        role: 'buyer'
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })

    test('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        role: 'buyer'
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })

    test('should reject registration with invalid role', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        role: 'invalid-role'
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })

    test('should register farmer with farm name', async () => {
      const userData = {
        name: 'Farmer John',
        email: 'farmer@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        role: 'farmer',
        farmName: 'Green Valley Farm'
      }

      mockUserModel.findOne.mockResolvedValue(null)
      mockUserModel.create.mockResolvedValue({
        ...mockUser,
        ...userData,
        role: 'farmer',
        farmName: 'Green Valley Farm',
        passwordHash: 'hashedPassword'
      })

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.role).toBe('farmer')
      expect(response.body.data.user.farmName).toBe('Green Valley Farm')
    })
  })

  describe('POST /api/auth/login', () => {
    test('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }

      const bcrypt = require('bcryptjs')
      bcrypt.compare.mockResolvedValue(true)

      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashedPassword',
        lastLogin: new Date()
      })

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.tokens).toBeDefined()
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    test('should reject login with non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      }

      mockUserModel.findOne.mockResolvedValue(null)

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    test('should reject login with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const bcrypt = require('bcryptjs')
      bcrypt.compare.mockResolvedValue(false)

      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashedPassword'
      })

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    test('should reject login for unverified user', async () => {
      const loginData = {
        email: 'unverified@example.com',
        password: 'SecurePass123!'
      }

      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        email: 'unverified@example.com',
        isVerified: false,
        passwordHash: 'hashedPassword'
      })

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Account not verified. Please contact support for verification.')
    })

    test('should reject login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'SecurePass123!'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })

    test('should reject login with missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    test('should enforce rate limiting on auth endpoints', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }

      // Make multiple requests quickly
      const requests = Array(6).fill().map(() =>
        request(server)
          .post('/api/auth/login')
          .send(loginData)
      )

      const responses = await Promise.all(requests)
      const lastResponse = responses[responses.length - 1]

      // The last request should be rate limited
      expect(lastResponse.status).toBe(429)
      expect(lastResponse.body.success).toBe(false)
      expect(lastResponse.body.message).toContain('Too many authentication attempts')
    })
  })

  describe('Input Sanitization', () => {
    test('should sanitize malicious input', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        role: 'buyer'
      }

      mockUserModel.findOne.mockResolvedValue(null)
      mockUserModel.create.mockResolvedValue({
        ...mockUser,
        ...maliciousData,
        passwordHash: 'hashedPassword'
      })

      const response = await request(server)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201)

      // The name should be sanitized in the database
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'scriptalert("xss")/script'
        })
      )
    })
  })
})
