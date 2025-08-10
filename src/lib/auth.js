const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('./security');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate JWT tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token
const verifyToken = (token, secret = JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Refresh JWT token
const refreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    return generateTokens(decoded.userId, decoded.role);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Password hashing (using bcrypt from security.js)
const hashUserPassword = async (password) => {
  return await hashPassword(password);
};

// Password comparison (using bcrypt from security.js)
const compareUserPassword = async (password, hash) => {
  return await comparePassword(password, hash);
};

// Authentication middleware for Next.js API routes
const authenticateToken = async (request) => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new Error('Access token required');
  }

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return async (request) => {
    const user = await authenticateToken(request);
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Insufficient permissions');
    }
    
    return user;
  };
};

// Optional authentication middleware (doesn't throw error if no token)
const optionalAuth = async (request) => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Admin authorization middleware
const authorizeAdmin = async (request) => {
  return await authorizeRoles('admin')(request);
};

// Farmer authorization middleware
const authorizeFarmer = async (request) => {
  return await authorizeRoles('farmer', 'admin')(request);
};

// Buyer authorization middleware
const authorizeBuyer = async (request) => {
  return await authorizeRoles('buyer', 'admin')(request);
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Verify password reset token
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired password reset token');
  }
};

// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'email-verification' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify email verification token
const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'email-verification') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired email verification token');
  }
};

// Security utilities
const generateSecureRandomString = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

const generateAPIKey = () => {
  return `fd_${generateSecureRandomString(24)}`;
};

// Rate limiting helpers
const getRateLimitKey = (request) => {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
};

// Session management
const createSession = (userId, role) => {
  const sessionId = generateSecureRandomString();
  const session = {
    id: sessionId,
    userId,
    role,
    createdAt: new Date(),
    lastActivity: new Date()
  };
  
  return session;
};

const validateSession = (session) => {
  const now = new Date();
  const sessionAge = now - new Date(session.createdAt);
  const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (sessionAge > maxSessionAge) {
    return false;
  }
  
  // Update last activity
  session.lastActivity = now;
  return true;
};

module.exports = {
  generateTokens,
  verifyToken,
  refreshToken,
  hashUserPassword,
  compareUserPassword,
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  authorizeAdmin,
  authorizeFarmer,
  authorizeBuyer,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generateSecureRandomString,
  generateAPIKey,
  getRateLimitKey,
  createSession,
  validateSession,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
