import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Chat } from '@/models';
import { authenticateToken } from '@/lib/auth';

// GET /api/chats/:chatId - Fetch messages (paginated)
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;
    const { chatId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    // Find chat
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name profileImage')
      .populate('messages.sender', 'name profileImage');
    
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === user._id.toString()
    );
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Mark messages as read
    await chat.markAsRead(user._id);
    
    // Get paginated messages (most recent first)
    const skip = (page - 1) * limit;
    const messages = chat.messages
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(skip, skip + limit)
      .reverse(); // Show oldest first
    
    const total = chat.messages.length;
    
    return NextResponse.json({
      chat: {
        _id: chat._id,
        participants: chat.participants,
        chatType: chat.chatType,
        chatName: chat.chatName,
        chatImage: chat.chatImage,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      },
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chats/:chatId - Send message
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;
    const { chatId } = params;
    const { text, attachments, messageType } = await request.json();
    
    // Validation
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      );
    }
    
    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'Message cannot exceed 2000 characters' },
        { status: 400 }
      );
    }
    
    // Find chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === user._id.toString()
    );
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Add message to chat
    await chat.addMessage(
      user._id,
      text.trim(),
      attachments || [],
      messageType || 'text'
    );
    
    // Populate chat details
    await chat.populate([
      { path: 'participants', select: 'name profileImage' },
      { path: 'messages.sender', select: 'name profileImage' }
    ]);
    
    // Get the last message
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    // Emit real-time message to chat participants
    const socketManager = require('@/lib/socket');
    socketManager.emitToChat(chatId, 'message:new', {
      chatId,
      message: lastMessage,
      sender: {
        _id: user._id,
        name: user.name,
        profileImage: user.profileImage
      }
    });
    
    return NextResponse.json({
      message: 'Message sent successfully',
      chat: {
        _id: chat._id,
        participants: chat.participants,
        lastMessage: lastMessage
      }
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
