import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;
    
    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    return NextResponse.json({
      user: userResponse
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request) {
  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;
    const body = await request.json();
    const { name, phone, address, farmName, location, profileImage } = body;
    
    // Update allowed fields
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (profileImage) updateData.profileImage = profileImage;
    
    // Farm name only for farmers
    if (user.role === 'farmer' && farmName) {
      updateData.farmName = farmName;
    }
    
    // Location update
    if (location && location.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    
    // Update user
    const updatedUser = await user.constructor.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user profile error:', error);
    
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
