/**
 * Web Test Component
 * Component to test web functionality
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useUniversalImagePicker } from './UniversalImagePicker';
import { colors } from '../theme/colors';

const WebTestComponent = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const { pickImage } = useUniversalImagePicker();

  const handleImagePick = async () => {
    try {
      const result = await pickImage({
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result && result.uri) {
        setSelectedImage(result);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Erro ao selecionar imagem');
    }
  };

  if (Platform.OS !== 'web') {
    return null; // Only show on web
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Teste Web - Upload de Imagens</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleImagePick}>
        <Text style={styles.buttonText}>📷 Selecionar Imagem</Text>
      </TouchableOpacity>

      {selectedImage && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageInfo}>✅ Imagem selecionada:</Text>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
          <Text style={styles.imageDetails}>
            Tipo: {selectedImage.type || 'N/A'}{'\n'}
            Tamanho: {selectedImage.size ? `${Math.round(selectedImage.size / 1024)}KB` : 'N/A'}
          </Text>
          
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.clearButtonText}>🗑️ Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>ℹ️ Funcionalidades Web:</Text>
        <Text style={styles.infoText}>
          • Upload de arquivos via File API{'\n'}
          • Captura de câmera via getUserMedia{'\n'}
          • Preview de imagens{'\n'}
          • Conversão para base64{'\n'}
          • Compatível com todos os navegadores modernos
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.botanical.base,
    margin: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.botanical.sage,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.botanical.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.botanical.dark,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageInfo: {
    fontSize: 14,
    color: colors.botanical.dark,
    marginBottom: 10,
    fontWeight: '600',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageDetails: {
    fontSize: 12,
    color: colors.botanical.sage,
    textAlign: 'center',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: colors.accent.terracotta,
    padding: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
  },
  info: {
    backgroundColor: colors.ui.background,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.botanical.dark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.botanical.sage,
    lineHeight: 18,
  },
});

export default WebTestComponent;