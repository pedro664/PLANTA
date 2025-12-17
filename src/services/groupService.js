/**
 * Group Service - Gerenciamento de grupos da comunidade
 */

import { supabase } from './supabase';
import { uploadGroupImage as uploadGroupImg, uploadGroupMessageImage } from './uploadService';

export const groupService = {
  /**
   * Upload de imagem para o grupo (capa)
   */
  async uploadGroupImage(uri, groupId) {
    try {
      const result = await uploadGroupImg({ uri }, groupId || 'temp');
      return result.url;
    } catch (error) {
      console.error('Erro ao fazer upload de imagem do grupo:', error);
      throw error;
    }
  },

  /**
   * Upload de imagem para mensagem do chat
   */
  async uploadChatImage(uri, groupId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const result = await uploadGroupMessageImage({ uri }, groupId, user.id);
      return result.url;
    } catch (error) {
      console.error('Erro ao fazer upload de imagem do chat:', error);
      throw error;
    }
  },
  /**
   * Criar um novo grupo
   */
  async createGroup(name, description = '', isPrivate = false, imageUrl = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar o grupo
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name,
          description,
          is_private: isPrivate,
          image_url: imageUrl,
          creator_id: user.id,
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Adicionar criador como admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        }]);

      if (memberError) throw memberError;

      return group;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      throw error;
    }
  },

  /**
   * Buscar grupos do usuário
   */
  async getMyGroups() {
    try {
      console.log('🔄 [groupService.getMyGroups] Iniciando...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ [groupService.getMyGroups] Erro de auth:', authError);
        throw new Error('Erro de autenticação: ' + authError.message);
      }
      if (!user) {
        console.error('❌ [groupService.getMyGroups] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('👤 [groupService.getMyGroups] Usuário:', user.id);

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          joined_at,
          group:group_id (
            id,
            name,
            description,
            image_url,
            is_private,
            member_count,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('❌ [groupService.getMyGroups] Erro na query:', error);
        console.error('❌ [groupService.getMyGroups] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [groupService.getMyGroups] Query executada. Resultados:', data?.length || 0);
      
      const result = (data || []).map(item => ({ 
        ...item.group, 
        role: item.role, 
        joined_at: item.joined_at 
      }));
      
      console.log('✅ [groupService.getMyGroups] Grupos processados:', result);
      return result;
    } catch (error) {
      console.error('❌ [groupService.getMyGroups] Erro:', error);
      throw error;
    }
  },


  /**
   * Buscar detalhes de um grupo
   */
  async getGroupById(groupId) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          creator:creator_id (id, name, avatar_url)
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar grupo:', error);
      throw error;
    }
  },

  /**
   * Buscar membros de um grupo
   */
  async getGroupMembers(groupId) {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          role,
          joined_at,
          user:user_id (id, name, avatar_url, level),
          invited_by_user:invited_by (id, name)
        `)
        .eq('group_id', groupId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      throw error;
    }
  },

  /**
   * Adicionar membro ao grupo (apenas amigos)
   */
  async addMember(groupId, userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se é amigo
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .single();

      if (!friendship) {
        throw new Error('Você só pode adicionar amigos ao grupo');
      }

      const { data, error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member',
          invited_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este usuário já é membro do grupo');
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  },

  /**
   * Remover membro do grupo
   */
  async removeMember(groupId, userId) {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  },

  /**
   * Sair do grupo
   */
  async leaveGroup(groupId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao sair do grupo:', error);
      throw error;
    }
  },

  /**
   * Buscar mensagens do grupo
   */
  async getMessages(groupId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          content,
          message_type,
          image_url,
          created_at,
          sender:sender_id (id, name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data || []).reverse();
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  },

  /**
   * Enviar mensagem no grupo
   */
  async sendMessage(groupId, content, messageType = 'text', imageUrl = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const messageData = {
        group_id: groupId,
        sender_id: user.id,
        content,
        message_type: messageType,
      };

      if (imageUrl) {
        messageData.image_url = imageUrl;
      }

      const { data, error } = await supabase
        .from('group_messages')
        .insert([messageData])
        .select(`
          id,
          content,
          message_type,
          image_url,
          created_at,
          sender:sender_id (id, name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  },

  /**
   * Enviar imagem no chat do grupo
   */
  async sendImageMessage(groupId, imageUri) {
    try {
      // Upload da imagem usando o serviço de upload
      const imageUrl = await this.uploadChatImage(imageUri, groupId);
      
      // Enviar mensagem com a imagem
      return await this.sendMessage(groupId, '', 'image', imageUrl);
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      throw error;
    }
  },

  /**
   * Deletar mensagem do grupo (apenas próprias mensagens)
   */
  async deleteMessage(groupId, messageId) {
    try {
      console.log('🗑️ [deleteGroupMessage] Iniciando exclusão:', { groupId, messageId });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      console.log('👤 [deleteGroupMessage] Usuário:', user.id);

      // Verificar se a mensagem pertence ao usuário
      const { data: message, error: fetchError } = await supabase
        .from('group_messages')
        .select('id, sender_id, image_url')
        .eq('id', messageId)
        .eq('group_id', groupId)
        .single();

      if (fetchError) {
        console.error('❌ [deleteGroupMessage] Erro ao buscar mensagem:', fetchError);
        throw fetchError;
      }
      
      console.log('📩 [deleteGroupMessage] Mensagem encontrada:', { 
        id: message.id, 
        sender_id: message.sender_id,
        hasImage: !!message.image_url 
      });
      
      if (message.sender_id !== user.id) {
        throw new Error('Você só pode deletar suas próprias mensagens');
      }

      // Se tiver imagem, tentar deletar do storage
      if (message.image_url && message.image_url.includes('supabase.co')) {
        try {
          const { deleteImage } = await import('./uploadService');
          const urlParts = message.image_url.split('/storage/v1/object/public/');
          if (urlParts[1]) {
            const bucketAndPath = urlParts[1].split('/');
            const bucket = bucketAndPath.shift();
            const path = bucketAndPath.join('/');
            console.log('🖼️ [deleteGroupMessage] Deletando imagem do storage:', { bucket, path });
            await deleteImage(bucket, path);
          }
        } catch (deleteError) {
          console.warn('⚠️ [deleteGroupMessage] Não foi possível deletar imagem do storage:', deleteError);
        }
      }

      // Deletar a mensagem - usar apenas o ID para garantir que funcione
      console.log('🗑️ [deleteGroupMessage] Executando DELETE na tabela group_messages...');
      const { data: deleteData, error: deleteError } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId)
        .select();

      console.log('📊 [deleteGroupMessage] Resultado do DELETE:', { 
        deleteData, 
        deleteError,
        deletedRows: deleteData?.length || 0
      });

      if (deleteError) {
        console.error('❌ [deleteGroupMessage] Erro no DELETE:', deleteError);
        throw deleteError;
      }
      
      // Verificar se realmente deletou
      if (!deleteData || deleteData.length === 0) {
        console.warn('⚠️ [deleteGroupMessage] Nenhuma linha foi deletada! Verificando RLS...');
        
        // Tentar verificar se a mensagem ainda existe
        const { data: checkMsg } = await supabase
          .from('group_messages')
          .select('id')
          .eq('id', messageId)
          .single();
        
        if (checkMsg) {
          console.error('❌ [deleteGroupMessage] Mensagem ainda existe após DELETE! Possível problema de RLS.');
          throw new Error('Falha ao deletar mensagem. Verifique as permissões do banco de dados.');
        }
      }
      
      console.log('✅ [deleteGroupMessage] Mensagem deletada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [deleteGroupMessage] Erro:', error);
      throw error;
    }
  },

  /**
   * Inscrever-se para novas mensagens do grupo
   */
  subscribeToGroupMessages(groupId, callback) {
    return supabase
      .channel(`group_messages:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, callback)
      .subscribe();
  },

  /**
   * Cancelar inscrição
   */
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  /**
   * Buscar amigos que não estão no grupo (para adicionar)
   */
  async getFriendsNotInGroup(groupId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar amigos
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select(`
          requester:requester_id (id, name, avatar_url),
          addressee:addressee_id (id, name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendError) throw friendError;

      // Extrair lista de amigos
      const friends = (friendships || []).map(f => 
        f.requester.id === user.id ? f.addressee : f.requester
      );

      // Buscar membros atuais do grupo
      const { data: members, error: memberError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (memberError) throw memberError;

      const memberIds = new Set((members || []).map(m => m.user_id));

      // Filtrar amigos que não estão no grupo
      return friends.filter(f => !memberIds.has(f.id));
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
      throw error;
    }
  },

  /**
   * Atualizar grupo
   */
  async updateGroup(groupId, updates) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      throw error;
    }
  },

  /**
   * Deletar grupo
   */
  async deleteGroup(groupId) {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      throw error;
    }
  },
};

export default groupService;
