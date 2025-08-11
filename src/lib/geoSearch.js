const { User } = require('../models');

/**
 * Perform geo-search for products near a given location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @param {Object} filters - Additional filters
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of products with distance and farmer info
 */
const geoSearchProducts = async (lat, lng, radiusKm = 20, filters = {}, options = {}) => {
  const {
    category,
    minPrice,
    maxPrice,
    q,
    page = 1,
    limit = 20,
    sortBy = 'distance',
    user = null
  } = options;
  
  const radiusMeters = radiusKm * 1000;
  
  // Build match query for products
  const productMatch = { isAvailable: true };
  
  if (category) {
    productMatch.category = category;
  }
  
  if (minPrice !== null && !isNaN(minPrice)) {
    productMatch.pricePerUnit = { $gte: minPrice };
  }
  
  if (maxPrice !== null && !isNaN(maxPrice)) {
    productMatch.pricePerUnit = { ...productMatch.pricePerUnit, $lte: maxPrice };
  }
  
  if (q) {
    productMatch.$text = { $search: q };
  }
  
  // Build match query for farmers
  const farmerMatch = { role: 'farmer' };
  
  // Only show verified farmers to non-authenticated users
  if (!user || user.role !== 'admin') {
    farmerMatch.isVerified = true;
  }
  
  // Geo-search aggregation pipeline
  const pipeline = [
    // Stage 1: Find farmers within radius
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: radiusMeters,
        spherical: true,
        query: farmerMatch
      }
    },
    
    // Stage 2: Limit farmers for performance
    { $limit: 100 },
    
    // Stage 3: Lookup products for each farmer
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'farmer',
        as: 'products',
        pipeline: [
          { $match: productMatch },
          { $limit: 50 } // Limit products per farmer
        ]
      }
    },
    
    // Stage 4: Unwind products to create farmer-product pairs
    { $unwind: '$products' },
    
    // Stage 5: Add distance to each product
    {
      $addFields: {
        'products.distance': '$distance',
        'products.farmerInfo': {
          _id: '$_id',
          name: '$name',
          farmName: '$farmName',
          rating: '$rating',
          totalRatings: '$totalRatings',
          isVerified: '$isVerified',
          location: '$location'
        }
      }
    },
    
    // Stage 6: Replace root with product data
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$products',
            { farmer: '$products.farmerInfo' }
          ]
        }
      }
    },
    
    // Stage 7: Remove the nested farmerInfo
    {
      $project: {
        'products.farmerInfo': 0
      }
    }
  ];
  
  // Stage 8: Sort results
  let sortStage = {};
  switch (sortBy) {
    case 'distance':
      sortStage = { distance: 1 };
      break;
    case 'price':
      sortStage = { pricePerUnit: 1 };
      break;
    case 'rating':
      sortStage = { 'farmer.rating': -1 };
      break;
    case 'newest':
      sortStage = { createdAt: -1 };
      break;
    default:
      sortStage = { distance: 1 };
  }
  
  pipeline.push({ $sort: sortStage });
  
  // Stage 9: Pagination
  const skip = (page - 1) * limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });
  
  // Execute aggregation
  const results = await User.aggregate(pipeline);
  
  // Get total count for pagination (without skip/limit)
  const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
  countPipeline.push({ $count: 'total' });
  const countResult = await User.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;
  
  // Format results
  const products = results.map(item => ({
    ...item,
    distance: Math.round(item.distance / 1000 * 10) / 10, // Convert to km with 1 decimal
    farmer: {
      ...item.farmer,
      averageRating: item.farmer.totalRatings > 0 
        ? (item.farmer.rating / item.farmer.totalRatings).toFixed(1) 
        : '0.0'
    }
  }));
  
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid
 */
const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Convert address to coordinates using geocoding (placeholder for future implementation)
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Coordinates { lat, lng }
 */
const geocodeAddress = async (address) => {
  // Simple mock implementation for development
  // In production, integrate with Google Maps, Mapbox, or similar service
  console.warn('Geocoding service not implemented. Using mock coordinates.');
  
  // Return mock coordinates for common cities (for development)
  const mockCoordinates = {
    'new york': { lat: 40.7128, lng: -74.0060 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'default': { lat: 28.7041, lng: 77.1025 } // Default to Delhi
  };
  
  const searchKey = address.toLowerCase();
  const coords = mockCoordinates[searchKey] || mockCoordinates['default'];
  
  return coords;
};

module.exports = {
  geoSearchProducts,
  calculateDistance,
  validateCoordinates,
  geocodeAddress
};
