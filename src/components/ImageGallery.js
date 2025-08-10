'use client';

import { useState } from 'react';
import { X, ZoomIn, Trash2, Move } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ImageGallery = ({ 
  images = [], 
  onImageDelete, 
  onReorder,
  showDelete = true,
  showReorder = false,
  className = '',
  maxImages = 10 
}) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  const handleDelete = async (image) => {
    if (!onImageDelete || deletingImage) return;

    setDeletingImage(image.public_id);

    try {
      const response = await fetch('/api/uploads/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ public_id: image.public_id })
      });

      const result = await response.json();

      if (result.success) {
        onImageDelete(image.public_id);
      } else {
        console.error('Delete failed:', result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingImage(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-gray-400" />
        </div>
        <p>{t('gallery.noImages')}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.slice(0, maxImages).map((image, index) => (
          <div
            key={image.public_id}
            className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
          >
            {/* Image */}
            <img
              src={image.thumbnail}
              alt={image.originalName}
              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => setSelectedImage(image)}
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedImage(image)}
                  className="p-2 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all"
                  title={t('gallery.view')}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {showReorder && (
                <button
                  className="p-1 bg-white bg-opacity-90 rounded text-gray-700 hover:bg-opacity-100 transition-all"
                  title={t('gallery.reorder')}
                >
                  <Move className="w-3 h-3" />
                </button>
              )}
              
              {showDelete && (
                <button
                  onClick={() => handleDelete(image)}
                  disabled={deletingImage === image.public_id}
                  className="p-1 bg-red-500 bg-opacity-90 rounded text-white hover:bg-opacity-100 transition-all disabled:opacity-50"
                  title={t('gallery.delete')}
                >
                  {deletingImage === image.public_id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="truncate">{image.originalName}</p>
              <p>{formatFileSize(image.size)} • {image.width}×{image.height}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Image Counter */}
      {images.length > maxImages && (
        <div className="text-center text-sm text-gray-500">
          {t('gallery.showing')} {maxImages} {t('gallery.of')} {images.length} {t('gallery.images')}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={selectedImage.large}
              alt={selectedImage.originalName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Image Details */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
              <h3 className="font-medium">{selectedImage.originalName}</h3>
              <div className="text-sm text-gray-300 mt-1">
                <p>{formatFileSize(selectedImage.size)} • {selectedImage.width}×{selectedImage.height} • {selectedImage.format.toUpperCase()}</p>
                <p>{t('gallery.uploaded')}: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
