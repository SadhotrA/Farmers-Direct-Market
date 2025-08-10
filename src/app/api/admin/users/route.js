import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { authenticateToken, authorizeRoles } from '@/lib/auth';

// GET /api/admin/users - List users (admin only)
export async function GET(request) {
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
    
    const user = authResult.user;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isVerified = searchParams.get('isVerified');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build query
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isVerified !== null && isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { farmName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-passwordHash')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get statistics
    const stats = await User.aggregate([
      { $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalFarmers: { $sum: { $cond: [{ $eq: ['$role', 'farmer'] }, 1, 0] } },
        totalBuyers: { $sum: { $cond: [{ $eq: ['$role', 'buyer'] }, 1, 0] } },
        verifiedFarmers: { $sum: { $cond: [{ $and: [{ $eq: ['$role', 'farmer'] }, { $eq: ['$isVerified', true] }] }, 1, 0] } },
        pendingFarmers: { $sum: { $cond: [{ $and: [{ $eq: ['$role', 'farmer'] }, { $eq: ['$isVerified', false] }] }, 1, 0] } }
      }}
    ]);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalUsers: 0,
        totalFarmers: 0,
        totalBuyers: 0,
        verifiedFarmers: 0,
        pendingFarmers: 0
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
