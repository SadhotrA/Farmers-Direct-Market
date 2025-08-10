'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatSocket } from '@/hooks/useSocket';

const ChatComponent = ({ chatId, token, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  const { 
    isConnected, 
    emit, 
    on, 
    off, 
    joinRoom, 
    leaveRoom 
  } = useChatSocket(token);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join chat room when component mounts
  useEffect(() => {
    if (isConnected && chatId) {
      joinRoom(chatId);
    }
  }, [isConnected, chatId, joinRoom]);

  // Leave chat room when component unmounts
  useEffect(() => {
    return () => {
      if (chatId) {
        leaveRoom(chatId);
      }
    };
  }, [chatId, leaveRoom]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
    };

    // Listen for typing indicators
    const handleTypingStart = (data) => {
      if (data.userId !== currentUser._id) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      }
    };

    const handleTypingStop = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    // Listen for read receipts
    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg._id) 
          ? { ...msg, readBy: [...(msg.readBy || []), data.readBy] }
          : msg
      ));
    };

    on('message:new', handleNewMessage);
    on('typing:start', handleTypingStart);
    on('typing:stop', handleTypingStop);
    on('message:read', handleMessageRead);

    return () => {
      off('message:new', handleNewMessage);
      off('typing:start', handleTypingStart);
      off('typing:stop', handleTypingStop);
      off('message:read', handleMessageRead);
    };
  }, [isConnected, on, off, currentUser._id]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newMessage,
          messageType: 'text'
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Stop typing indicator
        emit('typing:stop', chatId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        emit('typing:start', chatId);
      }
    } else {
      if (isTyping) {
        setIsTyping(false);
        emit('typing:stop', chatId);
      }
    }
  };

  // Mark messages as read
  const markAsRead = () => {
    const unreadMessages = messages.filter(msg => 
      !msg.readBy?.includes(currentUser._id) && msg.sender !== currentUser._id
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      emit('message:read', { chatId, messageIds });
    }
  };

  // Auto-mark as read when messages are visible
  useEffect(() => {
    const timeout = setTimeout(markAsRead, 1000);
    return () => clearTimeout(timeout);
  }, [messages]);

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-semibold">Chat Room</span>
        </div>
        <div className="text-sm text-gray-500">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={message._id || index}
            className={`flex ${message.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.sender === currentUser._id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-75 mt-1">
                {new Date(message.at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-3 py-2 rounded-lg">
              <p className="text-sm text-gray-600">
                {typingUsers.map(u => u.userName).join(', ')} typing...
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
