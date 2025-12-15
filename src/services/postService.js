/**
 * Post Service - Gerenciamento de posts da comunidade
 * Integração completa com Supabase
 */

import { supabase } from './supabase';
import { uploadPostImage, replaceImage, STORAGE_BUCKETS } from './uploadService';
import { logAndNotifyError } from '../utils/errorUtils';

export const postService = {
  /**
   * Buscar todos os posts da comunidade
   */
  async getAllPosts(limit = 20, offset = 0, userId = null) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          plants!posts_plant_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // Se userId fornecido, verificar quais posts o usuário curtiu
      if (userId && data) {
        const postsWithLikeStatus = await this.addLikeStatusToPosts(data, userId);
        return postsWithLikeStatus;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      throw error;
    }
  },

  /**
   * Buscar posts por categoria
   */
  async getPostsByCategory(category, limit = 20, offset = 0, userId = null) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          plants!posts_plant_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .eq('category', category)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // Se userId fornecido, verificar quais posts o usuário curtiu
      if (userId && data) {
        const postsWithLikeStatus = await this.addLikeStatusToPosts(data, userId);
        return postsWithLikeStatus;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts por categoria:', error);
      throw error;
    }
  },

  /**
   * Buscar posts de um usuário específico
   */
  async getUserPosts(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          plants!posts_plant_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      throw error;
    }
  },

  /**
   * Buscar um post específico por ID
   */
  async getPostById(postId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          plants!posts_plant_id_fkey (
            id,
            name,
            image_url
          ),
          comments (
            *,
            users!comments_user_id_fkey (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      throw error;
    }
  },

  /**
   * Criar um novo post
   */
  async createPost(userId, postData) {
    try {
      let imageUrl = null;
      
      // First create the post record to get an ID
      const { data: postRecord, error: postError } = await supabase
        .from('posts')
        .insert([{
          user_id: userId,
          plant_id: postData.plant_id || null,
          image_url: null, // Will be updated after upload
          description: postData.description,
          category: postData.category || 'all',
          tags: postData.tags || [],
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Upload image if provided
      if (postData.imageFile) {
        try {
          console.log('📸 Uploading post image...');
          console.log('📸 imageFile:', JSON.stringify({
            hasUri: !!postData.imageFile?.uri,
            uri: postData.imageFile?.uri?.substring(0, 100),
            type: postData.imageFile?.type,
            width: postData.imageFile?.width,
            height: postData.imageFile?.height,
          }));
          const uploadResult = await uploadPostImage(postData.imageFile, postRecord.id);
          imageUrl = uploadResult.url;
          
          // Update post record with image URL
          const { data: updatedPost, error: updateError } = await supabase
            .from('posts')
            .update({ image_url: imageUrl })
            .eq('id', postRecord.id)
            .select(`
              *,
              users!posts_user_id_fkey (
                id,
                name,
                avatar_url
              ),
              plants!posts_plant_id_fkey (
                id,
                name,
                image_url
              )
            `)
            .single();

          if (updateError) throw updateError;
          return updatedPost;
        } catch (uploadError) {
          console.error('❌ Error uploading post image:', uploadError);
          logAndNotifyError(uploadError, {
            context: 'postService.createPost.upload',
            userMessage: 'Não foi possível enviar a imagem do post. O post foi criado sem imagem.',
            suggestion: 'Tente novamente ou verifique sua conexão',
          });
          // Return post without image rather than failing completely
          const { data: postWithoutImage } = await supabase
            .from('posts')
            .select(`
              *,
              users!posts_user_id_fkey (
                id,
                name,
                avatar_url
              ),
              plants!posts_plant_id_fkey (
                id,
                name,
                image_url
              )
            `)
            .eq('id', postRecord.id)
            .single();
          return postWithoutImage;
        }
      }

      // Return post without image
      const { data: finalPost } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          plants!posts_plant_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .eq('id', postRecord.id)
        .single();
      
      return finalPost;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      logAndNotifyError(error, {
        context: 'postService.createPost',
        userMessage: 'Erro ao criar post',
        suggestion: 'Tente novamente mais tarde',
      });
      throw error;
    }
  },

  /**
   * Atualizar um post
   */
  async updatePost(postId, updates) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          plants!posts_plant_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      throw error;
    }
  },

  /**
   * Deletar um post
   */
  async deletePost(postId) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      throw error;
    }
  },

  /**
   * Curtir/descurtir um post
   */
  async toggleLike(userId, postId) {
    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Usar transação para garantir consistência
      const { data, error } = await supabase.rpc('toggle_like_safe', {
        p_user_id: userId,
        p_post_id: postId
      });

      if (error) {
        // Fallback para método manual se RPC não existir
        console.log('RPC não disponível, usando método manual');
        return await this.toggleLikeManual(userId, postId);
      }

      return { liked: data };
    } catch (error) {
      console.error('Erro ao curtir/descurtir post:', error);
      // Fallback para método manual
      return await this.toggleLikeManual(userId, postId);
    }
  },

  /**
   * Método manual para curtir/descurtir (fallback)
   */
  async toggleLikeManual(userId, postId) {
    try {
      // Verificar se já curtiu
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar curtida existente:', checkError);
        throw checkError;
      }

      if (existingLike) {
        // Remover curtida
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;
        return { liked: false };
      } else {
        // Adicionar curtida (com tratamento de duplicatas)
        const { error: insertError } = await supabase
          .from('likes')
          .insert([{ user_id: userId, post_id: postId }]);

        // Se erro de duplicata, ignorar (usuário já curtiu)
        if (insertError && insertError.code === '23505') {
          return { liked: true };
        }
        
        if (insertError) throw insertError;
        return { liked: true };
      }
    } catch (error) {
      console.error('Erro no método manual de curtida:', error);
      throw error;
    }
  },

  /**
   * Adicionar comentário a um post
   */
  async addComment(userId, postId, text) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          user_id: userId,
          post_id: postId,
          text: text,
        }])
        .select(`
          *,
          users!comments_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // O trigger do banco atualizará o contador de comentários automaticamente
      return data;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  },

  /**
   * Buscar comentários de um post
   */
  async getPostComments(postId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users!comments_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }
  },

  /**
   * Verificar se usuário curtiu um post
   */
  async hasUserLiked(userId, postId) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar curtida:', error);
      return false;
    }
  },

  /**
   * Adicionar status de curtida aos posts para um usuário específico
   */
  async addLikeStatusToPosts(posts, userId) {
    try {
      if (!posts || posts.length === 0 || !userId) {
        return posts.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }
      
      const postIds = posts.map(post => post.id);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Usuário não autenticado, retornando posts sem status de curtida');
        return posts.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }
      
      // Buscar todas as curtidas do usuário para estes posts
      const { data: userLikes, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (error) {
        console.error('Erro ao buscar curtidas do usuário:', error);
        // Em caso de erro, retornar posts sem status de curtida
        return posts.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }
      
      const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);
      
      // Adicionar propriedade user_has_liked a cada post
      return posts.map(post => ({
        ...post,
        user_has_liked: likedPostIds.has(post.id)
      }));
    } catch (error) {
      console.error('Erro ao adicionar status de curtida:', error);
      // Em caso de erro, retornar posts sem status de curtida
      return posts.map(post => ({
        ...post,
        user_has_liked: false
      }));
    }
  },
};

export default postService;