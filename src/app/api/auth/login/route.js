import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { comparePassword, generateTokens } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check if user is verified (for farmers)
    if (user.role === 'farmer' && !user.isVerified) {
      return NextResponse.json(
        { error: 'Your account is pending verification. Please contact support.' },
        { status: 403 }
      );
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    // Return user data (without password) and tokens
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
