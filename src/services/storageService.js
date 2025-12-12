/**
 * Storage Service - Gerenciamento de upload de imagens para Supabase Storage
 */

import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

// Helper function to decode base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const StorageService = {
  /**
   * Upload de imagem genérica
   */
  async uploadImage(imageUri, bucket, path) {
    try {
      if (!imageUri) {
        throw new Error('URI da imagem é obrigatório');
      }

      console.log(`[StorageService] Iniciando upload para bucket: ${bucket}, path: ${path}`);

      // Ler o arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(`[StorageService] Arquivo lido, tamanho base64: ${base64.length}`);

      // Determinar o tipo de arquivo
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      // Converter base64 para Uint8Array
      const arrayBuffer = base64ToArrayBuffer(base64);

      console.log(`[StorageService] ArrayBuffer criado, tamanho: ${arrayBuffer.length}`);

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, arrayBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error('[StorageService] Erro no upload:', error);
        console.error('[StorageService] Código do erro:', error.statusCode);
        console.error('[StorageService] Mensagem:', error.message);
        throw error;
      }

      console.log('[StorageService] Upload concluído com sucesso:', data);

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log('[StorageService] URL pública:', publicUrlData.publicUrl);

      return {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
        fullPath: data.fullPath
      };
    } catch (error) {
      console.error('[StorageService] Erro no upload de imagem:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  },

  /**
   * Upload de imagem de planta
   */
  async uploadPlantImage(imageUri, userId) {
    const timestamp = Date.now();
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `plant_${userId}_${timestamp}.${fileExt}`;
    const path = `plants/${userId}/${fileName}`;

    return await this.uploadImage(imageUri, 'plant-images', path);
  },

  /**
   * Upload de imagem de post
   */
  async uploadPostImage(imageUri, userId) {
    const timestamp = Date.now();
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `post_${userId}_${timestamp}.${fileExt}`;
    const path = `posts/${userId}/${fileName}`;

    return await this.uploadImage(imageUri, 'post-images', path);
  },

  /**
   * Upload de avatar do usuário
   */
  async uploadAvatar(imageUri, userId) {
    const timestamp = Date.now();
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `avatar_${userId}_${timestamp}.${fileExt}`;
    const path = `avatars/${fileName}`;

    return await this.uploadImage(imageUri, 'avatars', path);
  },

  /**
   * Deletar imagem
   */
  async deleteImage(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Erro ao deletar imagem:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw new Error(`Falha ao deletar: ${error.message}`);
    }
  },

  /**
   * Obter URL pública de uma imagem
   */
  getPublicUrl(bucket, path) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao obter URL pública:', error);
      throw new Error(`Falha ao obter URL: ${error.message}`);
    }
  },

  /**
   * Listar imagens de um usuário
   */
  async listUserImages(bucket, userId) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(userId, {
          limit: 100,
          offset: 0
        });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar imagens:', error);
      throw new Error(`Falha ao listar: ${error.message}`);
    }
  }
};

export default StorageService;