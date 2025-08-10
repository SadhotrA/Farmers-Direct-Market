/**
 * Geo-Search API Examples
 * 
 * This file contains examples of how to use the geo-search functionality
 * in the Farmers' Direct Market application.
 */

// Example 1: Basic geo-search within 20km radius
const basicGeoSearch = async () => {
  const response = await fetch('/api/products/geo-search?lat=40.7128&lng=-74.0060&radiusKm=20');
  const data = await response.json();
  console.log('Products near New York:', data);
};

// Example 2: Geo-search with filters
const filteredGeoSearch = async () => {
  const params = new URLSearchParams({
    lat: '40.7128',
    lng: '-74.0060',
    radiusKm: '30',
    category: 'vegetables',
    minPrice: '2',
    maxPrice: '10',
    q: 'organic',
    sortBy: 'distance',
    page: '1',
    limit: '20'
  });
  
  const response = await fetch(`/api/products/geo-search?${params}`);
  const data = await response.json();
  console.log('Filtered products:', data);
};

// Example 3: Geo-search with authentication (for personalized results)
const authenticatedGeoSearch = async (token) => {
  const response = await fetch('/api/products/geo-search?lat=40.7128&lng=-74.0060&radiusKm=25', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log('Personalized results:', data);
};

// Example 4: Using the main products API with geo parameters (redirects to geo-search)
const mainApiWithGeo = async () => {
  const params = new URLSearchParams({
    lat: '40.7128',
    lng: '-74.0060',
    radius: '15',
    category: 'fruits',
    min: '1',
    max: '15'
  });
  
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  console.log('Products from main API:', data);
};

// Example 5: Frontend React component example
const GeoSearchComponent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };
  
  // Search products near user location
  const searchNearbyProducts = async (radius = 20) => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radiusKm: radius.toString(),
        sortBy: 'distance'
      });
      
      const response = await fetch(`/api/products/geo-search?${params}`);
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={getUserLocation}>Get My Location</button>
      <button onClick={() => searchNearbyProducts(10)}>Search within 10km</button>
      <button onClick={() => searchNearbyProducts(50)}>Search within 50km</button>
      
      {loading && <p>Searching...</p>}
      
      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <h3>{product.title}</h3>
            <p>Price: ${product.pricePerUnit}/{product.unit}</p>
            <p>Distance: {product.distance}km</p>
            <p>Farmer: {product.farmer.name}</p>
            <p>Rating: {product.farmer.averageRating}/5</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 6: Node.js server-side usage
const serverSideGeoSearch = async () => {
  const { geoSearchProducts } = require('../lib/geoSearch');
  
  try {
    const result = await geoSearchProducts(
      40.7128, // lat
      -74.0060, // lng
      25, // radiusKm
      {}, // filters
      {
        category: 'vegetables',
        minPrice: 1,
        maxPrice: 20,
        sortBy: 'distance',
        page: 1,
        limit: 20
      }
    );
    
    console.log('Server-side geo-search result:', result);
  } catch (error) {
    console.error('Geo-search error:', error);
  }
};

// Example 7: API Response Structure
const apiResponseExample = {
  products: [
    {
      _id: "product_id",
      title: "Fresh Organic Tomatoes",
      description: "Freshly harvested organic tomatoes",
      pricePerUnit: 3.50,
      unit: "kg",
      category: "vegetables",
      images: ["https://example.com/tomato.jpg"],
      isOrganic: true,
      distance: 2.3, // Distance in km
      farmer: {
        _id: "farmer_id",
        name: "John Smith",
        farmName: "Green Valley Farm",
        averageRating: "4.5",
        isVerified: true,
        location: {
          type: "Point",
          coordinates: [-74.0060, 40.7128]
        }
      },
      createdAt: "2024-01-15T10:30:00Z"
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    pages: 3
  },
  searchParams: {
    lat: 40.7128,
    lng: -74.0060,
    radiusKm: 20,
    category: "vegetables",
    minPrice: 1,
    maxPrice: 10,
    q: "organic"
  }
};

module.exports = {
  basicGeoSearch,
  filteredGeoSearch,
  authenticatedGeoSearch,
  mainApiWithGeo,
  GeoSearchComponent,
  serverSideGeoSearch,
  apiResponseExample
};
