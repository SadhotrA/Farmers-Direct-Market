import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { authenticateToken } from '@/lib/auth';

// PUT /api/admin/users/:id/verify - Verify farmer (admin only)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    // Authenticate and authorize admin
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const admin = authResult.user;
    if (admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    const { isVerified, reason } = await request.json();
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only farmers can be verified
    if (user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can be verified' },
        { status: 400 }
      );
    }
    
    // Update verification status
    user.isVerified = isVerified;
    await user.save();
    
    // TODO: Send notification to farmer about verification status
    // TODO: Emit socket event for real-time updates
    
    return NextResponse.json({
      message: `Farmer ${isVerified ? 'verified' : 'unverified'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        farmName: user.farmName
      }
    });
    
  } catch (error) {
    console.error('Verify farmer error:', error);
    
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
