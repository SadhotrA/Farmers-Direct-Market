'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart, 
  Star, 
  MapPin, 
  Package,
  Clock,
  DollarSign,
  User
} from 'lucide-react'

export default function BuyerDashboard() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Load mock data
    loadDashboardData()
  }, [])

  const loadDashboardData = () => {
    // Mock products data
    const mockProducts = [
      {
        id: '1',
        name: 'Fresh Tomatoes',
        description: 'Organic red tomatoes, freshly harvested',
        price: 2.50,
        unit: 'kg',
        quantity: 100,
        category: 'vegetables',
        farmerName: 'John Smith',
        farmerRating: 4.5,
        location: 'New York, NY',
        distance: '5.2 km',
        images: ['/api/images/tomatoes1.jpg'],
        rating: 4.5,
        reviews: 12,
        isAvailable: true
      },
      {
        id: '2',
        name: 'Sweet Corn',
        description: 'Sweet yellow corn, perfect for cooking',
        price: 1.80,
        unit: 'dozen',
        quantity: 50,
        category: 'vegetables',
        farmerName: 'Sarah Johnson',
        farmerRating: 4.2,
        location: 'Manhattan, NY',
        distance: '3.8 km',
        images: ['/api/images/corn1.jpg'],
        rating: 4.2,
        reviews: 8,
        isAvailable: true
      },
      {
        id: '3',
        name: 'Fresh Apples',
        description: 'Crisp red apples from local orchards',
        price: 3.20,
        unit: 'kg',
        quantity: 75,
        category: 'fruits',
        farmerName: 'Mike Wilson',
        farmerRating: 4.8,
        location: 'Brooklyn, NY',
        distance: '7.1 km',
        images: ['/api/images/apples1.jpg'],
        rating: 4.8,
        reviews: 15,
        isAvailable: true
      }
    ]

    // Mock orders data
    const mockOrders = [
      {
        id: '1',
        productName: 'Fresh Tomatoes',
        farmerName: 'John Smith',
        quantity: 10,
        total: 25.00,
        status: 'delivered',
        orderDate: '2024-01-20',
        deliveryDate: '2024-01-22'
      },
      {
        id: '2',
        productName: 'Sweet Corn',
        farmerName: 'Sarah Johnson',
        quantity: 5,
        total: 9.00,
        status: 'shipped',
        orderDate: '2024-01-21',
        deliveryDate: '2024-01-23'
      }
    ]

    setProducts(mockProducts)
    setOrders(mockOrders)
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesPrice = (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
                        (!priceRange.max || product.price <= parseFloat(priceRange.max))
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">FarmDirect</h1>
              <span className="ml-4 text-gray-500">Buyer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button className="btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
              <option value="dairy">Dairy</option>
            </select>
            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <button className="text-gray-400 hover:text-red-500">
                        <Heart className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({product.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      {product.farmerName}
                      <Star className="h-4 w-4 text-yellow-400 fill-current ml-2" />
                      {product.farmerRating}
                    </div>
                    <div className="flex items-center mb-3 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {product.location} • {product.distance}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-gray-900">${product.price}</span>
                        <span className="text-sm text-gray-500">/{product.unit}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="btn-primary text-sm"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
                <p className="text-sm text-gray-600">{cart.length} items</p>
              </div>
              <div className="p-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">${item.price}/{item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 text-sm hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                      </div>
                      <button className="w-full btn-primary">
                        Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card mt-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">{order.productName}</h4>
                      <p className="text-sm text-gray-600">Farmer: {order.farmerName}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {order.quantity} • Total: ${order.total}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500">{order.orderDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
