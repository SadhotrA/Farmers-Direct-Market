import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product, User } from '@/models';
import { authenticateToken, authorizeRoles } from '@/lib/auth';

// GET /api/products - Search products with filters
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseFloat(searchParams.get('radius')) || 50; // Default 50km
    const q = searchParams.get('q'); // Search query
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('min'));
    const maxPrice = parseFloat(searchParams.get('max'));
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build query
    const query = { isAvailable: true };
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice !== null && !isNaN(minPrice)) {
      query.pricePerUnit = { $gte: minPrice };
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      query.pricePerUnit = { ...query.pricePerUnit, $lte: maxPrice };
    }
    
    // Geo search - use aggregation for better performance
    let geoQuery = null;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      // For geo-search, redirect to dedicated endpoint
      const geoSearchUrl = new URL('/api/products/geo-search', request.url);
      geoSearchUrl.searchParams.set('lat', lat.toString());
      geoSearchUrl.searchParams.set('lng', lng.toString());
      geoSearchUrl.searchParams.set('radiusKm', radius.toString());
      if (q) geoSearchUrl.searchParams.set('q', q);
      if (category) geoSearchUrl.searchParams.set('category', category);
      if (minPrice) geoSearchUrl.searchParams.set('minPrice', minPrice.toString());
      if (maxPrice) geoSearchUrl.searchParams.set('maxPrice', maxPrice.toString());
      if (page) geoSearchUrl.searchParams.set('page', page.toString());
      if (limit) geoSearchUrl.searchParams.set('limit', limit.toString());
      if (sortBy) geoSearchUrl.searchParams.set('sortBy', sortBy);
      if (sortOrder) geoSearchUrl.searchParams.set('sortOrder', sortOrder);
      
      // Redirect to geo-search endpoint
      return NextResponse.redirect(geoSearchUrl);
    }
    
    // Regular search without geo
    const finalQuery = query;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const products = await Product.find(finalQuery)
      .populate('farmer', 'name farmName location rating totalRatings isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Product.countDocuments(finalQuery);
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Search products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product listing (farmer only)
export async function POST(request) {
  try {
    await connectDB();
    
    // Authenticate and authorize farmer
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;
    if (user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can create product listings' },
        { status: 403 }
      );
    }
    
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Your account must be verified to create listings' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      description,
      category,
      pricePerUnit,
      availableQuantity,
      unit,
      images,
      harvestDate,
      isOrganic,
      minOrderQuantity,
      maxOrderQuantity,
      tags
    } = body;
    
    // Validation
    if (!title || !description || !category || !pricePerUnit || !availableQuantity || !unit) {
      return NextResponse.json(
        { error: 'Title, description, category, price, quantity, and unit are required' },
        { status: 400 }
      );
    }
    
    // Create product
    const productData = {
      farmer: user._id,
      title,
      description,
      category,
      pricePerUnit,
      availableQuantity,
      unit,
      images: images || [],
      harvestDate: harvestDate ? new Date(harvestDate) : null,
      isOrganic: isOrganic || false,
      minOrderQuantity: minOrderQuantity || 1,
      maxOrderQuantity,
      tags: tags || []
    };
    
    const product = new Product(productData);
    await product.save();
    
    // Populate farmer info
    await product.populate('farmer', 'name farmName location rating totalRatings isVerified');
    
    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create product error:', error);
    
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
