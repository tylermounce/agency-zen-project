import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadOptions {
  bucket?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const {
    bucket = 'message-attachments',
    maxSizeInMB = 10,
    allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx']
  } = options;

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    const maxSize = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    // Check file type if specified
    if (allowedTypes.length > 0) {
      const isValidType = allowedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });
      
      if (!isValidType) {
        return `File type not allowed. Supported types: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  }, [maxSizeInMB, allowedTypes]);

  const uploadFile = useCallback(async (file: File, folder = '') => {
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUploadProgress(100);

      return {
        path: data.path,
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [bucket, validateFile]);

  return {
    uploadFile,
    uploading,
    uploadProgress,
    validateFile
  };
};