const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  attachments: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid attachment URL'
    }
  }],
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'location'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  at: {
    type: Date,
    default: Date.now
  }
});

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Participant is required']
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: mongoose.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  chatType: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  chatName: {
    type: String,
    trim: true,
    maxlength: [100, 'Chat name cannot exceed 100 characters']
  },
  chatImage: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid chat image URL'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ChatSchema.index({ participants: 1 });
ChatSchema.index({ 'messages.at': -1 });
ChatSchema.index({ updatedAt: -1 });
ChatSchema.index({ isActive: 1 });

// Compound index for unique chat between two participants
ChatSchema.index({ participants: 1, chatType: 1 }, { unique: true });

// Update the updatedAt field before saving
ChatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a message to the chat
ChatSchema.methods.addMessage = function(senderId, text, attachments = [], messageType = 'text') {
  const message = {
    sender: senderId,
    text,
    attachments,
    messageType,
    at: new Date()
  };
  
  this.messages.push(message);
  this.lastMessage = message._id;
  
  // Update unread count for other participants
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to mark messages as read for a user
ChatSchema.methods.markAsRead = function(userId) {
  const now = new Date();
  
  // Mark unread messages as read
  this.messages.forEach(message => {
    if (!message.isRead && message.sender.toString() !== userId.toString()) {
      message.isRead = true;
      message.readAt = now;
    }
  });
  
  // Reset unread count for this user
  this.unreadCount.set(userId.toString(), 0);
  
  return this.save();
};

// Method to get unread count for a user
ChatSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Static method to find or create chat between two users
ChatSchema.statics.findOrCreateChat = async function(user1Id, user2Id) {
  const participants = [user1Id, user2Id].sort();
  
  let chat = await this.findOne({
    participants: { $all: participants },
    chatType: 'direct'
  });
  
  if (!chat) {
    chat = new this({
      participants,
      chatType: 'direct'
    });
    await chat.save();
  }
  
  return chat;
};

// Virtual for last message text
ChatSchema.virtual('lastMessageText').get(function() {
  if (this.messages.length === 0) return '';
  const lastMsg = this.messages[this.messages.length - 1];
  return lastMsg.text.length > 50 ? lastMsg.text.substring(0, 50) + '...' : lastMsg.text;
});

// Virtual for participant names (excluding current user)
ChatSchema.virtual('otherParticipantName').get(function() {
  // This would need to be populated when querying
  return this.chatName || 'Unknown User';
});

// Ensure virtual fields are serialized
ChatSchema.set('toJSON', { virtuals: true });
ChatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
