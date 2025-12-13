/**
 * Upload Service para Supabase Storage
 * Otimizado para funcionar com fotos reais do celular (Android/iOS)
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Configuração dos buckets de storage
const STORAGE_BUCKETS = {
  PLANTS: 'plant-images',
  POSTS: 'post-images',
  AVATARS: 'avatars'
};

/**
 * Converte imagem para formato pronto para upload
 * Funciona com:
 * - URI local (camera/galeria do celular)
 * - Blob (web)
 * - Base64
 */
const prepareImageForUpload = async (imageResult) => {
  if (!imageResult) return null;

  try {
    console.log('🔍 Preparando imagem para upload...', {
      hasUri: !!imageResult.uri,
      hasFile: !!imageResult.file,
      hasBase64: !!imageResult.base64,
      platform: Platform.OS,
    });

    // Para web
    if (Platform.OS === 'web') {
      // File object direto (web)
      if (imageResult.file instanceof File) {
        return {
          file: imageResult.file,
          type: imageResult.file.type || 'image/jpeg',
          name: imageResult.file.name || `image_${Date.now()}.jpg`
        };
      }
      
      // Blob (web)
      if (imageResult instanceof Blob) {
        return {
          file: imageResult,
          type: imageResult.type || 'image/jpeg',
          name: `image_${Date.now()}.jpg`
        };
      }
      
      // Base64 (web)
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
          name: `image_${Date.now()}.jpg`
        };
      }
    } else {
      // Para mobile (Android/iOS) - usar URI local
      if (!imageResult.uri) {
        throw new Error('URI da imagem não encontrada. Selecione uma foto novamente.');
      }

      console.log('📱 Processando imagem mobile:', imageResult.uri);

      // Ler arquivo do sistema de arquivos
      let fileData;
      
      try {
        // Tentar ler como base64 primeiro
        fileData = await FileSystem.readAsStringAsync(imageResult.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('✅ Arquivo lido com sucesso. Tamanho base64:', fileData.length);
      } catch (readError) {
        console.error('❌ Erro ao ler arquivo:', readError);
        // Se falhar, tentar alternativa
        throw new Error(`Não consegui ler a foto: ${readError.message}`);
      }

      // Converter base64 para blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      console.log('📦 Blob criado. Tamanho:', blob.size, 'bytes');

      return {
        file: blob,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
        size: blob.size,
        uri: imageResult.uri
      };
    }
  } catch (error) {
    console.error('❌ Erro ao preparar imagem:', error);
    throw new Error(`Erro ao preparar imagem para upload: ${error.message}`);
  }
};

/**
 * Faz upload de imagem para Supabase Storage
 * Otimizado para mobile e web
 */
export const uploadImage = async (imageResult, bucket, folder = '') => {
  try {
    if (!imageResult) {
      throw new Error('Nenhuma imagem fornecida');
    }

    console.log('🚀 Iniciando upload de imagem...', { bucket, folder });

    // Preparar imagem para upload
    const preparedImage = await prepareImageForUpload(imageResult);
    if (!preparedImage) {
      throw new Error('Erro ao preparar imagem. Selecione uma foto novamente.');
    }

    // Validar tamanho (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (preparedImage.file.size > MAX_SIZE) {
      throw new Error(`Imagem muito grande (máximo 10MB, você enviou ${(preparedImage.file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Gerar nome único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = 'jpg';
    const fileName = `${folder ? folder + '/' : ''}${timestamp}_${randomId}.${fileExtension}`;

    console.log('📁 Enviando arquivo:', { bucket, fileName, size: `${(preparedImage.file.size / 1024).toFixed(2)}KB` });

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, preparedImage.file, {
        contentType: 'image/jpeg',
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Erro no upload:', error);
      
      // Mensagens de erro mais específicas
      if (error.message.includes('storage object not found')) {
        throw new Error('Bucket não encontrado. Verifique as configurações de storage.');
      } else if (error.message.includes('permission')) {
        throw new Error('Sem permissão para fazer upload. Verifique as políticas de RLS.');
      }
      
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    console.log('✅ Upload bem-sucedido:', data);

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Erro ao gerar URL da imagem');
    }

    console.log('🔗 URL gerada:', urlData.publicUrl);

    return {
      path: fileName,
      url: urlData.publicUrl,
      bucket: bucket,
      size: preparedImage.file.size,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erro no serviço de upload:', error);
    throw error;
  }
};

/**
 * Upload de foto de planta
 */
export const uploadPlantImage = async (imageResult, plantId) => {
  return uploadImage(imageResult, STORAGE_BUCKETS.PLANTS, `plants/${plantId}`);
};

/**
 * Upload de foto de post
 */
export const uploadPostImage = async (imageResult, postId) => {
  return uploadImage(imageResult, STORAGE_BUCKETS.POSTS, `posts/${postId}`);
};

/**
 * Upload de avatar
 */
export const uploadAvatarImage = async (imageResult, userId) => {
  return uploadImage(imageResult, STORAGE_BUCKETS.AVATARS, `users/${userId}`);
};

/**
 * Deleta imagem do storage
 */
export const deleteImage = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('❌ Erro ao deletar:', error);
      throw error;
    }

    console.log('✅ Imagem deletada:', path);
    return true;
  } catch (error) {
    console.error('❌ Erro no delete:', error);
    throw error;
  }
};

/**
 * Substitui imagem existente
 */
export const replaceImage = async (imageResult, bucket, oldPath, folder = '') => {
  try {
    // Fazer upload da nova imagem
    const uploadResult = await uploadImage(imageResult, bucket, folder);
    
    // Deletar imagem antiga se não for URL externa
    if (oldPath && !oldPath.includes('unsplash') && !oldPath.includes('placeholder')) {
      try {
        const pathParts = oldPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        await deleteImage(bucket, `${folder}/${fileName}`);
      } catch (deleteError) {
        console.warn('⚠️ Não consegui deletar imagem antiga:', deleteError);
        // Não falhar o processo se delete falhar
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('❌ Erro ao substituir imagem:', error);
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