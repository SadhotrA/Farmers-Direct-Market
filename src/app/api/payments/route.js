import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, authorizeRoles } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import { Payment, Order } from '../../../models';
import { 
  handleCODPayment, 
  handleBankTransferPayment, 
  getPaymentStats 
} from '../../../lib/payment';

export async function POST(request) {
  try {
    await connectDB();
    
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { user } = authResult;
    
    // Only buyers can create payments
    if (user.role !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can create payments' }, { status: 403 });
    }
    
    const body = await request.json();
    const { orderId, paymentMethod, transferDetails } = body;
    
    if (!orderId || !paymentMethod) {
      return NextResponse.json({ error: 'Order ID and payment method are required' }, { status: 400 });
    }
    
    // Validate payment method
    const validMethods = ['COD', 'BANK_TRANSFER', 'STRIPE', 'RAZORPAY', 'PAYPAL'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    
    // Get order details
    const order = await Order.findById(orderId).populate('farmer');
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Verify order belongs to the buyer
    if (order.buyer.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Order does not belong to you' }, { status: 403 });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already exists for this order' }, { status: 400 });
    }
    
    let payment;
    
    // Handle different payment methods
    switch (paymentMethod) {
      case 'COD':
        payment = await handleCODPayment(orderId, user._id, order.farmer._id, order.total);
        break;
        
      case 'BANK_TRANSFER':
        if (!transferDetails) {
          return NextResponse.json({ error: 'Transfer details required for bank transfer' }, { status: 400 });
        }
        payment = await handleBankTransferPayment(orderId, user._id, order.farmer._id, order.total, transferDetails);
        break;
        
      case 'STRIPE':
      case 'RAZORPAY':
      case 'PAYPAL':
        // For online payments, create pending payment record
        // Actual payment processing will be handled by webhooks
        payment = await handleBankTransferPayment(orderId, user._id, order.farmer._id, order.total, {
          gateway: paymentMethod,
          status: 'pending'
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id,
        orderId: payment.order,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        commission: payment.commission,
        farmerPayout: payment.farmerPayout,
        createdAt: payment.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    
    // Build query based on user role
    let query = {};
    if (user.role === 'farmer') {
      query.farmer = user._id;
    } else if (user.role === 'buyer') {
      query.buyer = user._id;
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .populate('order', 'total status')
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Payment.countDocuments(query);
    
    // Get payment statistics
    const stats = await getPaymentStats(user._id, user.role);
    
    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment._id,
        orderId: payment.order._id,
        orderTotal: payment.order.total,
        orderStatus: payment.order.status,
        buyer: payment.buyer,
        farmer: payment.farmer,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        commission: payment.commission,
        farmerPayout: payment.farmerPayout,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
    
  } catch (error) {
    console.error('Payment listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
