/**
 * Universal Image Picker Component
 * Works on both mobile and web platforms
 */

import React from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { showUniversalImagePicker, processImageForUpload } from '../services/webImageService';

export const useUniversalImagePicker = () => {
  const pickImage = async (options = {}) => {
    try {
      if (Platform.OS === 'web') {
        // Use web-compatible picker
        const result = await showUniversalImagePicker();
        if (result) {
          return await processImageForUpload(result);
        }
        return null;
      } else {
        // Use native picker for mobile
        return await showNativeImagePicker(options);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
      return null;
    }
  };

  const showNativeImagePicker = async (options = {}) => {
    return new Promise((resolve) => {
      Alert.alert(
        'Selecionar Imagem',
        'Escolha uma opção:',
        [
          { text: 'Câmera', onPress: () => handleCamera(resolve, options) },
          { text: 'Galeria', onPress: () => handleGallery(resolve, options) },
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });
  };

  const handleCamera = async (resolve, options) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de acesso à câmera para tirar fotos.',
          [{ text: 'OK' }]
        );
        resolve(null);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [1, 1],
        quality: options.quality || 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        resolve(result.assets[0]);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      resolve(null);
    }
  };

  const handleGallery = async (resolve, options) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de acesso à galeria para selecionar fotos.',
          [{ text: 'OK' }]
        );
        resolve(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [1, 1],
        quality: options.quality || 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        resolve(result.assets[0]);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      resolve(null);
    }
  };

  return { pickImage };
};

export default useUniversalImagePicker;