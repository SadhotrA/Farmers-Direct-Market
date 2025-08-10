const mongoose = require('mongoose');

// Image schema for storing multiple sizes
const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL'
    }
  },
  public_id: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  medium: {
    type: String,
    required: true
  },
  large: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  originalName: {
    type: String,
    required: true
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer is required']
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'vegetables',
      'fruits',
      'grains',
      'dairy',
      'poultry',
      'fish',
      'herbs',
      'organic',
      'processed',
      'other'
    ]
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'quintal', 'ton', 'dozen', 'piece', 'bundle', 'litre', 'gram']
  },
  images: [ImageSchema],
  harvestDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'Harvest date cannot be in the future'
    }
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  maxOrderQuantity: {
    type: Number,
    min: [1, 'Maximum order quantity must be at least 1']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
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
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ farmer: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isAvailable: 1 });
ProductSchema.index({ pricePerUnit: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1 });

// Update the updatedAt field before saving
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for average rating
ProductSchema.virtual('averageRating').get(function() {
  return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Virtual for price per kg (for comparison)
ProductSchema.virtual('pricePerKg').get(function() {
  if (this.unit === 'kg') return this.pricePerUnit;
  if (this.unit === 'gram') return this.pricePerUnit * 1000;
  if (this.unit === 'quintal') return this.pricePerUnit / 100;
  if (this.unit === 'ton') return this.pricePerUnit / 1000;
  return this.pricePerUnit; // For other units, return as is
});

// Virtual for main image (first image or placeholder)
ProductSchema.virtual('mainImage').get(function() {
  if (this.images && this.images.length > 0) {
    return this.images[0].medium || this.images[0].url;
  }
  return null;
});

// Virtual for thumbnail image
ProductSchema.virtual('thumbnailImage').get(function() {
  if (this.images && this.images.length > 0) {
    return this.images[0].thumbnail || this.images[0].url;
  }
  return null;
});

// Method to add image
ProductSchema.methods.addImage = function(imageData) {
  this.images.push(imageData);
  return this.save();
};

// Method to remove image by public_id
ProductSchema.methods.removeImage = function(publicId) {
  this.images = this.images.filter(img => img.public_id !== publicId);
  return this.save();
};

// Method to reorder images
ProductSchema.methods.reorderImages = function(imageIds) {
  const orderedImages = [];
  for (const id of imageIds) {
    const image = this.images.find(img => img.public_id === id);
    if (image) {
      orderedImages.push(image);
    }
  }
  this.images = orderedImages;
  return this.save();
};

// Ensure virtual fields are serialized
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
