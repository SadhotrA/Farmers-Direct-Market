'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  MapPin,
  Calendar
} from 'lucide-react'

export default function FarmerDashboard() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0
  })

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
        price: 2.50,
        quantity: 100,
        unit: 'kg',
        category: 'vegetables',
        rating: 4.5,
        reviews: 12,
        isAvailable: true,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        name: 'Sweet Corn',
        price: 1.80,
        quantity: 50,
        unit: 'dozen',
        category: 'vegetables',
        rating: 4.2,
        reviews: 8,
        isAvailable: true,
        createdAt: '2024-01-10'
      }
    ]

    // Mock orders data
    const mockOrders = [
      {
        id: '1',
        productName: 'Fresh Tomatoes',
        buyerName: 'Restaurant ABC',
        quantity: 20,
        total: 50.00,
        status: 'pending',
        orderDate: '2024-01-20',
        deliveryDate: '2024-01-22'
      },
      {
        id: '2',
        productName: 'Sweet Corn',
        buyerName: 'Market XYZ',
        quantity: 10,
        total: 18.00,
        status: 'delivered',
        orderDate: '2024-01-18',
        deliveryDate: '2024-01-20'
      }
    ]

    setProducts(mockProducts)
    setOrders(mockOrders)

    // Calculate stats
    const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
    const averageRating = mockProducts.reduce((sum, product) => sum + product.rating, 0) / mockProducts.length

    setStats({
      totalProducts: mockProducts.length,
      totalOrders: mockOrders.length,
      totalRevenue,
      averageRating: averageRating.toFixed(1)
    })
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
              <span className="ml-4 text-gray-500">Farmer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button className="btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Products Section */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Products</h3>
                <button className="btn-primary flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        ${product.price}/{product.unit} • {product.quantity} {product.unit} available
                      </p>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({product.reviews} reviews)</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{order.productName}</h4>
                        <p className="text-sm text-gray-600">Buyer: {order.buyerName}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {order.quantity} • Total: ${order.total}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {order.orderDate}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Delivery: {order.deliveryDate}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary flex items-center justify-center">
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </button>
            <button className="btn-secondary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              View Analytics
            </button>
            <button className="btn-secondary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Manage Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
