import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { requestCameraPermission, requestGalleryPermission } from '../utils/permissions';

// FileSystem será importado dinamicamente apenas em plataformas nativas
let FileSystem = null;
const getFileSystem = async () => {
  if (Platform.OS === 'web') return null;
  if (!FileSystem) {
    FileSystem = await import('expo-file-system/legacy');
  }
  return FileSystem;
};

/**
 * Image Service for Educultivo
 * Handles image picking, compression, and local storage
 */

// Configuration constants
const IMAGE_CONFIG = {
  quality: 0.7, // Reduced to 70% for better compression
  allowsEditing: true,
  aspect: [1, 1], // Square aspect ratio for plant photos
  maxWidth: 600, // Reduced from 800 for better performance
  maxHeight: 600,
  compressionQuality: 0.6, // Additional compression for large images
  maxFileSize: 300000, // 300KB max file size
};

let STORAGE_DIR = '';

/**
 * Ensure the images directory exists
 */
const ensureDirectoryExists = async () => {
  if (Platform.OS === 'web') return;
  const fs = await getFileSystem();
  if (!fs) return;
  
  if (!STORAGE_DIR) {
    STORAGE_DIR = `${fs.documentDirectory}images/`;
  }
  
  const dirInfo = await fs.getInfoAsync(STORAGE_DIR);
  if (!dirInfo.exists) {
    await fs.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
};

// Permission handling is now managed by the permissions utility

/**
 * Compress and resize image
 * @param {string} uri - Original image URI
 * @returns {Promise<string>} - Compressed image URI
 */
const compressImage = async (uri) => {
  try {
    // Na web, retornar URI original (compressão não suportada da mesma forma)
    if (Platform.OS === 'web') {
      return uri;
    }
    
    const fs = await getFileSystem();
    if (!fs) return uri;
    
    // Get image info
    const imageInfo = await fs.getInfoAsync(uri);
    
    // If image is already small enough, return original
    if (imageInfo.size < IMAGE_CONFIG.maxFileSize) {
      return uri;
    }

    // Use expo-image-manipulator for better compression
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
    // Calculate resize dimensions while maintaining aspect ratio
    const manipulateActions = [];
    
    // Resize if needed
    manipulateActions.push({
      resize: {
        width: IMAGE_CONFIG.maxWidth,
        height: IMAGE_CONFIG.maxHeight,
      }
    });

    // Compress the image
    const manipulatedImage = await manipulateAsync(
      uri,
      manipulateActions,
      {
        compress: IMAGE_CONFIG.compressionQuality,
        format: SaveFormat.JPEG,
        base64: false,
      }
    );

    // Check if compression was successful
    const compressedInfo = await fs.getInfoAsync(manipulatedImage.uri);
    
    // If compressed image is still too large, try more aggressive compression
    if (compressedInfo.size > IMAGE_CONFIG.maxFileSize) {
      const aggressiveCompression = await manipulateAsync(
        manipulatedImage.uri,
        [
          {
            resize: {
              width: IMAGE_CONFIG.maxWidth * 0.8,
              height: IMAGE_CONFIG.maxHeight * 0.8,
            }
          }
        ],
        {
          compress: 0.4, // More aggressive compression
          format: SaveFormat.JPEG,
          base64: false,
        }
      );
      
      return aggressiveCompression.uri;
    }

    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fallback: try basic compression without expo-image-manipulator
    try {
      const basicCompression = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: IMAGE_CONFIG.aspect,
        quality: IMAGE_CONFIG.quality,
        base64: false,
      });

      if (!basicCompression.canceled && basicCompression.assets[0]) {
        return basicCompression.assets[0].uri;
      }
    } catch (fallbackError) {
      console.error('Fallback compression also failed:', fallbackError);
    }
    
    return uri; // Return original if all compression attempts fail
  }
};

/**
 * Save image to local file system
 * @param {string} uri - Image URI to save
 * @param {string} filename - Optional filename (will generate if not provided)
 * @returns {Promise<string>} - Local file URI
 */
