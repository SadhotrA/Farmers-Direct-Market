const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Generate JWT tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Authentication middleware for Next.js API routes
const authenticateToken = async (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return { error: 'Access token required', status: 401 };
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return { error: 'Invalid or expired token', status: 403 };
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return { error: 'User not found', status: 403 };
    }
    
    return { user };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (user) => {
    if (!user) {
      return { error: 'Authentication required', status: 401 };
    }
    
    if (!roles.includes(user.role)) {
      return { error: 'Insufficient permissions', status: 403 };
    }
    
    return null; // No error
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (user) {
          return { user };
        }
      }
    }
    
    return { user: null };
  } catch (error) {
    return { user: null }; // Continue without authentication
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
