import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Chat, User } from '@/models';
import { authenticateToken } from '@/lib/auth';

// POST /api/chats - Create or get existing chat between participants
export async function POST(request) {
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
    const { participantId } = await request.json();
    
    // Validation
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Prevent self-chat
    if (user._id.toString() === participantId) {
      return NextResponse.json(
        { error: 'Cannot create chat with yourself' },
        { status: 400 }
      );
    }
    
    // Find or create chat
    const chat = await Chat.findOrCreateChat(user._id, participantId);
    
    // Populate participant info
    await chat.populate('participants', 'name profileImage');
    
    return NextResponse.json({
      chat
    });
    
  } catch (error) {
    console.error('Create/get chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/chats - Get user's chats
export async function GET(request) {
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    // Find chats where user is a participant
    const query = {
      participants: user._id,
      isActive: true
    };
    
    const skip = (page - 1) * limit;
    
    const chats = await Chat.find(query)
      .populate('participants', 'name profileImage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Chat.countDocuments(query);
    
    // Add unread count for each chat
    const chatsWithUnreadCount = chats.map(chat => ({
      ...chat,
      unreadCount: chat.unreadCount.get(user._id.toString()) || 0
    }));
    
    return NextResponse.json({
      chats: chatsWithUnreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
