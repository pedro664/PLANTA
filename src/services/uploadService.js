/**
 * Upload Service for Supabase Storage
 * Handles image uploads to Supabase buckets
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';

// Storage buckets configuration
const STORAGE_BUCKETS = {
  PLANTS: 'plant-images',
  POSTS: 'post-images',
  AVATARS: 'avatars'
};

/**
 * Convert image to uploadable format
 */
const prepareImageForUpload = async (imageResult) => {
  if (!imageResult) return null;

  try {
    if (Platform.OS === 'web') {
      // For web, convert blob to file
      if (imageResult.file) {
        return {
          file: imageResult.file,
          type: imageResult.type || 'image/jpeg',
          name: imageResult.name || `image_${Date.now()}.jpg`
        };
      }
      
      // If we have base64, convert to blob
      if (imageResult.base64) {
        const byteCharacters = atob(imageResult.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: imageResult.type || 'image/jpeg' });
        
        return {
          file: blob,
          type: imageResult.type || 'image/jpeg',
          name: imageResult.name || `image_${Date.now()}.jpg`
        };
      }
    } else {
      // For mobile, use the URI directly
      const response = await fetch(imageResult.uri);
      const blob = await response.blob();
      
      return {
        file: blob,
        type: imageResult.type || 'image/jpeg',
        name: `image_${Date.now()}.jpg`
      };
    }
  } catch (error) {
    console.error('Error preparing image for upload:', error);
    throw new Error('Erro ao preparar imagem para upload');
  }
};

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (imageResult, bucket, folder = '') => {
  try {
    if (!imageResult) {
      throw new Error('Nenhuma imagem fornecida');
    }

    console.log('🔄 Starting image upload...', { bucket, folder });

    // Prepare image for upload
    const preparedImage = await prepareImageForUpload(imageResult);
    if (!preparedImage) {
      throw new Error('Erro ao preparar imagem');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = preparedImage.name.split('.').pop() || 'jpg';
    const fileName = `${folder ? folder + '/' : ''}${timestamp}_${randomId}.${fileExtension}`;

    console.log('📁 Uploading to:', { bucket, fileName });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, preparedImage.file, {
        contentType: preparedImage.type,
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    console.log('✅ Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Erro ao obter URL pública da imagem');
    }

    console.log('🔗 Public URL generated:', urlData.publicUrl);

    return {
      path: fileName,
      url: urlData.publicUrl,
      bucket: bucket
    };

  } catch (error) {
    console.error('❌ Upload service error:', error);
    throw error;
  }
};

/**
 * Upload plant image
 */
export const uploadPlantImage = async (imageResult, plantId) => {
  return uploadImage(imageResult, STORAGE_BUCKETS.PLANTS, `plants/${plantId}`);
};

/**
 * Upload post image
 */
export const uploadPostImage = async (imageResult, postId) => {
  return uploadImage(imageResult, STORAGE_BUCKETS.POSTS, `posts/${postId}`);
};

/**
 * Upload avatar image
 */
export const uploadAvatarImage = async (imageResult, userId) => {
  return uploadImage(imageResult, STORAGE_BUCKETS.AVATARS, `users/${userId}`);
};

/**
 * Delete image from storage
 */
export const deleteImage = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }

    console.log('✅ Image deleted successfully:', path);
    return true;
  } catch (error) {
    console.error('❌ Delete image error:', error);
    throw error;
  }
};

/**
 * Replace existing image
 */
export const replaceImage = async (imageResult, bucket, oldPath, folder = '') => {
  try {
    // Upload new image
    const uploadResult = await uploadImage(imageResult, bucket, folder);
    
    // Delete old image if it exists and is not a placeholder
    if (oldPath && !oldPath.includes('unsplash.com') && !oldPath.includes('placeholder')) {
      try {
        const pathParts = oldPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        await deleteImage(bucket, `${folder}/${fileName}`);
      } catch (deleteError) {
        console.warn('Could not delete old image:', deleteError);
        // Don't throw error for delete failure
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('❌ Replace image error:', error);
    throw error;
  }
};

export default {
  uploadImage,
  uploadPlantImage,
  uploadPostImage,
  uploadAvatarImage,
  deleteImage,
  replaceImage,
  STORAGE_BUCKETS
};