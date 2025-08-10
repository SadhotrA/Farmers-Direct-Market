import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { geoSearchProducts, validateCoordinates } from '@/lib/geoSearch';
import { optionalAuth } from '@/lib/auth';

// GET /api/products/geo-search - Geo-based product search
export async function GET(request) {
  try {
    await connectDB();
    
    // Optional authentication for personalized results
    const authResult = await optionalAuth(request);
    const user = authResult.user;
    
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radiusKm = parseFloat(searchParams.get('radiusKm') || 20);
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice'));
    const maxPrice = parseFloat(searchParams.get('maxPrice'));
    const q = searchParams.get('q'); // Search query
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sortBy = searchParams.get('sortBy') || 'distance'; // distance, price, rating
    
    // Validation
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    if (!validateCoordinates(lat, lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' },
        { status: 400 }
      );
    }
    
    // Use the geo-search utility function
    const result = await geoSearchProducts(lat, lng, radiusKm, {}, {
      category,
      minPrice,
      maxPrice,
      q,
      page,
      limit,
      sortBy,
      user
    });
    
    return NextResponse.json({
      ...result,
      searchParams: {
        lat,
        lng,
        radiusKm,
        category,
        minPrice,
        maxPrice,
        q
      }
    });
    
  } catch (error) {
    console.error('Geo-search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
