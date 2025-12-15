/**
 * Storage Service - Wrapper para uploadService
 * Mantido para compatibilidade com código existente
 */

import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Decodifica base64 para Uint8Array (compatível com React Native)
 */
const base64ToUint8Array = (base64String) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const base64 = base64String.replace(/[\s]/g, '');
  const len = base64.length;
  
  let bufferLength = Math.floor(len * 3 / 4);
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const c1 = base64.charCodeAt(i);
    const c2 = base64.charCodeAt(i + 1);
    const c3 = base64.charCodeAt(i + 2);
    const c4 = base64.charCodeAt(i + 3);

    const e1 = lookup[c1];
    const e2 = lookup[c2];
    const e3 = base64[i + 2] === '=' ? 0 : lookup[c3];
    const e4 = base64[i + 3] === '=' ? 0 : lookup[c4];

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (base64[i + 2] !== '=') {
      bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    }
    if (base64[i + 3] !== '=') {
      bytes[p++] = ((e3 & 3) << 6) | e4;
    }
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

      console.log(`[StorageService] Upload: bucket=${bucket}, path=${path}`);

      // Ler arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(`[StorageService] Base64 lido: ${base64.length} chars`);

      // Converter para bytes
      const bytes = base64ToUint8Array(base64);
      console.log(`[StorageService] Bytes: ${bytes.length}`);

      // Upload para Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, bytes.buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('[StorageService] Erro no upload:', error);
        throw error;
      }

      console.log('[StorageService] Upload OK:', data);

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
        fullPath: data.fullPath
      };
    } catch (error) {
      console.error('[StorageService] Erro:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  },

  /**
   * Upload de imagem de planta
   */
  async uploadPlantImage(imageUri, userId) {
    const timestamp = Date.now();
    const fileName = `plant_${userId}_${timestamp}.jpg`;
    const path = `plants/${userId}/${fileName}`;
    return await this.uploadImage(imageUri, 'plant-images', path);
  },

  /**
   * Upload de imagem de post
   */
  async uploadPostImage(imageUri, userId) {
    const timestamp = Date.now();
    const fileName = `post_${userId}_${timestamp}.jpg`;
    const path = `posts/${userId}/${fileName}`;
    return await this.uploadImage(imageUri, 'post-images', path);
  },

  /**
   * Upload de avatar do usuário
   */
  async uploadAvatar(imageUri, userId) {
    const timestamp = Date.now();
    const fileName = `avatar_${userId}_${timestamp}.jpg`;
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

      if (error) throw error;
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
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }
};

export default StorageService;
