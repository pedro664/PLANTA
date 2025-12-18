import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Permissions utility for EduCultivo
 * Handles camera and gallery permissions with user-friendly alerts
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

/**
 * Request camera permission with explanatory alert
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestCameraPermission = async () => {
  try {
    // First, show explanatory message before requesting permission (Requirement 10.3)
    const shouldRequest = await new Promise((resolve) => {
      Alert.alert(
        'Acesso à Câmera',
        'O EduCultivo precisa de acesso à câmera para que você possa fotografar suas plantas e acompanhar seu crescimento.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Permitir',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });

    if (!shouldRequest) {
      return false;
    }

    // Request the actual permission (Requirement 10.1)
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status === 'granted') {
      return true;
    }

    // Handle permission denied (Requirement 10.4, 10.5)
    if (status === 'denied') {
      Alert.alert(
        'Permissão Negada',
        'Você pode adicionar plantas sem foto ou alterar as permissões nas configurações do dispositivo.',
        [
          { text: 'Continuar sem foto', style: 'cancel' },
          { 
            text: 'Abrir Configurações', 
            onPress: openAppSettings
          }
        ]
      );
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    Alert.alert(
      'Erro',
      'Não foi possível solicitar permissão da câmera. Tente novamente.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Request gallery/media library permission with explanatory alert
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestGalleryPermission = async () => {
  try {
    // First, show explanatory message before requesting permission (Requirement 10.3)
    const shouldRequest = await new Promise((resolve) => {
      Alert.alert(
        'Acesso à Galeria',
        'O EduCultivo precisa de acesso à sua galeria de fotos para que você possa escolher imagens das suas plantas.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Permitir',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });

    if (!shouldRequest) {
      return false;
    }

    // Request the actual permission (Requirement 10.2)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status === 'granted') {
      return true;
    }

    // Handle permission denied (Requirement 10.4, 10.5)
    if (status === 'denied') {
      Alert.alert(
        'Permissão Negada',
        'Você pode adicionar plantas sem foto ou alterar as permissões nas configurações do dispositivo.',
        [
          { text: 'Continuar sem foto', style: 'cancel' },
          { 
            text: 'Abrir Configurações', 
            onPress: openAppSettings
          }
        ]
      );
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting gallery permission:', error);
    Alert.alert(
      'Erro',
      'Não foi possível solicitar permissão da galeria. Tente novamente.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Check if camera permission is already granted
 * @returns {Promise<boolean>} - True if permission is granted
 */
export const checkCameraPermission = async () => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Check if gallery permission is already granted
 * @returns {Promise<boolean>} - True if permission is granted
 */
export const checkGalleryPermission = async () => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking gallery permission:', error);
    return false;
  }
};

/**
 * Open device settings for the app (Requirement 10.5)
 * Handles both iOS and Android
 */
export const openAppSettings = () => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Open app-specific settings
      Linking.openURL('app-settings:');
    } else {
      // Android: Open general settings (will navigate to app settings)
      Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening app settings:', error);
    Alert.alert(
      'Erro',
      'Não foi possível abrir as configurações. Por favor, abra manualmente as configurações do dispositivo.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Request both camera and gallery permissions
 * Useful for initial app setup
 * @returns {Promise<{camera: boolean, gallery: boolean}>} - Permission status for both
 */
export const requestAllImagePermissions = async () => {
  const cameraGranted = await requestCameraPermission();
  const galleryGranted = await requestGalleryPermission();
  
  return {
    camera: cameraGranted,
    gallery: galleryGranted,
  };
};

/**
 * Check both camera and gallery permissions
 * @returns {Promise<{camera: boolean, gallery: boolean}>} - Permission status for both
 */
export const checkAllImagePermissions = async () => {
  const cameraGranted = await checkCameraPermission();
  const galleryGranted = await checkGalleryPermission();
  
  return {
    camera: cameraGranted,
    gallery: galleryGranted,
  };
};

/**
 * Show permission denied message with options (Requirement 10.4)
 * @param {string} permissionType - 'camera' or 'gallery'
 */
export const showPermissionDeniedAlert = (permissionType = 'camera') => {
  const permissionName = permissionType === 'camera' ? 'câmera' : 'galeria';
  
  Alert.alert(
    'Permissão Necessária',
    `Para usar esta funcionalidade, você precisa permitir o acesso à ${permissionName} nas configurações do dispositivo.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Abrir Configurações', 
        onPress: openAppSettings
      }
    ]
  );
};

/**
 * Handle permission request with retry logic
 * @param {string} permissionType - 'camera' or 'gallery'
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestPermissionWithRetry = async (permissionType = 'camera', maxRetries = 2) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    let granted = false;
    
    if (permissionType === 'camera') {
      granted = await requestCameraPermission();
    } else if (permissionType === 'gallery') {
      granted = await requestGalleryPermission();
    }
    
    if (granted) {
      return true;
    }
    
    attempts++;
    
    // If not the last attempt, show retry option
    if (attempts < maxRetries) {
      const shouldRetry = await new Promise((resolve) => {
        Alert.alert(
          'Tentar Novamente?',
          `Não foi possível obter permissão para ${permissionType === 'camera' ? 'câmera' : 'galeria'}. Deseja tentar novamente?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Tentar Novamente', onPress: () => resolve(true) }
          ]
        );
      });
      
      if (!shouldRetry) {
        break;
      }
    }
  }
  
  return false;
};

/**
 * Permission status constants
 */
export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
};

/**
 * Permission types constants
 */
export const PERMISSION_TYPES = {
  CAMERA: 'camera',
  GALLERY: 'gallery',
};