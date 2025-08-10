import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, authorizeRoles } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import { Subscription, User } from '../../../models';

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic Plan',
    price: 299,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    features: {
      priorityListing: false,
      analytics: false,
      marketingTools: false,
      customerSupport: false,
      maxProducts: 10,
      maxImagesPerProduct: 5
    }
  },
  PREMIUM: {
    name: 'Premium Plan',
    price: 799,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    features: {
      priorityListing: true,
      analytics: true,
      marketingTools: true,
      customerSupport: true,
      maxProducts: 50,
      maxImagesPerProduct: 10
    }
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    price: 1999,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    features: {
      priorityListing: true,
      analytics: true,
      marketingTools: true,
      customerSupport: true,
      maxProducts: 200,
      maxImagesPerProduct: 20
    }
  }
};

export async function POST(request) {
  try {
    await connectDB();
    
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { user } = authResult;
    
    // Only farmers can create subscriptions
    if (user.role !== 'farmer') {
      return NextResponse.json({ error: 'Only farmers can create subscriptions' }, { status: 403 });
    }
    
    const body = await request.json();
    const { plan, billingCycle, paymentMethod } = body;
    
    if (!plan || !billingCycle || !paymentMethod) {
      return NextResponse.json({ error: 'Plan, billing cycle, and payment method are required' }, { status: 400 });
    }
    
    // Validate plan
    if (!SUBSCRIPTION_PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }
    
    // Validate billing cycle
    const validBillingCycles = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
    if (!validBillingCycles.includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      farmer: user._id,
      status: { $in: ['ACTIVE', 'PENDING'] }
    });
    
    if (existingSubscription) {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
    }
    
    // Calculate subscription amount based on billing cycle
    const basePlan = SUBSCRIPTION_PLANS[plan];
    let amount = basePlan.price;
    
    if (billingCycle === 'QUARTERLY') {
      amount = basePlan.price * 3 * 0.9; // 10% discount
    } else if (billingCycle === 'YEARLY') {
      amount = basePlan.price * 12 * 0.8; // 20% discount
    }
    
    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    switch (billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    
    const subscription = new Subscription({
      farmer: user._id,
      plan,
      status: 'PENDING',
      amount: Math.round(amount),
      currency: basePlan.currency,
      billingCycle,
      startDate,
      endDate,
      features: basePlan.features,
      paymentMethod,
      paymentStatus: 'PENDING'
    });
    
    await subscription.save();
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        features: subscription.features,
        status: subscription.status,
        paymentStatus: subscription.paymentStatus,
        createdAt: subscription.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Subscription creation error:', error);
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
    } else if (user.role === 'admin') {
      // Admin can see all subscriptions
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const subscriptions = await Subscription.find(query)
      .populate('farmer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Subscription.countDocuments(query);
    
    // Get subscription statistics
    const stats = await Subscription.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.map(subscription => ({
        id: subscription._id,
        farmer: subscription.farmer,
        plan: subscription.plan,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        features: subscription.features,
        paymentStatus: subscription.paymentStatus,
        daysRemaining: subscription.daysRemaining,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats,
      plans: SUBSCRIPTION_PLANS
    });
    
  } catch (error) {
    console.error('Subscription listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
