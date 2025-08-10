import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/models';
import { authenticateToken } from '@/lib/auth';

// GET /api/products/:id - Get product details
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const product = await Product.findById(id)
      .populate('farmer', 'name farmName location rating totalRatings isVerified')
      .lean();
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
    
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id - Update product listing
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
    const body = await request.json();
    
    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (product.farmer.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'You can only update your own products' },
        { status: 403 }
      );
    }
    
    // Update allowed fields
    const updateData = {};
    const allowedFields = [
      'title', 'description', 'category', 'pricePerUnit', 'availableQuantity',
      'unit', 'images', 'harvestDate', 'isOrganic', 'minOrderQuantity',
      'maxOrderQuantity', 'tags', 'isAvailable'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    // Handle date fields
    if (body.harvestDate) {
      updateData.harvestDate = new Date(body.harvestDate);
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('farmer', 'name farmName location rating totalRatings isVerified');
    
    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    
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

// DELETE /api/products/:id - Delete product listing
export async function DELETE(request, { params }) {
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
    
    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (product.farmer.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'You can only delete your own products' },
        { status: 403 }
      );
    }
    
    // Check if product has active orders
    // TODO: Add order check here when Order model is implemented
    
    // Delete product
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
