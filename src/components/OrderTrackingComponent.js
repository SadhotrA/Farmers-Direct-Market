'use client';

import { useState, useEffect } from 'react';
import { useOrderSocket } from '@/hooks/useSocket';

const OrderTrackingComponent = ({ orderId, token, currentUser }) => {
  const [order, setOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const { 
    isConnected: socketConnected, 
    emit, 
    on, 
    off, 
    joinRoom, 
    leaveRoom 
  } = useOrderSocket(token);

  // Join order room when component mounts
  useEffect(() => {
    if (socketConnected && orderId) {
      joinRoom(orderId);
      setIsConnected(true);
    }
  }, [socketConnected, orderId, joinRoom]);

  // Leave order room when component unmounts
  useEffect(() => {
    return () => {
      if (orderId) {
        leaveRoom(orderId);
      }
    };
  }, [orderId, leaveRoom]);

  // Socket event listeners
  useEffect(() => {
    if (!socketConnected) return;

    // Listen for order status updates
    const handleOrderUpdate = (data) => {
      setOrder(prev => ({
        ...prev,
        status: data.status,
        updatedAt: data.updatedAt
      }));
      
      setOrderHistory(prev => [...prev, {
        type: 'status_update',
        status: data.status,
        note: data.note,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt
      }]);
    };

    // Listen for order delivery
    const handleOrderDelivered = (data) => {
      setOrder(prev => ({
        ...prev,
        status: 'DELIVERED',
        deliveredAt: data.deliveredAt
      }));
      
      setOrderHistory(prev => [...prev, {
        type: 'delivered',
        deliveryNote: data.deliveryNote,
        deliveredBy: data.deliveredBy,
        deliveredAt: data.deliveredAt
      }]);
    };

    // Listen for order cancellation
    const handleOrderCancelled = (data) => {
      setOrder(prev => ({
        ...prev,
        status: 'CANCELLED',
        cancelledAt: data.cancelledAt
      }));
      
      setOrderHistory(prev => [...prev, {
        type: 'cancelled',
        reason: data.reason,
        cancelledBy: data.cancelledBy,
        cancelledAt: data.cancelledAt
      }]);
    };

    on('order:update', handleOrderUpdate);
    on('order:delivered', handleOrderDelivered);
    on('order:cancelled', handleOrderCancelled);

    return () => {
      off('order:update', handleOrderUpdate);
      off('order:delivered', handleOrderDelivered);
      off('order:cancelled', handleOrderCancelled);
    };
  }, [socketConnected, on, off]);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
          setOrderHistory(data.order.history || []);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, token]);

  // Update order status (for farmers/admins)
  const updateOrderStatus = async (status, note = '') => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });

      if (response.ok) {
        // Emit real-time update
        emit('order:update', { orderId, status, note });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Mark order as delivered
  const markAsDelivered = async (deliveryNote = '') => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'DELIVERED', 
          note: deliveryNote 
        })
      });

      if (response.ok) {
        // Emit real-time delivery notification
        emit('order:delivered', { orderId, deliveryNote });
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error);
    }
  };

  // Cancel order
  const cancelOrder = async (reason = '') => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'CANCELLED', 
          note: reason 
        })
      });

      if (response.ok) {
        // Emit real-time cancellation notification
        emit('order:cancelled', { orderId, reason });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  const statusColors = {
    'PLACED': 'bg-blue-100 text-blue-800',
    'CONFIRMED': 'bg-yellow-100 text-yellow-800',
    'PACKED': 'bg-orange-100 text-orange-800',
    'SHIPPED': 'bg-purple-100 text-purple-800',
    'DELIVERED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Order #{order._id.slice(-8)}</h2>
          <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {order.status}
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.product.title} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Delivery Address</h3>
          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          {order.deliveryInstructions && (
            <div className="mt-2">
              <h4 className="font-medium text-sm">Instructions:</h4>
              <p className="text-sm text-gray-600">{order.deliveryInstructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Controls (for farmers/admins) */}
      {(currentUser.role === 'farmer' || currentUser.role === 'admin') && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Update Order Status</h3>
          <div className="flex flex-wrap gap-2">
            {order.status === 'PLACED' && (
              <button
                onClick={() => updateOrderStatus('CONFIRMED', 'Order confirmed')}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                Confirm Order
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button
                onClick={() => updateOrderStatus('PACKED', 'Order packed and ready')}
                className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                Mark as Packed
              </button>
            )}
            {order.status === 'PACKED' && (
              <button
                onClick={() => updateOrderStatus('SHIPPED', 'Order shipped')}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Mark as Shipped
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button
                onClick={() => markAsDelivered('Order delivered successfully')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Mark as Delivered
              </button>
            )}
            {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED'].includes(order.status) && (
              <button
                onClick={() => cancelOrder('Order cancelled')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}

      {/* Order History */}
      <div>
        <h3 className="font-semibold mb-3">Order History</h3>
        <div className="space-y-3">
          {orderHistory.map((event, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {event.type === 'status_update' && `Status updated to ${event.status}`}
                      {event.type === 'delivered' && 'Order delivered'}
                      {event.type === 'cancelled' && 'Order cancelled'}
                    </p>
                    {event.note && <p className="text-sm text-gray-600 mt-1">{event.note}</p>}
                    {event.reason && <p className="text-sm text-gray-600 mt-1">Reason: {event.reason}</p>}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.updatedAt || event.deliveredAt || event.cancelledAt).toLocaleString()}
                  </span>
                </div>
                {event.updatedBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    Updated by: {event.updatedBy.name} ({event.updatedBy.role})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingComponent;
