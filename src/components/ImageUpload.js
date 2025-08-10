'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ImageUpload = ({ 
  onImagesUploaded, 
  maxFiles = 10, 
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  className = '',
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState([]);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (disabled || uploading) return;

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        const error = file.errors[0];
        if (error.code === 'file-too-large') {
          return `${file.file.name}: ${t('upload.fileTooLarge')}`;
        }
        if (error.code === 'file-invalid-type') {
          return `${file.file.name}: ${t('upload.invalidType')}`;
        }
        return `${file.file.name}: ${error.message}`;
      });
      setUploadErrors(errors);
      return;
    }

    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});
    setUploadErrors([]);

    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        if (onImagesUploaded) {
          onImagesUploaded(result.images);
        }
        setUploadProgress({});
      } else {
        setUploadErrors([result.error || t('upload.uploadFailed')]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadErrors([t('upload.networkError')]);
    } finally {
      setUploading(false);
    }
  }, [onImagesUploaded, uploading, disabled, t]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    maxFiles,
    maxSize,
    disabled: disabled || uploading
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject ? 'border-green-500 bg-green-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {uploading ? t('upload.uploading') : t('upload.title')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isDragActive 
                ? t('upload.dropHere') 
                : t('upload.dragDropOrClick')
              }
            </p>
          </div>

          <div className="text-xs text-gray-400">
            <p>{t('upload.supportedFormats')}: JPG, PNG, WebP, GIF</p>
            <p>{t('upload.maxSize')}: {formatFileSize(maxSize)}</p>
            <p>{t('upload.maxFiles')}: {maxFiles}</p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">{t('upload.processing')}</span>
          </div>
        </div>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-red-800">{t('upload.errors')}</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {uploadErrors.map((error, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
