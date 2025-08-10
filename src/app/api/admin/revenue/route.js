import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, authorizeRoles } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import { Payment, Subscription, Order } from '../../../models';
import { getPaymentStats, getSubscriptionRevenue } from '../../../lib/payment';

export async function GET(request) {
  try {
    await connectDB();
    
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { user } = authResult;
    
    // Only admin can access revenue data
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case 'day':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case 'month':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1)
            }
          };
          break;
        case 'year':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), 0, 1)
            }
          };
          break;
      }
    }
    
    // Get payment revenue statistics
    const paymentStats = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          totalCommission: { $sum: '$commission.amount' },
          totalPayouts: { $sum: '$farmerPayout.amount' },
          paymentCount: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Get payment method breakdown
    const paymentMethodStats = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED' } },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Get subscription revenue
    const subscriptionRevenue = await Subscription.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'COMPLETED' } },
      {
        $group: {
          _id: '$plan',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Get overall revenue summary
    const totalRevenue = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCommission: { $sum: '$commission.amount' },
          totalPayouts: { $sum: '$farmerPayout.amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);
    
    const totalSubscriptionRevenue = await Subscription.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          subscriptionCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get top performing farmers
    const topFarmers = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED' } },
      {
        $group: {
          _id: '$farmer',
          totalSales: { $sum: '$amount' },
          orderCount: { $sum: 1 },
          totalCommission: { $sum: '$commission.amount' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      { $unwind: '$farmer' },
      {
        $project: {
          farmer: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1
          },
          totalSales: 1,
          orderCount: 1,
          totalCommission: 1
        }
      }
    ]);
    
    // Get recent transactions
    const recentTransactions = await Payment.find({ ...dateFilter })
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('order', 'total status')
      .sort({ createdAt: -1 })
      .limit(20);
    
    return NextResponse.json({
      success: true,
      revenue: {
        summary: {
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
          totalCommission: totalRevenue[0]?.totalCommission || 0,
          totalPayouts: totalRevenue[0]?.totalPayouts || 0,
          paymentCount: totalRevenue[0]?.paymentCount || 0,
          subscriptionRevenue: totalSubscriptionRevenue[0]?.totalRevenue || 0,
          subscriptionCount: totalSubscriptionRevenue[0]?.subscriptionCount || 0,
          netRevenue: (totalRevenue[0]?.totalCommission || 0) + (totalSubscriptionRevenue[0]?.totalRevenue || 0)
        },
        timeSeries: paymentStats,
        paymentMethods: paymentMethodStats,
        subscriptions: subscriptionRevenue,
        topFarmers,
        recentTransactions: recentTransactions.map(transaction => ({
          id: transaction._id,
          orderId: transaction.order._id,
          buyer: transaction.buyer,
          farmer: transaction.farmer,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
          status: transaction.status,
          commission: transaction.commission,
          createdAt: transaction.createdAt
        }))
      }
    });
    
  } catch (error) {
    console.error('Revenue stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
