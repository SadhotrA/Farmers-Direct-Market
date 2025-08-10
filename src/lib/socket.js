const { Server } = require('socket.io');
const { verifyToken } = require('./auth');
const { User } = require('../models');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Middleware for authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Invalid or expired token'));
        }

        // Get user from database
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.setupNamespaces();
    this.setupGlobalEvents();
  }

  setupNamespaces() {
    // Chat namespace
    const chatNamespace = this.io.of('/chat');
    chatNamespace.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected to chat namespace`);
      
      // Store user connection
      this.connectedUsers.set(socket.user._id.toString(), socket.id);
      
      // Join user's personal room for notifications
      socket.join(`user:${socket.user._id}`);
      
      // Handle joining chat rooms
      socket.on('join:chat', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.user.name} joined chat ${chatId}`);
      });
      
      // Handle leaving chat rooms
      socket.on('leave:chat', (chatId) => {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${socket.user.name} left chat ${chatId}`);
      });
      
      // Handle new message
      socket.on('message:new', (data) => {
        const { chatId, message } = data;
        
        // Emit to chat room (excluding sender)
        socket.to(`chat:${chatId}`).emit('message:new', {
          chatId,
          message,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            profileImage: socket.user.profileImage
          }
        });
        
        console.log(`New message in chat ${chatId} from ${socket.user.name}`);
      });
      
      // Handle typing indicators
      socket.on('typing:start', (chatId) => {
        socket.to(`chat:${chatId}`).emit('typing:start', {
          chatId,
          userId: socket.user._id,
          userName: socket.user.name
        });
      });
      
      socket.on('typing:stop', (chatId) => {
        socket.to(`chat:${chatId}`).emit('typing:stop', {
          chatId,
          userId: socket.user._id
        });
      });
      
      // Handle read receipts
      socket.on('message:read', (data) => {
        const { chatId, messageIds } = data;
        
        socket.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          messageIds,
          readBy: socket.user._id,
          readAt: new Date()
        });
      });
      
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.user._id.toString());
        console.log(`User ${socket.user.name} disconnected from chat namespace`);
      });
    });

    // Order namespace
    const orderNamespace = this.io.of('/order');
    orderNamespace.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected to order namespace`);
      
      // Join user's personal room for order notifications
      socket.join(`user:${socket.user._id}`);
      
      // Handle joining order rooms
      socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
        console.log(`User ${socket.user.name} joined order ${orderId}`);
      });
      
      // Handle leaving order rooms
      socket.on('leave:order', (orderId) => {
        socket.leave(`order:${orderId}`);
        console.log(`User ${socket.user.name} left order ${orderId}`);
      });
      
      // Handle order status updates
      socket.on('order:update', (data) => {
        const { orderId, status, note } = data;
        
        // Emit to order room (excluding sender)
        socket.to(`order:${orderId}`).emit('order:update', {
          orderId,
          status,
          note,
          updatedBy: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          },
          updatedAt: new Date()
        });
        
        console.log(`Order ${orderId} status updated to ${status} by ${socket.user.name}`);
      });
      
      // Handle order delivery confirmation
      socket.on('order:delivered', (data) => {
        const { orderId, deliveryNote } = data;
        
        // Emit to order room
        socket.to(`order:${orderId}`).emit('order:delivered', {
          orderId,
          deliveryNote,
          deliveredBy: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          },
          deliveredAt: new Date()
        });
        
        console.log(`Order ${orderId} marked as delivered by ${socket.user.name}`);
      });
      
      // Handle order cancellation
      socket.on('order:cancelled', (data) => {
        const { orderId, reason } = data;
        
        socket.to(`order:${orderId}`).emit('order:cancelled', {
          orderId,
          reason,
          cancelledBy: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          },
          cancelledAt: new Date()
        });
        
        console.log(`Order ${orderId} cancelled by ${socket.user.name}`);
      });
      
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected from order namespace`);
      });
    });
  }

  setupGlobalEvents() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected to global namespace`);
      
      // Handle user online status
      socket.on('user:online', () => {
        this.connectedUsers.set(socket.user._id.toString(), socket.id);
        socket.broadcast.emit('user:online', {
          userId: socket.user._id,
          name: socket.user.name
        });
      });
      
      // Handle user offline status
      socket.on('user:offline', () => {
        this.connectedUsers.delete(socket.user._id.toString());
        socket.broadcast.emit('user:offline', {
          userId: socket.user._id,
          name: socket.user.name
        });
      });
      
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.user._id.toString());
        socket.broadcast.emit('user:offline', {
          userId: socket.user._id,
          name: socket.user.name
        });
        console.log(`User ${socket.user.name} disconnected from global namespace`);
      });
    });
  }

  // Utility methods for server-side emissions
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToChat(chatId, event, data) {
    this.io.of('/chat').to(`chat:${chatId}`).emit(event, data);
  }

  emitToOrder(orderId, event, data) {
    this.io.of('/order').to(`order:${orderId}`).emit(event, data);
  }

  emitToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users list
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

// Create singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;
