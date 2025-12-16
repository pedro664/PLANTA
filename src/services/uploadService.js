/**
 * Upload Service para Supabase Storage
 * VERSÃO SIMPLIFICADA E ROBUSTA para Android/iOS/Web
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';

// Configuração dos buckets de storage
export const STORAGE_BUCKETS = {
  PLANTS: 'plant-images',
  POSTS: 'post-images',
  AVATARS: 'avatars',
  GROUPS: 'group-images'
};

/**
 * Decodifica base64 para Uint8Array (compatível com React Native)
 */
const base64ToUint8Array = (base64String) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  // Remover whitespace e padding
  const base64 = base64String.replace(/[\s]/g, '');
  const len = base64.length;
  
  // Calcular tamanho real (sem padding)
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

/**
 * Upload de imagem para Supabase Storage
 * @param {Object} imageData - Objeto com uri da imagem (do expo-image-picker)
 * @param {string} bucket - Nome do bucket
 * @param {string} folder - Pasta dentro do bucket
 */
export const uploadImage = async (imageData, bucket, folder = '') => {
  console.log('🚀 [uploadImage] Iniciando upload...', { bucket, folder, platform: Platform.OS });

  try {
    // Validar entrada
    if (!imageData) {
      throw new Error('Nenhuma imagem fornecida');
    }

    // Extrair URI
    const uri = imageData.uri || imageData;
    if (!uri || typeof uri !== 'string') {
      throw new Error('URI da imagem inválida');
    }

    console.log('📸 [uploadImage] URI:', uri.substring(0, 100) + '...');

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado. Faça login para enviar imagens.');
    }
    console.log('👤 [uploadImage] Usuário:', user.id);

    // Ler arquivo e converter para bytes
    let bytes;
    try {
      console.log('📖 [uploadImage] Lendo arquivo...');
      console.log('📖 [uploadImage] URI completa:', uri);
      console.log('📖 [uploadImage] Platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        // Na web, usar fetch para obter o blob da imagem
        console.log('🌐 [uploadImage] Usando método web...');
        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        bytes = new Uint8Array(arrayBuffer);
        console.log('✅ [uploadImage] Blob convertido. Tamanho:', bytes.length);
      } else {
        // Em plataformas nativas, importar e usar FileSystem dinamicamente
        console.log('📱 [uploadImage] Usando FileSystem nativo...');
        const FileSystem = await import('expo-file-system/legacy');
        
        // Verificar se o arquivo existe
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('📖 [uploadImage] File info:', JSON.stringify(fileInfo));
        
        if (!fileInfo.exists) {
          throw new Error('Arquivo não encontrado: ' + uri);
        }
        
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64Data || base64Data.length === 0) {
          throw new Error('Arquivo vazio ou não pôde ser lido');
        }
        
        console.log('✅ [uploadImage] Arquivo lido. Tamanho base64:', base64Data.length);
        
        // Converter base64 para bytes
        console.log('🔄 [uploadImage] Convertendo base64 para bytes...');
        bytes = base64ToUint8Array(base64Data);
      }
      
      console.log('✅ [uploadImage] Bytes criados:', bytes.length);
    } catch (readError) {
      console.error('❌ [uploadImage] Erro ao ler arquivo:', readError);
      console.error('❌ [uploadImage] Stack:', readError.stack);
      throw new Error(`Não foi possível ler a imagem: ${readError.message}`);
    }

    // Validar tamanho (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (bytes.length > MAX_SIZE) {
      throw new Error(`Imagem muito grande (${(bytes.length / 1024 / 1024).toFixed(2)}MB). Máximo: 10MB`);
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = folder 
      ? `${folder}/${timestamp}_${randomId}.jpg`
      : `${timestamp}_${randomId}.jpg`;

    console.log('📁 [uploadImage] Nome do arquivo:', fileName);

    // Fazer upload para Supabase
    console.log('⬆️ [uploadImage] Enviando para Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, bytes.buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [uploadImage] Erro no upload:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    console.log('✅ [uploadImage] Upload concluído:', uploadData);

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      throw new Error('Não foi possível gerar URL pública');
    }

    console.log('🔗 [uploadImage] URL pública:', publicUrl);

    return {
      url: publicUrl,
      path: fileName,
      bucket: bucket,
      size: bytes.length,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [uploadImage] ERRO FATAL:', error);
    throw error;
  }
};

/**
 * Upload de foto de planta
 */
export const uploadPlantImage = async (imageData, plantId) => {
  console.log('🌱 [uploadPlantImage] Plant ID:', plantId);
  return uploadImage(imageData, STORAGE_BUCKETS.PLANTS, `plants/${plantId}`);
};

/**
 * Upload de foto de post
 */
export const uploadPostImage = async (imageData, postId) => {
  console.log('📝 [uploadPostImage] Post ID:', postId);
  return uploadImage(imageData, STORAGE_BUCKETS.POSTS, `posts/${postId}`);
};

/**
 * Upload de avatar
 */
export const uploadAvatarImage = async (imageData, userId) => {
  console.log('👤 [uploadAvatarImage] User ID:', userId);
  return uploadImage(imageData, STORAGE_BUCKETS.AVATARS, `users/${userId}`);
};

/**
 * Upload de foto de grupo (perfil)
 */
export const uploadGroupImage = async (imageData, groupId) => {
  console.log('👥 [uploadGroupImage] Group ID:', groupId);
  return uploadImage(imageData, STORAGE_BUCKETS.GROUPS, `groups/${groupId}`);
};

/**
 * Upload de imagem de mensagem de grupo
 */
export const uploadGroupMessageImage = async (imageData, groupId, userId) => {
  console.log('💬 [uploadGroupMessageImage] Group ID:', groupId, 'User ID:', userId);
  return uploadImage(imageData, STORAGE_BUCKETS.GROUPS, `messages/${groupId}/${userId}`);
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
      console.error('❌ [deleteImage] Erro:', error);
      throw error;
    }

    console.log('✅ [deleteImage] Imagem deletada:', path);
    return true;
  } catch (error) {
    console.error('❌ [deleteImage] Erro ao deletar:', error);
    throw error;
  }
};

/**
 * Substitui imagem existente
 */
export const replaceImage = async (imageData, bucket, oldPath, folder = '') => {
  try {
    // Fazer upload da nova imagem
    const uploadResult = await uploadImage(imageData, bucket, folder);
    
    // Tentar deletar imagem antiga (não falhar se não conseguir)
    if (oldPath && !oldPath.includes('unsplash') && !oldPath.includes('placeholder')) {
      try {
        // Extrair path do URL se necessário
        let pathToDelete = oldPath;
        if (oldPath.includes('supabase.co')) {
          const urlParts = oldPath.split('/storage/v1/object/public/');
          if (urlParts[1]) {
            const bucketAndPath = urlParts[1].split('/');
            bucketAndPath.shift(); // Remove bucket name
            pathToDelete = bucketAndPath.join('/');
          }
        }
        await deleteImage(bucket, pathToDelete);
      } catch (deleteError) {
        console.warn('⚠️ [replaceImage] Não conseguiu deletar imagem antiga:', deleteError);
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('❌ [replaceImage] Erro:', error);
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
