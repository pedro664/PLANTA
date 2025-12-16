/**
 * Tela de Amigos e Solicitações
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
import { showSuccessToast, showErrorToast } from '../components/Toast';

const FriendsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        communityService.getFriends(),
        communityService.getPendingFriendRequests()
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [loadData, navigation]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(requestId);
      await communityService.acceptFriendRequest(requestId);
      showSuccessToast('Amizade aceita!');
      loadData();
    } catch (error) {
      showErrorToast('Erro ao aceitar solicitação');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setActionLoading(requestId);
      await communityService.rejectFriendRequest(requestId);
      showSuccessToast('Solicitação rejeitada');
      loadData();
    } catch (error) {
      showErrorToast('Erro ao rejeitar solicitação');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    try {
      setActionLoading(friendshipId);
      await communityService.removeFriend(friendshipId);
      showSuccessToast('Amizade removida');
      loadData();
    } catch (error) {
      showErrorToast('Erro ao remover amizade');
    } finally {
      setActionLoading(null);
    }
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.friend.id })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.friend.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.friend.name}</Text>
        <Text style={styles.userLevel}>{item.friend.level || 'Iniciante'}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={async () => {
            const convId = await communityService.getOrCreateConversation(item.friend.id);
            navigation.navigate('Chat', { conversationId: convId, otherUser: item.friend });
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.botanical.clay} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <TouchableOpacity
        style={styles.requestUser}
        onPress={() => navigation.navigate('UserProfile', { userId: item.requester.id })}
      >
        <Image
          source={{ uri: item.requester.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.requester.name}</Text>
          <Text style={styles.userLevel}>{item.requester.level || 'Iniciante'}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={() => handleAcceptRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color={colors.botanical.base} />
          ) : (
            <Ionicons name="checkmark" size={20} color={colors.botanical.base} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleRejectRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          <Ionicons name="close" size={20} color={colors.system.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyFriends = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={60} color={colors.botanical.sage} />
      <Text style={styles.emptyTitle}>Nenhum amigo ainda</Text>
      <Text style={styles.emptyText}>
        Busque usuários na comunidade e envie solicitações de amizade
      </Text>
    </View>
  );

  const renderEmptyRequests = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail-outline" size={60} color={colors.botanical.sage} />
      <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
      <Text style={styles.emptyText}>
        Você não tem solicitações de amizade pendentes
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Amigos</Text>
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
        <Text style={styles.headerTitle}>Amigos</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Amigos ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Solicitações ({requests.length})
          </Text>
          {requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={item => item.friendshipId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyFriends}
        />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyRequests}
        />
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.botanical.clay,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.botanical.sage,
  },
  tabTextActive: {
    color: colors.botanical.clay,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.botanical.clay,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.botanical.base,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.05)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.botanical.sage + '30',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  userLevel: {
    fontSize: 13,
    color: colors.botanical.sage,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.clay + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.05)',
  },
  requestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: colors.system.success,
  },
  rejectBtn: {
    backgroundColor: colors.system.error + '15',
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

export default FriendsScreen;