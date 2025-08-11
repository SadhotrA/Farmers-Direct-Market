import { NextResponse } from 'next/server';
import { User } from '../../../../models';
import { generateTokens, hashUserPassword } from '../../../../lib/auth';
import { validationSchemas, sanitizeInput } from '../../../../lib/validation';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Apply input sanitization
    const sanitizedBody = sanitizeInput(body);
    
    // Validate input using Joi schema
    const { error, value } = validationSchemas.userRegistration.validate(sanitizedBody, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors
      }, { status: 400 });
    }

    const { name, email, password, role, phone, address, farmName } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashUserPassword(password);

    // Create user object
    const userData = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone || undefined,
      address: address || undefined,
      farmName: role === 'farmer' ? farmName : undefined,
      isVerified: role === 'buyer', // Buyers are auto-verified, farmers need verification
      createdAt: new Date()
    };

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Return success response (without password hash)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      farmName: user.farmName,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({
        success: false,
        message: `${field} already exists`
      }, { status: 409 });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      
      return NextResponse.json({
        success: false,
        message: 'Validation Error',
        errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
