import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { authenticateToken } from '../../../lib/auth';
import { uploadSingle, uploadMultiple, handleUploadError, bufferToBase64 } from '../../../lib/upload';
import { uploadImage, getThumbnailUrl, getMediumUrl, getLargeUrl } from '../../../lib/cloudinary';

// Helper function to handle multer with Next.js
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export async function POST(request) {
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

    // Create a mock req/res object for multer
    const req = {
      headers: Object.fromEntries(request.headers.entries()),
      body: {},
      files: [],
      file: null
    };

    const res = {
      status: (code) => ({
        json: (data) => {
          throw new Error(JSON.stringify({ status: code, data }));
        }
      })
    };

    // Check if it's a multipart form data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('images') || formData.getAll('image');
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const uploadedImages = [];
    const errors = [];

    // Process each file
    for (const file of files) {
      if (!file || !(file instanceof File)) {
        errors.push('Invalid file object');
        continue;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${file.name} has invalid type. Only images are allowed.`);
        continue;
      }

      try {
        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const base64Data = bufferToBase64(Buffer.from(buffer));

        // Upload to Cloudinary
        const uploadResult = await uploadImage(base64Data, {
          folder: `farmerdm/${authResult.user._id}`,
          public_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`
        });

        if (uploadResult.success) {
          // Generate different sizes
          const thumbnailUrl = getThumbnailUrl(uploadResult.public_id);
          const mediumUrl = getMediumUrl(uploadResult.public_id);
          const largeUrl = getLargeUrl(uploadResult.public_id);

          uploadedImages.push({
            originalName: file.name,
            url: uploadResult.url,
            public_id: uploadResult.public_id,
            thumbnail: thumbnailUrl,
            medium: mediumUrl,
            large: largeUrl,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            size: uploadResult.size
          });
        } else {
          errors.push(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }
      } catch (error) {
        console.error('File upload error:', error);
        errors.push(`Error uploading ${file.name}: ${error.message}`);
      }
    }

    // Return response
    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No files were uploaded successfully',
          details: errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} file(s)`,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload API error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
