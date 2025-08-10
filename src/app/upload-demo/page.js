'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageUpload from '../../components/ImageUpload';
import ImageGallery from '../../components/ImageGallery';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function UploadDemoPage() {
  const { t } = useTranslation();
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleImagesUploaded = (newImages) => {
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleImageDelete = (publicId) => {
    setUploadedImages(prev => prev.filter(img => img.public_id !== publicId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-green-600">FarmDirect</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                {t('navigation.home')}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Image Upload Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the image upload functionality with drag-and-drop, multiple file support, 
            and automatic image optimization using Cloudinary.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Images
              </h2>
              <ImageUpload
                onImagesUploaded={handleImagesUploaded}
                maxFiles={10}
                maxSize={5 * 1024 * 1024} // 5MB
                className="mb-4"
              />
              
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Drag & drop or click to select</li>
                  <li>Multiple file upload (up to 10 images)</li>
                  <li>File size validation (max 5MB)</li>
                  <li>Image format validation (JPG, PNG, WebP, GIF)</li>
                  <li>Automatic image optimization</li>
                  <li>Multiple size generation (thumbnail, medium, large)</li>
                  <li>Progress indicators and error handling</li>
                </ul>
              </div>
            </div>

            {/* API Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                API Endpoints
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-mono text-green-600">POST /api/uploads</p>
                  <p className="text-gray-600">Upload images to Cloudinary</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-mono text-red-600">DELETE /api/uploads/delete</p>
                  <p className="text-gray-600">Delete image from Cloudinary</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Image Gallery
              </h2>
              <ImageGallery
                images={uploadedImages}
                onImageDelete={handleImageDelete}
                showDelete={true}
                showReorder={false}
                maxImages={12}
              />
              
              {uploadedImages.length > 0 && (
                <div className="mt-4 text-sm text-gray-500">
                  <p><strong>Gallery Features:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Thumbnail grid view</li>
                    <li>Click to view full size</li>
                    <li>Delete individual images</li>
                    <li>Image metadata display</li>
                    <li>Responsive design</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Image Data Structure */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Image Data Structure
              </h3>
              <div className="bg-gray-50 p-4 rounded text-sm font-mono">
                <pre className="text-xs overflow-x-auto">
{`{
  "url": "https://res.cloudinary.com/...",
  "public_id": "farmerdm/user_id/filename",
  "thumbnail": "https://res.cloudinary.com/...",
  "medium": "https://res.cloudinary.com/...",
  "large": "https://res.cloudinary.com/...",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "size": 1024000,
  "originalName": "product-image.jpg"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How to Use
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Upload Images</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Drag and drop images onto the upload area</li>
                <li>Or click to select files from your device</li>
                <li>Supported formats: JPG, PNG, WebP, GIF</li>
                <li>Maximum file size: 5MB per image</li>
                <li>Maximum files: 10 images per upload</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. View & Manage</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Images are automatically optimized and resized</li>
                <li>Click on any image to view full size</li>
                <li>Hover over images to see delete button</li>
                <li>Images are stored securely on Cloudinary</li>
                <li>Multiple sizes generated for different use cases</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Environment Setup */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Environment Setup Required
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>To use this functionality, you need to set up Cloudinary environment variables:</p>
            <div className="bg-blue-100 p-3 rounded font-mono text-xs">
              <p>CLOUDINARY_CLOUD_NAME=your_cloud_name</p>
              <p>CLOUDINARY_API_KEY=your_api_key</p>
              <p>CLOUDINARY_API_SECRET=your_api_secret</p>
            </div>
            <p className="mt-2">
              <a 
                href="https://cloudinary.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Get a free Cloudinary account →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
