/**
 * Tela de Chat - Mensagens Diretas
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { communityService } from '../services/communityService';
import { useAppContext } from '../context/AppContext';

const ChatScreen = ({ navigation, route }) => {
  const { conversationId, otherUser } = route.params;
  const { user: currentUser } = useAppContext();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await communityService.getMessages(conversationId);
      setMessages(data);
      // Marcar como lidas
      await communityService.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    // Inscrever para novas mensagens em tempo real
    subscriptionRef.current = communityService.subscribeToMessages(
      conversationId,
      (payload) => {
        const newMsg = payload.new;
        console.log('📩 [Realtime] Nova mensagem recebida:', newMsg?.id);
        
        setMessages(prev => {
          // Evitar duplicatas - verificar se mensagem já existe
          const exists = prev.some(m => m.id === newMsg.id);
          if (exists) {
            console.log('📩 [Realtime] Mensagem já existe, ignorando');
            return prev;
          }
          
          // Remover mensagens temporárias do mesmo remetente (optimistic updates)
          const filtered = prev.filter(m => !m._isTemp || m.sender?.id !== newMsg.sender_id);
          
          return [...filtered, {
            ...newMsg,
            sender: newMsg.sender_id === currentUser?.id 
              ? { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar_url }
              : otherUser
          }];
        });
        
        // Marcar como lida se não for do usuário atual
        if (newMsg.sender_id !== currentUser?.id) {
          communityService.markMessagesAsRead(conversationId);
        }
      }
    );

    return () => {
      if (subscriptionRef.current) {
        communityService.unsubscribe(subscriptionRef.current);
      }
    };
  }, [conversationId, loadMessages, currentUser, otherUser]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Criar mensagem temporária para exibição imediata (optimistic update)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageText,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser?.id,
        name: currentUser?.name,
        avatar_url: currentUser?.avatar_url
      },
      _isTemp: true
    };

    // Adicionar mensagem temporária imediatamente
    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('📤 Enviando mensagem...');
      const sentMessage = await communityService.sendMessage(conversationId, messageText);
      console.log('✅ Mensagem enviada:', sentMessage?.id);
      
      // Substituir mensagem temporária pela real (se realtime não fizer isso)
      setMessages(prev => {
        // Verificar se a mensagem real já foi adicionada via realtime
        const hasRealMessage = prev.some(m => m.id === sentMessage?.id);
        if (hasRealMessage) {
          // Remover apenas a temporária
          return prev.filter(m => m.id !== tempMessage.id);
        }
        // Substituir temporária pela real
        return prev.map(m => m.id === tempMessage.id ? sentMessage : m);
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      // Remover mensagem temporária e restaurar texto
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender?.id === currentUser?.id;
    const showDate = index === 0 || 
      formatDate(item.created_at) !== formatDate(messages[index - 1]?.created_at);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}>
          {!isOwnMessage && (
            <Image
              source={{ uri: item.sender?.avatar_url || 'https://via.placeholder.com/32' }}
              style={styles.messageAvatar}
            />
          )}
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble
          ]}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerProfile}
          onPress={() => navigation.navigate('UserProfile', { userId: otherUser.id })}
        >
          <Image
            source={{ uri: otherUser.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>{otherUser.name}</Text>
            <Text style={styles.headerStatus}>Toque para ver perfil</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.botanical.clay} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color={colors.botanical.sage} />
                <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptySubtext}>Envie a primeira mensagem!</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.botanical.sage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.botanical.base} />
            ) : (
              <Ionicons name="send" size={20} color={colors.botanical.base} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
    backgroundColor: colors.ui.background,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.botanical.sage,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.botanical.sage,
    marginTop: spacing.xs,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateText: {
    fontSize: 12,
    color: colors.botanical.sage,
    backgroundColor: colors.botanical.sage + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.xs,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  ownBubble: {
    backgroundColor: colors.botanical.clay,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.ui.background,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.botanical.base,
  },
  otherMessageText: {
    color: colors.botanical.dark,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: colors.botanical.base + 'AA',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.botanical.sage,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 74, 61, 0.1)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.botanical.base,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.botanical.dark,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.botanical.clay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.botanical.sage,
    opacity: 0.5,
  },
});

export default ChatScreen;