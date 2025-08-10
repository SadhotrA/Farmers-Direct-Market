const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required']
  }
});

const OrderHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  updatedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user is required']
  },
  at: {
    type: Date,
    default: Date.now
  }
});

const OrderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  farmer: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer is required']
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PLACED'
  },
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(v) {
          return !v || (v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90);
        },
        message: 'Invalid coordinates'
      }
    }
  },
  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Delivery instructions cannot exceed 500 characters']
  },
  expectedDeliveryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Expected delivery date must be in the future'
    }
  },
  actualDeliveryDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'ONLINE', 'BANK_TRANSFER'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  history: [OrderHistorySchema],
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
OrderSchema.index({ buyer: 1 });
OrderSchema.index({ farmer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ expectedDeliveryDate: 1 });
OrderSchema.index({ paymentStatus: 1 });

// Update the updatedAt field before saving
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add initial history entry when order is created
OrderSchema.pre('save', function(next) {
  if (this.isNew && this.history.length === 0) {
    this.history.push({
      status: this.status,
      note: 'Order placed',
      updatedBy: this.buyer,
      at: new Date()
    });
  }
  next();
});

// Virtual for order summary
OrderSchema.virtual('orderSummary').get(function() {
  return `${this.items.length} item(s) - ${this.status}`;
});

// Virtual for total items count
OrderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to update order status
OrderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.history.push({
    status: newStatus,
    note: note || `Order ${newStatus.toLowerCase()}`,
    updatedBy: updatedBy,
    at: new Date()
  });
  
  if (newStatus === 'DELIVERED' && !this.actualDeliveryDate) {
    this.actualDeliveryDate = new Date();
  }
  
  return this.save();
};

// Ensure virtual fields are serialized
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
