import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Order } from '@/models';
import { authenticateToken } from '@/lib/auth';

// GET /api/orders/:id - Get order details
export async function GET(request, { params }) {
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
    const { id } = params;
    
    const order = await Order.findById(id)
      .populate([
        { path: 'buyer', select: 'name email phone' },
        { path: 'farmer', select: 'name farmName phone' },
        { path: 'items.product', select: 'title images category' },
        { path: 'history.updatedBy', select: 'name' }
      ])
      .lean();
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this order
    const isBuyer = order.buyer._id.toString() === user._id.toString();
    const isFarmer = order.farmer._id.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isBuyer && !isFarmer && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ order });
    
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/:id/status - Update order status
export async function PUT(request, { params }) {
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
    const { id } = params;
    const { status, note } = await request.json();
    
    // Validation
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const validStatuses = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check permissions
    const isFarmer = order.farmer.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isFarmer && !isAdmin) {
      return NextResponse.json(
        { error: 'Only farmers and admins can update order status' },
        { status: 403 }
      );
    }
    
    // Status transition validation
    const currentStatus = order.status;
    const validTransitions = {
      'PLACED': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PACKED', 'CANCELLED'],
      'PACKED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [],
      'CANCELLED': []
    };
    
    if (!validTransitions[currentStatus].includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }
    
    // Update order status
    await order.updateStatus(status, note, user._id);
    
    // Populate order details
    await order.populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'farmer', select: 'name farmName phone' },
      { path: 'items.product', select: 'title images category' },
      { path: 'history.updatedBy', select: 'name' }
    ]);
    
    // Emit real-time order update to participants
    const socketManager = require('@/lib/socket');
    socketManager.emitToOrder(id, 'order:update', {
      orderId: id,
      status,
      note,
      updatedBy: {
        _id: user._id,
        name: user.name,
        role: user.role
      },
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      order
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    
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