const saveImageToLocal = async (uri, filename = null) => {
  try {
    // Na web, retornar URI original (não há sistema de arquivos local)
    if (Platform.OS === 'web') {
      return uri;
    }
    
    const fs = await getFileSystem();
    if (!fs) return uri;
    
    await ensureDirectoryExists();
    
    // Generate filename if not provided
    const finalFilename = filename || `plant_${Date.now()}.jpg`;
    const localUri = `${STORAGE_DIR}${finalFilename}`;
    
    // Copy image to local directory
    await fs.copyAsync({
      from: uri,
      to: localUri,
    });
    
    return localUri;
  } catch (error) {
    console.error('Error saving image to local storage:', error);
    throw new Error('Falha ao salvar imagem');
  }
};

/**
 * Pick image from camera
 * @param {Object} options - Additional options for image picker
 * @returns {Promise<string|null>} - Local image URI or null if cancelled
 */
export const pickImageFromCamera = async (options = {}) => {
  try {
    // Request permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: IMAGE_CONFIG.quality,
      allowsEditing: IMAGE_CONFIG.allowsEditing,
      aspect: IMAGE_CONFIG.aspect,
      base64: false,
      ...options,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    
    // Compress image if needed
    const compressedUri = await compressImage(imageUri);
    
    // Save to local storage
    const localUri = await saveImageToLocal(compressedUri);
    
    return localUri;
  } catch (error) {
    console.error('Error picking image from camera:', error);
    Alert.alert('Erro', 'Não foi possível capturar a imagem. Tente novamente.');
    return null;
  }
};

/**
 * Pick image from gallery
 * @param {Object} options - Additional options for image picker
 * @returns {Promise<string|null>} - Local image URI or null if cancelled
 */
export const pickImageFromGallery = async (options = {}) => {
  try {
    // Request permission
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      return null;
    }

    // Launch gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: IMAGE_CONFIG.quality,
      allowsEditing: IMAGE_CONFIG.allowsEditing,
      aspect: IMAGE_CONFIG.aspect,
      base64: false,
      ...options,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    
    // Compress image if needed
    const compressedUri = await compressImage(imageUri);
    
    // Save to local storage
    const localUri = await saveImageToLocal(compressedUri);
    
    return localUri;
  } catch (error) {
    console.error('Error picking image from gallery:', error);
    Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    return null;
  }
};

/**
 * Show image picker options (Camera or Gallery)
 * @returns {Promise<string|null>} - Local image URI or null if cancelled
 */
export const showImagePickerOptions = () => {
  return new Promise((resolve) => {
    Alert.alert(
      'Adicionar Foto',
      'Escolha uma opção:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => resolve(null),
        },
        {
          text: 'Câmera',
          onPress: async () => {
            const uri = await pickImageFromCamera();
            resolve(uri);
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const uri = await pickImageFromGallery();
            resolve(uri);
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
};

/**
 * Delete image from local storage
 * @param {string} uri - Local image URI to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const deleteLocalImage = async (uri) => {
  try {
    if (Platform.OS === 'web') return false;
    const fs = await getFileSystem();
    if (!fs) return false;
    
    const fileInfo = await fs.getInfoAsync(uri);
    if (fileInfo.exists) {
      await fs.deleteAsync(uri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local image:', error);
    return false;
  }
};

/**
 * Get image info (size, dimensions, etc.)
 * @param {string} uri - Image URI
 * @returns {Promise<Object>} - Image information
 */
export const getImageInfo = async (uri) => {
  try {
    if (Platform.OS === 'web') return { exists: true, uri };
    const fs = await getFileSystem();
    if (!fs) return { exists: true, uri };
    
    const info = await fs.getInfoAsync(uri);
    return info;
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
};

/**
 * Clean up old images (optional utility function)
 * @param {number} maxAge - Maximum age in milliseconds (default: 30 days)
 * @returns {Promise<number>} - Number of files deleted
 */
export const cleanupOldImages = async (maxAge = 30 * 24 * 60 * 60 * 1000) => {
  try {
    if (Platform.OS === 'web') return 0;
    const fs = await getFileSystem();
    if (!fs) return 0;
    
    await ensureDirectoryExists();
    
    const files = await fs.readDirectoryAsync(STORAGE_DIR);
    const now = Date.now();
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = `${STORAGE_DIR}${file}`;
      const fileInfo = await fs.getInfoAsync(filePath);
      
      if (fileInfo.exists && (now - fileInfo.modificationTime) > maxAge) {
        await fs.deleteAsync(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old images:', error);
    return 0;
  }
};

// Export configuration for external use
export const imageConfig = IMAGE_CONFIG;
export const storageDirectory = STORAGE_DIR;