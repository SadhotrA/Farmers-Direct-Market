const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Payment gateway configurations (to be set via environment variables)
const PAYMENT_CONFIG = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox' // 'sandbox' or 'live'
  }
};

// Calculate commission based on order amount
const calculateCommission = (amount, commissionPercentage = 5) => {
  return (amount * commissionPercentage) / 100;
};

// Create payment record
const createPayment = async (orderId, buyerId, farmerId, amount, paymentMethod, currency = 'INR') => {
  const commission = calculateCommission(amount);
  
  const payment = new Payment({
    order: orderId,
    buyer: buyerId,
    farmer: farmerId,
    amount,
    currency,
    paymentMethod,
    commission: {
      amount: commission,
      percentage: 5
    },
    farmerPayout: {
      amount: amount - commission,
      status: 'PENDING'
    }
  });

  return await payment.save();
};

// Handle COD payment
const handleCODPayment = async (orderId, buyerId, farmerId, amount) => {
  const payment = await createPayment(orderId, buyerId, farmerId, amount, 'COD');
  
  // For COD, payment is pending until delivery
  payment.status = 'PENDING';
  payment.metadata = {
    codInstructions: 'Payment to be collected on delivery',
    requiresConfirmation: true
  };
  
  return await payment.save();
};

// Handle bank transfer payment
const handleBankTransferPayment = async (orderId, buyerId, farmerId, amount, transferDetails) => {
  const payment = await createPayment(orderId, buyerId, farmerId, amount, 'BANK_TRANSFER');
  
  payment.status = 'PENDING';
  payment.metadata = {
    bankDetails: transferDetails,
    requiresVerification: true
  };
  
  return await payment.save();
};

// Verify bank transfer payment
const verifyBankTransferPayment = async (paymentId, verificationData) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  // In a real implementation, you would verify with the bank
  // For now, we'll simulate verification
  if (verificationData.verified) {
    payment.status = 'COMPLETED';
    payment.metadata.verificationData = verificationData;
    payment.farmerPayout.status = 'PENDING';
    
    // Update order status
    await Order.findByIdAndUpdate(payment.order, { status: 'CONFIRMED' });
    
    return await payment.save();
  } else {
    payment.status = 'FAILED';
    payment.metadata.verificationData = verificationData;
    return await payment.save();
  }
};

// Process farmer payout
const processFarmerPayout = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'COMPLETED') {
    throw new Error('Payment must be completed before processing payout');
  }

  // In a real implementation, you would integrate with payment gateways
  // to transfer money to the farmer's account
  payment.farmerPayout.status = 'PROCESSED';
  payment.farmerPayout.processedAt = new Date();
  
  return await payment.save();
};

// Get payment statistics
const getPaymentStats = async (userId, role) => {
  const query = role === 'farmer' ? { farmer: userId } : { buyer: userId };
  
  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const totalCommission = await Payment.aggregate([
    { $match: { ...query, status: 'COMPLETED' } },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$commission.amount' }
      }
    }
  ]);

  return {
    stats,
    totalCommission: totalCommission[0]?.totalCommission || 0
  };
};

// Get subscription revenue
const getSubscriptionRevenue = async (startDate, endDate) => {
  const Subscription = require('../models/Subscription');
  
  return await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    }
  ]);
};

// Payment gateway integration placeholders
const stripePayment = {
  createPaymentIntent: async (amount, currency = 'inr') => {
    // Placeholder for Stripe integration
    throw new Error('Stripe integration not implemented');
  },
  
  confirmPayment: async (paymentIntentId) => {
    // Placeholder for Stripe payment confirmation
    throw new Error('Stripe integration not implemented');
  }
};

const razorpayPayment = {
  createOrder: async (amount, currency = 'INR') => {
    // Placeholder for Razorpay integration
    throw new Error('Razorpay integration not implemented');
  },
  
  verifyPayment: async (orderId, paymentId, signature) => {
    // Placeholder for Razorpay payment verification
    throw new Error('Razorpay integration not implemented');
  }
};

const paypalPayment = {
  createOrder: async (amount, currency = 'USD') => {
    // Placeholder for PayPal integration
    throw new Error('PayPal integration not implemented');
  },
  
  capturePayment: async (orderId) => {
    // Placeholder for PayPal payment capture
    throw new Error('PayPal integration not implemented');
  }
};

module.exports = {
  PAYMENT_CONFIG,
  calculateCommission,
  createPayment,
  handleCODPayment,
  handleBankTransferPayment,
  verifyBankTransferPayment,
  processFarmerPayout,
  getPaymentStats,
  getSubscriptionRevenue,
  stripePayment,
  razorpayPayment,
  paypalPayment
};
