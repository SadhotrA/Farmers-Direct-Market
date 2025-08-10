import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const useSocket = (token, namespace = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!token) {
      setError('Authentication token required');
      return;
    }

    try {
      // Create socket connection with authentication
      const socket = io(SOCKET_URL + (namespace ? `/${namespace}` : ''), {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      // Connection events
      socket.on('connect', () => {
        console.log(`Connected to ${namespace || 'global'} namespace`);
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Disconnected from ${namespace || 'global'} namespace:`, reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Socket initialization error:', err);
      setError(err.message);
    }
  }, [token, namespace]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Emit event
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, [isConnected]);

  // Listen to events
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Join room
  const joinRoom = useCallback((roomId) => {
    if (socketRef.current && isConnected) {
      const event = namespace === 'chat' ? 'join:chat' : 
                   namespace === 'order' ? 'join:order' : 
                   'join:room';
      socketRef.current.emit(event, roomId);
    }
  }, [namespace, isConnected]);

  // Leave room
  const leaveRoom = useCallback((roomId) => {
    if (socketRef.current && isConnected) {
      const event = namespace === 'chat' ? 'leave:chat' : 
                   namespace === 'order' ? 'leave:order' : 
                   'leave:room';
      socketRef.current.emit(event, roomId);
    }
  }, [namespace, isConnected]);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    connect,
    disconnect
  };
};

// Specialized hooks for different namespaces
export const useChatSocket = (token) => {
  return useSocket(token, 'chat');
};

export const useOrderSocket = (token) => {
  return useSocket(token, 'order');
};

// Hook for managing multiple socket connections
export const useMultiSocket = (token) => {
  const chatSocket = useChatSocket(token);
  const orderSocket = useOrderSocket(token);
  const globalSocket = useSocket(token);

  return {
    chat: chatSocket,
    order: orderSocket,
    global: globalSocket,
    isConnected: chatSocket.isConnected && orderSocket.isConnected && globalSocket.isConnected
  };
};
