/**
 * Tela de Grupos da Comunidade
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { groupService } from '../services/groupService';
import { showErrorToast } from '../components/Toast';

const GroupsScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      console.log('🔄 [GroupsScreen] Carregando grupos...');
      const data = await groupService.getMyGroups();
      console.log('✅ [GroupsScreen] Grupos carregados:', data?.length || 0);
      setGroups(data || []);
    } catch (error) {
      console.error('❌ [GroupsScreen] Erro ao carregar grupos:', error);
      console.error('❌ [GroupsScreen] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      setGroups([]);
      showErrorToast('Erro ao carregar grupos: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    const unsubscribe = navigation.addListener('focus', loadGroups);
    return unsubscribe;
  }, [loadGroups, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupChat', { group: item })}
      activeOpacity={0.7}
    >
      <View style={styles.groupImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.groupImage} />
        ) : (
          <View style={styles.groupImagePlaceholder}>
            <Ionicons name="people" size={28} color={colors.botanical.sage} />
          </View>
        )}
      </View>
      
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          {item.is_private && (
            <Ionicons name="lock-closed" size={14} color={colors.botanical.sage} />
          )}
        </View>
        {item.description && (
          <Text style={styles.groupDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.groupMeta}>
          <Ionicons name="people-outline" size={14} color={colors.botanical.sage} />
          <Text style={styles.memberCount}>{item.member_count} membro{item.member_count !== 1 ? 's' : ''}</Text>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.botanical.sage} />
    </TouchableOpacity>
  );

  if (loading) {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Grupos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Ionicons name="add" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={64} color={colors.botanical.sage} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum grupo ainda</Text>
            <Text style={styles.emptySubtitle}>
              Crie um grupo para conversar com seus amigos sobre plantas!
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Text style={styles.createButtonText}>Criar Grupo</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...textStyles.h3,
    flex: 1,
    textAlign: 'center',
    color: colors.botanical.dark,
    fontWeight: '700',
  },
  addButton: {
    padding: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.base,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  groupImageContainer: {
    marginRight: spacing.md,
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  groupName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.botanical.dark,
    flex: 1,
  },
  groupDescription: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    marginTop: 2,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  memberCount: {
    ...textStyles.caption,
    color: colors.botanical.sage,
  },
  adminBadge: {
    backgroundColor: colors.botanical.clay + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  adminText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.botanical.clay,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.botanical.dark,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...textStyles.body,
    color: colors.botanical.sage,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.botanical.clay,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  createButtonText: {
    ...textStyles.body,
    color: 'white',
    fontWeight: '600',
  },
});

export default GroupsScreen;
