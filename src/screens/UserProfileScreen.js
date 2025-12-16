/**
 * Tela de Perfil de Usuário Público
 * Visualização de perfil de outros usuários da comunidade
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { communityService } from '../services/communityService';
import { useAppContext } from '../context/AppContext';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const UserProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const { user: currentUser } = useAppContext();
  
  const [profile, setProfile] = useState(null);
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const loadProfile = useCallback(async () => {
    try {
      const [profileData, plantsData] = await Promise.all([
        communityService.getUserProfile(userId),
        communityService.getUserPlants(userId)
      ]);
      setProfile(profileData);
      setPlants(plantsData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      showErrorToast('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProfile();
  };

  const handleSendFriendRequest = async () => {
    try {
      setActionLoading(true);
      await communityService.sendFriendRequest(userId);
      showSuccessToast('Solicitação enviada!');
      setProfile(prev => ({ ...prev, friendshipStatus: 'pending_sent' }));
    } catch (error) {
      showErrorToast(error.message || 'Erro ao enviar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setActionLoading(true);
      // Buscar o ID da amizade
      const requests = await communityService.getPendingFriendRequests();
      const request = requests.find(r => r.requester.id === userId);
      if (request) {
        await communityService.acceptFriendRequest(request.id);
        showSuccessToast('Amizade aceita!');
        setProfile(prev => ({ ...prev, friendshipStatus: 'accepted' }));
      }
    } catch (error) {
      showErrorToast('Erro ao aceitar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    try {
      setActionLoading(true);
      const requests = await communityService.getPendingFriendRequests();
      const request = requests.find(r => r.requester.id === userId);
      if (request) {
        await communityService.rejectFriendRequest(request.id);
        showSuccessToast('Solicitação recusada');
        setProfile(prev => ({ ...prev, friendshipStatus: 'none' }));
      }
    } catch (error) {
      showErrorToast('Erro ao recusar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const conversationId = await communityService.getOrCreateConversation(userId);
      navigation.navigate('Chat', { 
        conversationId, 
        otherUser: { id: userId, name: profile?.name, avatar_url: profile?.avatar_url }
      });
    } catch (error) {
      showErrorToast('Erro ao iniciar conversa');
    }
  };

  const handleSharePlant = (plant) => {
    navigation.navigate('SharePlant', { plant, receiverId: userId, receiverName: profile?.name });
  };

  const renderFriendshipButton = () => {
    if (isOwnProfile) return null;

    const status = profile?.friendshipStatus;

    if (status === 'accepted') {
      return (
        <View style={styles.friendBadge}>
          <Ionicons name="people" size={16} color={colors.botanical.base} />
          <Text style={styles.friendBadgeText}>Amigos</Text>
        </View>
      );
    }

    if (status === 'pending_sent') {
      return (
        <View style={[styles.actionButton, styles.pendingButton]}>
          <Ionicons name="time-outline" size={18} color={colors.botanical.sage} />
          <Text style={styles.pendingButtonText}>Solicitação enviada</Text>
        </View>
      );
    }

    if (status === 'pending_received') {
      return (
        <View style={styles.pendingReceivedContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAcceptRequest}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.botanical.base} />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={colors.botanical.base} />
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleRejectRequest}
            disabled={actionLoading}
          >
            <Ionicons name="close" size={18} color={colors.system.error} />
            <Text style={styles.rejectButtonText}>Recusar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleSendFriendRequest}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator size="small" color={colors.botanical.base} />
        ) : (
          <>
            <Ionicons name="person-add" size={18} color={colors.botanical.base} />
            <Text style={styles.actionButtonText}>Adicionar amigo</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderPlantItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.plantCard}
      onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
    >
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
        style={styles.plantImage}
      />
      <Text style={styles.plantName} numberOfLines={1}>{item.name}</Text>
      {item.plant_type && (
        <Text style={styles.plantType}>{item.plant_type}</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{profile?.name}</Text>
          <Text style={styles.userLevel}>{profile?.level || 'Iniciante'}</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_plants || 0}</Text>
              <Text style={styles.statLabel}>Plantas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.xp || 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.active_days || 0}</Text>
              <Text style={styles.statLabel}>Dias ativos</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {renderFriendshipButton()}
            
            {!isOwnProfile && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.messageButton]}
                onPress={handleStartChat}
              >
                <Ionicons name="chatbubble-outline" size={18} color={colors.botanical.clay} />
                <Text style={styles.messageButtonText}>Mensagem</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Plants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Plantas de {profile?.name?.split(' ')[0]}
          </Text>
          
          {plants.length > 0 ? (
            <FlatList
              data={plants}
              renderItem={renderPlantItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plantsListContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={40} color={colors.botanical.sage} />
              <Text style={styles.emptyText}>Nenhuma planta ainda</Text>
            </View>
          )}
        </View>

        {/* Badges Section */}
        {profile?.badges && profile.badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conquistas</Text>
            <View style={styles.badgesContainer}>
              {profile.badges.map((badge, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.botanical.sage + '30',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginTop: spacing.md,
  },
  userLevel: {
    fontSize: 14,
    color: colors.botanical.clay,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.botanical.sage + '30',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.botanical.clay,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  actionButtonText: {
    color: colors.botanical.base,
    fontWeight: '600',
    fontSize: 14,
  },
  pendingButton: {
    backgroundColor: colors.botanical.sage + '20',
  },
  pendingButtonText: {
    color: colors.botanical.sage,
    fontWeight: '600',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: colors.system.success,
  },
  acceptButtonText: {
    color: colors.botanical.base,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.system.error,
  },
  rejectButtonText: {
    color: colors.system.error,
    fontWeight: '600',
    fontSize: 14,
  },
  pendingReceivedContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.botanical.clay,
  },
  messageButtonText: {
    color: colors.botanical.clay,
    fontWeight: '600',
    fontSize: 14,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.system.success,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  friendBadgeText: {
    color: colors.botanical.base,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  plantsListContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  plantCard: {
    width: 120,
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  plantImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.botanical.sage + '20',
  },
  plantName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
    padding: spacing.sm,
  },
  plantType: {
    fontSize: 12,
    color: colors.botanical.sage,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.botanical.sage,
    marginTop: spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.botanical.clay + '20',
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    color: colors.botanical.clay,
    fontWeight: '600',
  },
});

export default UserProfileScreen;