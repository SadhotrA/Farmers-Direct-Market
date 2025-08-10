const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['BASIC', 'PREMIUM', 'ENTERPRISE']
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING'],
    default: 'PENDING'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  billingCycle: {
    type: String,
    required: true,
    enum: ['MONTHLY', 'QUARTERLY', 'YEARLY']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  features: {
    priorityListing: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    },
    marketingTools: {
      type: Boolean,
      default: false
    },
    customerSupport: {
      type: Boolean,
      default: false
    },
    maxProducts: {
      type: Number,
      default: 10
    },
    maxImagesPerProduct: {
      type: Number,
      default: 5
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['BANK_TRANSFER', 'STRIPE', 'RAZORPAY', 'PAYPAL']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  gatewayTransactionId: {
    type: String,
    sparse: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
SubscriptionSchema.index({ farmer: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });
SubscriptionSchema.index({ createdAt: -1 });
SubscriptionSchema.index({ gatewayTransactionId: 1 }, { sparse: true });

// Virtual for subscription duration in days
SubscriptionSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days remaining
SubscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'ACTIVE') return 0;
  const now = new Date();
  const remaining = this.endDate - now;
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
});

// Pre-save hook to update timestamps
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if subscription is active
SubscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'ACTIVE' && this.startDate <= now && this.endDate > now;
};

// Method to cancel subscription
SubscriptionSchema.methods.cancel = function(cancelledBy) {
  this.status = 'CANCELLED';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.autoRenew = false;
  return this.save();
};

// Method to renew subscription
SubscriptionSchema.methods.renew = function(newEndDate) {
  this.endDate = newEndDate;
  this.status = 'ACTIVE';
  this.cancelledAt = null;
  this.cancelledBy = null;
  return this.save();
};

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
