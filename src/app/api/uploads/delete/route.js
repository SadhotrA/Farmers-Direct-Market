import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { authenticateToken } from '../../../../lib/auth';
import { deleteImage } from '../../../../lib/cloudinary';

export async function DELETE(request) {
  try {
    // Connect to database
    await connectDB();

    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get public_id from request body
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    const deleteResult = await deleteImage(public_id);

    if (deleteResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
        public_id: public_id
      });
    } else {
      return NextResponse.json(
        { success: false, error: deleteResult.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Delete image API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
