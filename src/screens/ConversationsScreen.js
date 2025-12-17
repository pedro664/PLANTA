/**
 * Tela de Lista de Conversas
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { communityService } from '../services/communityService';

const ConversationsScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await communityService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    
    // Recarregar ao focar na tela
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [loadConversations, navigation]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderConversation = ({ item }) => {
    const hasAvatar = item.otherUser?.avatar_url && !item.otherUser.avatar_url.includes('placeholder');
    
    return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', {
        conversationId: item.id,
        otherUser: item.otherUser
      })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {hasAvatar ? (
          <Image
            source={{ uri: item.otherUser.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={28} color={colors.botanical.sage} />
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[
            styles.userName,
            item.unreadCount > 0 && styles.userNameUnread
          ]}>
            {item.otherUser?.name}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(item.lastMessage?.created_at)}
          </Text>
        </View>
        
        <Text 
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.lastMessageUnread
          ]}
          numberOfLines={1}
        >
          {item.lastMessage?.message_type === 'image' ? '📷 Imagem' : (item.lastMessage?.content || 'Nenhuma mensagem')}
        </Text>
      </View>
    </TouchableOpacity>
  );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mensagens</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.botanical.clay} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.botanical.sage} />
            <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
            <Text style={styles.emptyText}>
              Visite o perfil de um usuário para iniciar uma conversa
            </Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
    backgroundColor: colors.ui.background,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.botanical.sage + '30',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.botanical.sand,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.botanical.clay,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.botanical.base,
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.botanical.dark,
  },
  userNameUnread: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: colors.botanical.sage,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.botanical.sage,
  },
  lastMessageUnread: {
    color: colors.botanical.dark,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default ConversationsScreen;