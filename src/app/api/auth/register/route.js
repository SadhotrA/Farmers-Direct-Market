import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { hashPassword, generateTokens } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email, password, role, phone, address, farmName, location } = body;
    
    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }
    
    if (!['farmer', 'buyer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be farmer, buyer, or admin' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone,
      address,
      isVerified: role === 'buyer' ? true : false // Farmers need verification
    };
    
    // Add farm name for farmers
    if (role === 'farmer' && farmName) {
      userData.farmName = farmName;
    }
    
    // Add location if provided
    if (location && location.coordinates) {
      userData.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    
    const user = new User(userData);
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    // Return user data (without password) and tokens
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    return NextResponse.json({
      message: 'User registered successfully',
      user: userResponse,
      accessToken,
      refreshToken
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
