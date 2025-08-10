const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  buyer: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmer: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
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
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'BANK_TRANSFER', 'STRIPE', 'RAZORPAY', 'PAYPAL']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'PENDING'
  },
  gatewayTransactionId: {
    type: String,
    sparse: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  commission: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 5, // 5% default commission
      min: 0,
      max: 100
    }
  },
  farmerPayout: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING'
    },
    processedAt: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: String,
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
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ buyer: 1 });
PaymentSchema.index({ farmer: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ gatewayTransactionId: 1 }, { sparse: true });

// Virtual for net amount (after commission)
PaymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.commission.amount;
});

// Pre-save hook to update timestamps
PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to calculate commission
PaymentSchema.methods.calculateCommission = function() {
  this.commission.amount = (this.amount * this.commission.percentage) / 100;
  this.farmerPayout.amount = this.amount - this.commission.amount;
  return this;
};

// Method to process payment
PaymentSchema.methods.processPayment = async function(gatewayResponse) {
  this.status = 'COMPLETED';
  this.gatewayResponse = gatewayResponse;
  this.farmerPayout.status = 'PENDING';
  return this.save();
};

// Method to process farmer payout
PaymentSchema.methods.processFarmerPayout = async function() {
  this.farmerPayout.status = 'PROCESSED';
  this.farmerPayout.processedAt = new Date();
  return this.save();
};

module.exports = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
