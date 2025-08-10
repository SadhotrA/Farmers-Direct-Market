const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image with optimizations
const uploadImage = async (file, options = {}) => {
  try {
    const uploadOptions = {
      folder: 'farmerdm',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 800, height: 600, crop: 'limit' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete image by public_id
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      message: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate optimized image URL with transformations
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    width: 400,
    height: 300,
    crop: 'fill'
  };

  const transformation = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, { transformation: [transformation] });
};

// Generate thumbnail URL
const getThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 150, height: 150, crop: 'fill', quality: 'auto:good' }
    ]
  });
};

// Generate medium size URL
const getMediumUrl = (publicId) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }
    ]
  });
};

// Generate large size URL
const getLargeUrl = (publicId) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 800, height: 600, crop: 'limit', quality: 'auto:good' }
    ]
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl,
  getThumbnailUrl,
  getMediumUrl,
  getLargeUrl
};
