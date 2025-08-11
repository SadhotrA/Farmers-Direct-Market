import Joi from 'joi';

// Basic input sanitization
export const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim();
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

// Validation schemas
export const validationSchemas = {
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
  }),

  userRegistration: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('farmer', 'buyer').required().messages({
      'any.only': 'Role must be either farmer or buyer',
      'any.required': 'Role is required'
    }),
    phone: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
    farmName: Joi.string().when('role', {
      is: 'farmer',
      then: Joi.required().messages({
        'any.required': 'Farm name is required for farmers'
      }),
      otherwise: Joi.optional()
    })
  })
};

// Basic validation function
export const validate = (schema, data) => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};