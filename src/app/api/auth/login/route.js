import { NextResponse } from 'next/server';
import { User } from '../../../../models';
import { generateTokens, compareUserPassword } from '../../../../lib/auth';
import { validationSchemas, sanitizeInput } from '../../../../lib/validation';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Apply input sanitization
    const sanitizedBody = sanitizeInput(body);
    
    // Validate input using Joi schema
    const { error, value } = validationSchemas.userLogin.validate(sanitizedBody, {
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

    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json({
        success: false,
        message: 'Account not verified. Please contact support for verification.'
      }, { status: 403 });
    }

    // Compare password
    const isPasswordValid = await compareUserPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Update last login
    user.lastLogin = new Date();
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
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
