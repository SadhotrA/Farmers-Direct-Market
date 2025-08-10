/**
 * Socket.io Real-time Examples
 * 
 * This file contains examples of how to use the Socket.io real-time functionality
 * in the Farmers' Direct Market application.
 */

// Example 1: Basic Socket.io Client Setup
const basicSocketSetup = () => {
  // Note: In a real application, you would import at the top of the file
  // import { io } from 'socket.io-client';
  
  // For this example, we'll assume io is available
  const socket = io('http://localhost:3000', {
    auth: {
      token: 'your-jwt-token-here'
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.io server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.io server');
  });

  return socket;
};

// Example 2: Chat Namespace Usage
const chatNamespaceExample = () => {
  // Note: In a real application, you would import at the top of the file
  // import { io } from 'socket.io-client';
  
  const chatSocket = io('http://localhost:3000/chat', {
    auth: { token: 'your-jwt-token' }
  });

  // Join a specific chat room
  chatSocket.emit('join:chat', 'chat-id-123');

  // Send a new message
  chatSocket.emit('message:new', {
    chatId: 'chat-id-123',
    message: {
      text: 'Hello, how are you?',
      messageType: 'text'
    }
  });

  // Listen for new messages
  chatSocket.on('message:new', (data) => {
    console.log('New message received:', data);
  });

  // Typing indicators
  chatSocket.emit('typing:start', 'chat-id-123');
  chatSocket.emit('typing:stop', 'chat-id-123');

  chatSocket.on('typing:start', (data) => {
    console.log(`${data.userName} is typing...`);
  });

  chatSocket.on('typing:stop', (data) => {
    console.log(`${data.userName} stopped typing`);
  });

  // Read receipts
  chatSocket.emit('message:read', {
    chatId: 'chat-id-123',
    messageIds: ['msg-1', 'msg-2']
  });

  chatSocket.on('message:read', (data) => {
    console.log('Messages marked as read:', data);
  });
};

// Example 3: Order Namespace Usage
const orderNamespaceExample = () => {
  // Note: In a real application, you would import at the top of the file
  // import { io } from 'socket.io-client';
  
  const orderSocket = io('http://localhost:3000/order', {
    auth: { token: 'your-jwt-token' }
  });

  // Join a specific order room
  orderSocket.emit('join:order', 'order-id-456');

  // Update order status (farmer/admin)
  orderSocket.emit('order:update', {
    orderId: 'order-id-456',
    status: 'CONFIRMED',
    note: 'Order confirmed and will be packed soon'
  });

  // Mark order as delivered
  orderSocket.emit('order:delivered', {
    orderId: 'order-id-456',
    deliveryNote: 'Order delivered successfully'
  });

  // Cancel order
  orderSocket.emit('order:cancelled', {
    orderId: 'order-id-456',
    reason: 'Out of stock'
  });

  // Listen for order updates
  orderSocket.on('order:update', (data) => {
    console.log('Order status updated:', data);
  });

  orderSocket.on('order:delivered', (data) => {
    console.log('Order delivered:', data);
  });

  orderSocket.on('order:cancelled', (data) => {
    console.log('Order cancelled:', data);
  });
};

// Example 4: React Hook Usage
const reactHookExample = () => {
  // Note: In a real application, you would import at the top of the file
  // import { useChatSocket, useOrderSocket, useMultiSocket } from '@/hooks/useSocket';
  // import { useEffect } from 'react';

  const ChatComponent = ({ token, chatId }) => {
    const { 
      isConnected, 
      emit, 
      on, 
      off, 
      joinRoom, 
      leaveRoom 
    } = useChatSocket(token);

    useEffect(() => {
      if (isConnected && chatId) {
        joinRoom(chatId);
      }

      return () => {
        if (chatId) {
          leaveRoom(chatId);
        }
      };
    }, [isConnected, chatId, joinRoom, leaveRoom]);

    useEffect(() => {
      if (!isConnected) return;

      const handleNewMessage = (data) => {
        console.log('New message:', data);
      };

      on('message:new', handleNewMessage);

      return () => {
        off('message:new', handleNewMessage);
      };
    }, [isConnected, on, off]);

    const sendMessage = (text) => {
      emit('message:new', {
        chatId,
        message: { text, messageType: 'text' }
      });
    };

    return (
      <div>
        <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        <button onClick={() => sendMessage('Hello!')}>
          Send Message
        </button>
      </div>
    );
  };

  const OrderComponent = ({ token, orderId }) => {
    const { 
      isConnected, 
      emit, 
      on, 
      off, 
      joinRoom 
    } = useOrderSocket(token);

    useEffect(() => {
      if (isConnected && orderId) {
        joinRoom(orderId);
      }
    }, [isConnected, orderId, joinRoom]);

    useEffect(() => {
      if (!isConnected) return;

      const handleOrderUpdate = (data) => {
        console.log('Order updated:', data);
      };

      on('order:update', handleOrderUpdate);

      return () => {
        off('order:update', handleOrderUpdate);
      };
    }, [isConnected, on, off]);

    const updateStatus = (status) => {
      emit('order:update', {
        orderId,
        status,
        note: `Status updated to ${status}`
      });
    };

    return (
      <div>
        <p>Order Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        <button onClick={() => updateStatus('CONFIRMED')}>
          Confirm Order
        </button>
      </div>
    );
  };

  const MultiSocketComponent = ({ token }) => {
    const { chat, order, global, isConnected } = useMultiSocket(token);

    return (
      <div>
        <p>All Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>Chat: {chat.isConnected ? 'Connected' : 'Disconnected'}</p>
        <p>Order: {order.isConnected ? 'Connected' : 'Disconnected'}</p>
        <p>Global: {global.isConnected ? 'Connected' : 'Disconnected'}</p>
      </div>
    );
  };
};

// Example 5: Server-side Socket.io Integration
const serverSideExample = () => {
  const socketManager = require('@/lib/socket');

  // Emit to specific user
  socketManager.emitToUser('user-id-123', 'notification', {
    type: 'order_update',
    message: 'Your order has been confirmed'
  });

  // Emit to chat room
  socketManager.emitToChat('chat-id-123', 'message:new', {
    chatId: 'chat-id-123',
    message: {
      text: 'System message',
      sender: 'system'
    }
  });

  // Emit to order room
  socketManager.emitToOrder('order-id-456', 'order:update', {
    orderId: 'order-id-456',
    status: 'SHIPPED',
    updatedBy: {
      _id: 'admin-id',
      name: 'Admin User',
      role: 'admin'
    }
  });

  // Emit to multiple users
  socketManager.emitToUsers(['user-1', 'user-2'], 'broadcast', {
    message: 'System maintenance in 5 minutes'
  });

  // Check if user is online
  const isOnline = socketManager.isUserOnline('user-id-123');
  console.log('User online:', isOnline);

  // Get online users count
  const onlineCount = socketManager.getOnlineUsersCount();
  console.log('Online users:', onlineCount);
};

// Example 6: API Route Integration
const apiRouteIntegration = () => {
  // In your API route (e.g., /api/chats/[chatId]/route.js)
  const sendMessage = async (req, res) => {
    try {
      // Save message to database
      const message = await saveMessageToDatabase(req.body);
      
      // Emit real-time update
      const socketManager = require('@/lib/socket');
      socketManager.emitToChat(chatId, 'message:new', {
        chatId,
        message,
        sender: {
          _id: req.user._id,
          name: req.user.name
        }
      });
      
      res.json({ success: true, message });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  };

  // In your order update route (e.g., /api/orders/[id]/route.js)
  const updateOrderStatus = async (req, res) => {
    try {
      // Update order in database
      const order = await updateOrderInDatabase(orderId, req.body);
      
      // Emit real-time update
      const socketManager = require('@/lib/socket');
      socketManager.emitToOrder(orderId, 'order:update', {
        orderId,
        status: req.body.status,
        note: req.body.note,
        updatedBy: {
          _id: req.user._id,
          name: req.user.name,
          role: req.user.role
        },
        updatedAt: new Date()
      });
      
      res.json({ success: true, order });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  };
};

// Example 7: Event Structure Examples
const eventStructures = {
  // Chat Events
  chatEvents: {
    'message:new': {
      chatId: 'chat-id-123',
      message: {
        _id: 'msg-id-456',
        text: 'Hello, how are you?',
        sender: 'user-id-789',
        at: '2024-01-15T10:30:00Z',
        messageType: 'text'
      },
      sender: {
        _id: 'user-id-789',
        name: 'John Doe',
        profileImage: 'https://example.com/avatar.jpg'
      }
    },
    'typing:start': {
      chatId: 'chat-id-123',
      userId: 'user-id-789',
      userName: 'John Doe'
    },
    'typing:stop': {
      chatId: 'chat-id-123',
      userId: 'user-id-789'
    },
    'message:read': {
      chatId: 'chat-id-123',
      messageIds: ['msg-1', 'msg-2'],
      readBy: 'user-id-789',
      readAt: '2024-01-15T10:35:00Z'
    }
  },

  // Order Events
  orderEvents: {
    'order:update': {
      orderId: 'order-id-456',
      status: 'CONFIRMED',
      note: 'Order confirmed and will be packed soon',
      updatedBy: {
        _id: 'farmer-id-123',
        name: 'Farmer Smith',
        role: 'farmer'
      },
      updatedAt: '2024-01-15T10:30:00Z'
    },
    'order:delivered': {
      orderId: 'order-id-456',
      deliveryNote: 'Order delivered successfully',
      deliveredBy: {
        _id: 'farmer-id-123',
        name: 'Farmer Smith',
        role: 'farmer'
      },
      deliveredAt: '2024-01-15T10:30:00Z'
    },
    'order:cancelled': {
      orderId: 'order-id-456',
      reason: 'Out of stock',
      cancelledBy: {
        _id: 'farmer-id-123',
        name: 'Farmer Smith',
        role: 'farmer'
      },
      cancelledAt: '2024-01-15T10:30:00Z'
    }
  },

  // Global Events
  globalEvents: {
    'user:online': {
      userId: 'user-id-123',
      name: 'John Doe'
    },
    'user:offline': {
      userId: 'user-id-123',
      name: 'John Doe'
    }
  }
};

// Example 8: Error Handling
const errorHandlingExample = () => {
  // Note: In a real application, you would import at the top of the file
  // import { useSocket } from '@/hooks/useSocket';
  // import { useEffect } from 'react';

  const SocketComponent = ({ token }) => {
    const { isConnected, error, connect, disconnect } = useSocket(token);

    useEffect(() => {
      if (error) {
        console.error('Socket error:', error);
        // Handle error (show notification, retry connection, etc.)
      }
    }, [error]);

    const handleReconnect = () => {
      disconnect();
      setTimeout(() => {
        connect();
      }, 1000);
    };

    return (
      <div>
        <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        {error && (
          <div>
            <p>Error: {error}</p>
            <button onClick={handleReconnect}>Reconnect</button>
          </div>
        )}
      </div>
    );
  };
};

module.exports = {
  basicSocketSetup,
  chatNamespaceExample,
  orderNamespaceExample,
  reactHookExample,
  serverSideExample,
  apiRouteIntegration,
  eventStructures,
  errorHandlingExample
};
