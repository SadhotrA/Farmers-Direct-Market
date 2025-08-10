import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Order, Product, User } from '@/models';
import { authenticateToken } from '@/lib/auth';

// POST /api/orders - Place an order
export async function POST(request) {
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
    
    const buyer = authResult.user;
    if (buyer.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can place orders' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      items, // Array of { productId, quantity }
      deliveryAddress,
      deliveryInstructions,
      paymentMethod,
      expectedDeliveryDate
    } = body;
    
    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    
    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }
    
    // Process order items
    const orderItems = [];
    let subtotal = 0;
    let farmerId = null;
    
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        );
      }
      
      // Get product
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} not found` },
          { status: 404 }
        );
      }
      
      if (!product.isAvailable) {
        return NextResponse.json(
          { error: `Product ${product.title} is not available` },
          { status: 400 }
        );
      }
      
      if (product.availableQuantity < quantity) {
        return NextResponse.json(
          { error: `Insufficient quantity for ${product.title}` },
          { status: 400 }
        );
      }
      
      // Check minimum/maximum order quantity
      if (quantity < product.minOrderQuantity) {
        return NextResponse.json(
          { error: `Minimum order quantity for ${product.title} is ${product.minOrderQuantity} ${product.unit}` },
          { status: 400 }
        );
      }
      
      if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
        return NextResponse.json(
          { error: `Maximum order quantity for ${product.title} is ${product.maxOrderQuantity} ${product.unit}` },
          { status: 400 }
        );
      }
      
      // Set farmer ID (all items should be from same farmer)
      if (!farmerId) {
        farmerId = product.farmer;
      } else if (farmerId.toString() !== product.farmer.toString()) {
        return NextResponse.json(
          { error: 'All items must be from the same farmer' },
          { status: 400 }
        );
      }
      
      // Calculate item total
      const itemTotal = product.pricePerUnit * quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        product: productId,
        quantity,
        price: product.pricePerUnit,
        unit: product.unit
      });
    }
    
    // Get farmer
    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return NextResponse.json(
        { error: 'Farmer not found' },
        { status: 404 }
      );
    }
    
    // Calculate totals
    const deliveryFee = 0; // TODO: Implement delivery fee calculation
    const tax = 0; // TODO: Implement tax calculation
    const total = subtotal + deliveryFee + tax;
    
    // Create order
    const orderData = {
      buyer: buyer._id,
      farmer: farmerId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      deliveryInstructions,
      paymentMethod: paymentMethod || 'COD',
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null
    };
    
    const order = new Order(orderData);
    await order.save();
    
    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { availableQuantity: -item.quantity } }
      );
    }
    
    // Populate order details
    await order.populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'farmer', select: 'name farmName phone' },
      { path: 'items.product', select: 'title images' }
    ]);
    
    return NextResponse.json({
      message: 'Order placed successfully',
      order
    }, { status: 201 });
    
  } catch (error) {
    console.error('Place order error:', error);
    
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

// GET /api/orders - Get user orders
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    // Build query based on user role
    const query = {};
    if (user.role === 'buyer') {
      query.buyer = user._id;
    } else if (user.role === 'farmer') {
      query.farmer = user._id;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate([
        { path: 'buyer', select: 'name email phone' },
        { path: 'farmer', select: 'name farmName phone' },
        { path: 'items.product', select: 'title images' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
