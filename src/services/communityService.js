/**
 * Community Service - Gerenciamento de funcionalidades sociais
 * Amizades, Mensagens Diretas, Compartilhamento de Plantas
 */

import { supabase } from './supabase';

export const communityService = {
  // ==================== BUSCA DE USUÁRIOS ====================
  
  /**
   * Buscar usuários por nome ou email
   */
  async searchUsers(searchTerm, limit = 20) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        current_user_id: user.id,
        result_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  /**
   * Obter perfil público de um usuário
   */
  async getUserProfile(userId) {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, level, total_plants, xp, badges, join_date, active_days')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Verificar status de amizade se usuário logado
      let friendshipStatus = 'none';
      if (currentUser && currentUser.id !== userId) {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('status, requester_id')
          .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
          .single();
        
        if (friendship) {
          friendshipStatus = friendship.status;
          // Adicionar info se foi o usuário atual que enviou
          if (friendship.requester_id === currentUser.id) {
            friendshipStatus = friendship.status === 'pending' ? 'pending_sent' : friendship.status;
          } else {
            friendshipStatus = friendship.status === 'pending' ? 'pending_received' : friendship.status;
          }
        }
      }

      return { ...data, friendshipStatus };
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  },

  /**
   * Obter plantas públicas de um usuário
   */
  async getUserPlants(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('id, name, scientific_name, image_url, plant_type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter plantas do usuário:', error);
      throw error;
    }
  },

  // ==================== AMIZADES ====================

  /**
   * Enviar solicitação de amizade
   */
  async sendFriendRequest(addresseeId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se já existe uma solicitação
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Vocês já são amigos');
        }
        if (existing.status === 'pending') {
          throw new Error('Já existe uma solicitação pendente');
        }
        if (existing.status === 'blocked') {
          throw new Error('Não é possível enviar solicitação');
        }
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert([{
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      throw error;
    }
  },

  /**
   * Aceitar solicitação de amizade
   */
  async acceptFriendRequest(friendshipId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      throw error;
    }
  },

  /**
   * Rejeitar solicitação de amizade
   */
  async rejectFriendRequest(friendshipId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      throw error;
    }
  },

  /**
   * Remover amizade
   */
  async removeFriend(friendshipId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao remover amizade:', error);
      throw error;
    }
  },

  /**
   * Obter lista de amigos
   */
  async getFriends() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          created_at,
          requester:requester_id(id, name, avatar_url, level),
          addressee:addressee_id(id, name, avatar_url, level)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Mapear para retornar apenas o amigo (não o usuário atual)
      return (data || []).map(f => ({
        friendshipId: f.id,
        createdAt: f.created_at,
        friend: f.requester.id === user.id ? f.addressee : f.requester
      }));
    } catch (error) {
      console.error('Erro ao obter amigos:', error);
      throw error;
    }
  },

  /**
   * Obter solicitações de amizade pendentes (recebidas)
   */
  async getPendingFriendRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          created_at,
          requester:requester_id(id, name, avatar_url, level)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter solicitações:', error);
      throw error;
    }
  },

  // ==================== MENSAGENS DIRETAS ====================

  /**
   * Obter ou criar conversa com outro usuário
   */
  async getOrCreateConversation(otherUserId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter/criar conversa:', error);
      throw error;
    }
  },

  /**
   * Obter lista de conversas
   */
  async getConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message_at,
          participant_1:participant_1(id, name, avatar_url),
          participant_2:participant_2(id, name, avatar_url)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Mapear para incluir o outro participante e última mensagem
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUser = conv.participant_1.id === user.id 
            ? conv.participant_2 
            : conv.participant_1;

          // Obter última mensagem
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, is_read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Contar mensagens não lidas
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            id: conv.id,
            otherUser,
            lastMessage,
            unreadCount: unreadCount || 0,
            lastMessageAt: conv.last_message_at
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      throw error;
    }
  },

  /**
   * Obter mensagens de uma conversa
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          message_type,
          is_read,
          created_at,
          sender:sender_id(id, name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data || []).reverse();
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      throw error;
    }
  },

  /**
   * Enviar mensagem
   */
  async sendMessage(conversationId, content, messageType = 'text') {
    try {
      console.log('📤 [sendMessage] Iniciando envio de mensagem...');
      console.log('📤 [sendMessage] conversationId:', conversationId);
      console.log('📤 [sendMessage] content:', content?.substring(0, 50));
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ [sendMessage] Erro de autenticação:', authError);
        throw new Error('Erro de autenticação: ' + authError.message);
      }
      if (!user) {
        console.error('❌ [sendMessage] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      console.log('👤 [sendMessage] Usuário:', user.id);

      // Verificar se o usuário faz parte da conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, participant_1, participant_2')
        .eq('id', conversationId)
        .single();
      
      if (convError) {
        console.error('❌ [sendMessage] Erro ao buscar conversa:', convError);
        throw new Error('Conversa não encontrada');
      }
      
      if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
        console.error('❌ [sendMessage] Usuário não faz parte da conversa');
        throw new Error('Você não faz parte desta conversa');
      }
      console.log('✅ [sendMessage] Usuário faz parte da conversa');

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType
        }])
        .select(`
          id,
          content,
          message_type,
          is_read,
          created_at,
          sender:sender_id(id, name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('❌ [sendMessage] Erro ao inserir mensagem:', error);
        console.error('❌ [sendMessage] Código:', error.code);
        console.error('❌ [sendMessage] Detalhes:', error.details);
        console.error('❌ [sendMessage] Hint:', error.hint);
        throw error;
      }
      
      console.log('✅ [sendMessage] Mensagem enviada com sucesso:', data?.id);
      
      // Atualizar last_message_at na conversa
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return data;
    } catch (error) {
      console.error('❌ [sendMessage] Erro:', error);
      throw error;
    }
  },

  /**
   * Marcar mensagens como lidas
   */
  async markMessagesAsRead(conversationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar como lidas:', error);
      throw error;
    }
  },

  // ==================== COMPARTILHAMENTO DE PLANTAS ====================

  /**
   * Compartilhar planta com outro usuário
   */
  async sharePlant(plantId, receiverId, message = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar compartilhamento
      const { data: share, error: shareError } = await supabase
        .from('plant_shares')
        .insert([{
          plant_id: plantId,
          sender_id: user.id,
          receiver_id: receiverId,
          message
        }])
        .select()
        .single();

      if (shareError) throw shareError;

      // Criar notificação
      const { data: plant } = await supabase
        .from('plants')
        .select('name')
        .eq('id', plantId)
        .single();

      const { data: sender } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      await supabase
        .from('notifications')
        .insert([{
          user_id: receiverId,
          type: 'plant_shared',
          title: 'Planta compartilhada',
          body: `${sender?.name} compartilhou "${plant?.name}" com você`,
          data: { plant_id: plantId, share_id: share.id, sender_id: user.id }
        }]);

      return share;
    } catch (error) {
      console.error('Erro ao compartilhar planta:', error);
      throw error;
    }
  },

  /**
   * Obter plantas compartilhadas comigo
   */
  async getReceivedPlantShares() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('plant_shares')
        .select(`
          id,
          message,
          status,
          created_at,
          plant:plant_id(id, name, scientific_name, image_url, plant_type),
          sender:sender_id(id, name, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter plantas compartilhadas:', error);
      throw error;
    }
  },

  // ==================== NOTIFICAÇÕES ====================

  /**
   * Obter notificações
   */
  async getNotifications(limit = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      throw error;
    }
  },

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação:', error);
      throw error;
    }
  },

  /**
   * Obter contagem de notificações não lidas
   */
  async getUnreadNotificationsCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      return 0;
    }
  },

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Inscrever-se para novas mensagens em uma conversa
   */
  subscribeToMessages(conversationId, callback) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();
  },

  /**
   * Inscrever-se para novas notificações
   */
  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
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
  }
};

export default communityService;