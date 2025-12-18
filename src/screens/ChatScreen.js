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
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { communityService } from '../services/communityService';
import { useAppContext } from '../context/AppContext';
import { showErrorToast, showSuccessToast } from '../components/Toast';
import { playMessageSound } from '../services/soundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_MAX_WIDTH = SCREEN_WIDTH * 0.6;
const IMAGE_MAX_HEIGHT = SCREEN_HEIGHT * 0.4;

const ChatScreen = ({ navigation, route }) => {
  const { conversationId, otherUser } = route.params;
  const { user: currentUser } = useAppContext();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({});
  
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);
  
  // Calculate safe bottom padding for input
  const inputBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showErrorToast('Permissão necessária para acessar fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      showErrorToast('Erro ao selecionar imagem');
    }
  };

  const sendImageMessage = async (imageUri) => {
    setIsUploadingImage(true);
    
    // Optimistic update
    const tempMessage = {
      id: `temp-img-${Date.now()}`,
      content: '',
      message_type: 'image',
      image_url: imageUri,
      created_at: new Date().toISOString(),
      sender: { id: currentUser?.id, name: currentUser?.name, avatar_url: currentUser?.avatar_url },
      _isTemp: true,
      _isUploading: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const sentMessage = await communityService.sendImageMessage(conversationId, imageUri);
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? sentMessage : m));
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      showErrorToast('Erro ao enviar imagem');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = (message) => {
    // Only allow deleting own images
    if (message.sender?.id !== currentUser?.id) {
      showErrorToast('Você só pode deletar suas próprias imagens');
      return;
    }

    Alert.alert(
      'Deletar imagem',
      'Tem certeza que deseja deletar esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deleteMessage(conversationId, message.id);
              setMessages(prev => prev.filter(m => m.id !== message.id));
              showSuccessToast('Imagem deletada');
              setSelectedImage(null);
            } catch (error) {
              console.error('Erro ao deletar imagem:', error);
              showErrorToast('Erro ao deletar imagem');
            }
          }
        }
      ]
    );
  };

  // Calculate image dimensions maintaining aspect ratio
  const getImageStyle = (imageUrl) => {
    const dims = imageDimensions[imageUrl];
    if (!dims) {
      Image.getSize(imageUrl, (width, height) => {
        const aspectRatio = width / height;
        let displayWidth, displayHeight;
        
        if (aspectRatio > 1) {
          displayWidth = Math.min(IMAGE_MAX_WIDTH, width);
          displayHeight = displayWidth / aspectRatio;
        } else {
          displayHeight = Math.min(IMAGE_MAX_HEIGHT, height);
          displayWidth = displayHeight * aspectRatio;
        }
        
        setImageDimensions(prev => ({
          ...prev,
          [imageUrl]: { width: displayWidth, height: displayHeight }
        }));
      }, () => {
        setImageDimensions(prev => ({
          ...prev,
          [imageUrl]: { width: IMAGE_MAX_WIDTH, height: IMAGE_MAX_WIDTH * 0.75 }
        }));
      });
      
      return { width: IMAGE_MAX_WIDTH, height: IMAGE_MAX_WIDTH * 0.75 };
    }
    return dims;
  };

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
      
      // Tocar som ao enviar mensagem
      await playMessageSound();
      
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

  const handleDeleteMessage = (message) => {
    if (message.sender?.id !== currentUser?.id) {
      showErrorToast('Você só pode deletar suas próprias mensagens');
      return;
    }

    Alert.alert(
      'Deletar mensagem',
      'Tem certeza que deseja deletar esta mensagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deleteMessage(conversationId, message.id);
              setMessages(prev => prev.filter(m => m.id !== message.id));
              showSuccessToast('Mensagem deletada');
            } catch (error) {
              console.error('Erro ao deletar mensagem:', error);
              showErrorToast('Erro ao deletar mensagem');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender?.id === currentUser?.id;
    const showDate = index === 0 || 
      formatDate(item.created_at) !== formatDate(messages[index - 1]?.created_at);
    const isImageMessage = item.message_type === 'image';

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
            item.sender?.avatar_url ? (
              <Image
                source={{ uri: item.sender.avatar_url }}
                style={styles.messageAvatar}
              />
            ) : (
              <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={14} color={colors.botanical.sage} />
              </View>
            )
          )}
          {isImageMessage ? (
            <TouchableOpacity 
              onPress={() => setSelectedImage({ url: item.image_url, message: item })}
              style={[styles.imageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}
            >
              <Image 
                source={{ uri: item.image_url }} 
                style={[styles.messageImage, getImageStyle(item.image_url)]}
                resizeMode="cover"
              />
              {item._isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={colors.botanical.base} />
                </View>
              )}
              <Text style={[styles.messageTime, styles.imageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
                {formatTime(item.created_at)}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onLongPress={() => isOwnMessage && handleDeleteMessage(item)}
              delayLongPress={500}
              activeOpacity={0.8}
              style={[
                styles.messageBubble,
                isOwnMessage ? styles.ownBubble : styles.otherBubble
              ]}
            >
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
            </TouchableOpacity>
          )}
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
          {otherUser.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Ionicons name="person" size={20} color={colors.botanical.sage} />
            </View>
          )}
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
        <View style={[styles.inputContainer, { paddingBottom: spacing.md + inputBottomPadding }]}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={pickImage}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={colors.botanical.clay} />
            ) : (
              <Ionicons name="image-outline" size={24} color={colors.botanical.clay} />
            )}
          </TouchableOpacity>
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

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.closeImageButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={28} color={colors.botanical.base} />
          </TouchableOpacity>
          {selectedImage?.message?.sender?.id === currentUser?.id && (
            <TouchableOpacity 
              style={styles.deleteImageButton} 
              onPress={() => handleDeleteImage(selectedImage.message)}
            >
              <Ionicons name="trash-outline" size={24} color="#FF4444" />
            </TouchableOpacity>
          )}
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage.url }} 
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  headerAvatarPlaceholder: {
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarPlaceholder: {
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
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
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
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
  imageBubble: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    maxWidth: '75%',
  },
  messageImage: {
    borderRadius: borderRadius.sm,
    minWidth: 100,
    minHeight: 100,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  imageTime: {
    marginTop: spacing.xs,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: spacing.sm,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

export default ChatScreen;