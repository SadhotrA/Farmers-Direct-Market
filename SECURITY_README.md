# Security & Best Practices Implementation

This document outlines the comprehensive security measures implemented in the Farmers' Direct Market application.

## 🔐 Security Features Implemented

### 1. Password Security
- **bcrypt Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
- **Strong Password Policy**: Passwords must contain:
  - At least 8 characters
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character (@$!%*?&)
- **Secure Comparison**: Password comparison uses timing-safe bcrypt.compare()

### 2. Input Validation & Sanitization
- **Joi Schema Validation**: Comprehensive validation for all API endpoints
- **Input Sanitization**: Prevents NoSQL injection and XSS attacks
- **Type Checking**: Validates data types and formats
- **Length Limits**: Prevents buffer overflow attacks

### 3. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **File Uploads**: 10 uploads per hour per IP
- **Search**: 30 searches per minute per IP

### 4. Security Headers (Helmet)
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Additional XSS protection
- **Strict-Transport-Security**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information

### 5. CORS Configuration
- **Origin Validation**: Only allows specified origins
- **Credentials Support**: Secure cookie handling
- **Method Restrictions**: Limits HTTP methods
- **Header Restrictions**: Controls allowed headers

### 6. JWT Security
- **Short-lived Access Tokens**: 15 minutes expiration
- **Refresh Tokens**: 7 days expiration with rotation
- **Secure Secret Keys**: Environment-based secrets
- **Token Validation**: Comprehensive token verification

### 7. Error Handling
- **Generic Error Messages**: Prevents information leakage
- **Structured Error Responses**: Consistent error format
- **Logging**: Secure error logging without sensitive data
- **Graceful Degradation**: Handles errors gracefully

## 🛡️ Security Middleware

### Authentication Middleware
```javascript
// Protects routes requiring authentication
const authenticateToken = async (request) => {
  // Validates JWT tokens
  // Returns user data or throws error
};

// Role-based authorization
const authorizeRoles = (...allowedRoles) => {
  // Checks user roles
  // Returns user or throws error
};
```

### Input Validation Middleware
```javascript
// Validates request data using Joi schemas
const validate = (schema) => {
  // Validates and sanitizes input
  // Returns validated data or error
};

// Sanitizes input to prevent injection attacks
const sanitizeInput = (req, res, next) => {
  // Removes dangerous characters
  // Sanitizes MongoDB operators
};
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
UPLOAD_RATE_LIMIT_MAX_REQUESTS=10
SEARCH_RATE_LIMIT_MAX_REQUESTS=30

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farmerdm

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📋 Validation Schemas

### User Registration
```javascript
{
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  confirmPassword: Joi.string().valid(Joi.ref('password')),
  role: Joi.string().valid('farmer', 'buyer', 'admin'),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
  address: Joi.string().max(500),
  farmName: Joi.string().max(100)
}
```

### User Login
```javascript
{
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().required()
}
```

### Product Creation
```javascript
{
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  category: Joi.string().valid('vegetables', 'fruits', 'grains', 'dairy', 'meat', 'herbs'),
  pricePerUnit: Joi.number().positive().required(),
  availableQuantity: Joi.number().integer().min(1).required(),
  unit: Joi.string().min(1).max(20).required(),
  harvestDate: Joi.date().iso()
}
```

## 🚀 Security Best Practices

### 1. Production Deployment
- **HTTPS Only**: Use SSL/TLS certificates
- **Environment Variables**: Never commit secrets to version control
- **Regular Updates**: Keep dependencies updated
- **Security Headers**: Enable all security headers
- **Logging**: Implement secure logging
- **Monitoring**: Set up security monitoring

### 2. Database Security
- **Connection String**: Use environment variables
- **Indexes**: Proper database indexing
- **Validation**: Schema-level validation
- **Backup**: Regular database backups
- **Access Control**: Limit database access

### 3. API Security
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Validate all inputs
- **Output Sanitization**: Sanitize all outputs
- **Error Handling**: Generic error messages
- **CORS**: Proper CORS configuration

### 4. Authentication Security
- **Password Hashing**: Use bcrypt
- **Token Management**: Short-lived tokens
- **Session Management**: Secure sessions
- **Multi-factor Authentication**: Consider MFA
- **Account Lockout**: Implement lockout policies

## 🔍 Security Testing

### Manual Testing
1. **Input Validation**: Test with malicious inputs
2. **Authentication**: Test token validation
3. **Authorization**: Test role-based access
4. **Rate Limiting**: Test rate limit enforcement
5. **CORS**: Test cross-origin requests

### Automated Testing
```javascript
// Example security test
describe('Security Tests', () => {
  test('should reject invalid JWT tokens', async () => {
    const response = await request(app)
      .get('/api/protected-route')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });

  test('should enforce rate limiting', async () => {
    const requests = Array(6).fill().map(() => 
      request(app).post('/api/auth/login')
    );
    
    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    
    expect(lastResponse.status).toBe(429);
  });
});
```

## 📊 Security Monitoring

### Logging
- **Request Logging**: Log all API requests
- **Error Logging**: Log security errors
- **Access Logging**: Log authentication attempts
- **Rate Limit Logging**: Log rate limit violations

### Monitoring
- **Failed Login Attempts**: Monitor for brute force attacks
- **Rate Limit Violations**: Monitor for abuse
- **Error Rates**: Monitor for security issues
- **Performance**: Monitor for DoS attacks

## 🚨 Incident Response

### Security Incidents
1. **Immediate Response**: Isolate affected systems
2. **Investigation**: Analyze logs and evidence
3. **Containment**: Prevent further damage
4. **Recovery**: Restore normal operations
5. **Post-Incident**: Review and improve security

### Contact Information
- **Security Team**: security@farmerdm.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Bug Reports**: security-bugs@farmerdm.com

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practices-security.html)
- [JWT Security](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## 🔄 Security Updates

This security implementation is regularly updated to address new threats and vulnerabilities. Always keep dependencies updated and monitor security advisories.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Security Level**: Production Ready
