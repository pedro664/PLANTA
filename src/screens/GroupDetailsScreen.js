/**
 * Tela de Detalhes do Grupo
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { groupService } from '../services/groupService';
import { useAppContext } from '../context/AppContext';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const GroupDetailsScreen = ({ navigation, route }) => {
  const { group: initialGroup } = route.params;
  const { user: currentUser } = useAppContext();
  
  const [group, setGroup] = useState(initialGroup);
  const [members, setMembers] = useState([]);
  const [friendsToAdd, setFriendsToAdd] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleChangeGroupImage = async () => {
    if (!isAdmin) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showErrorToast('Permissão necessária para acessar fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        const imageUrl = await groupService.uploadGroupImage(result.assets[0].uri, group.id);
        await groupService.updateGroup(group.id, { image_url: imageUrl });
        setGroup(prev => ({ ...prev, image_url: imageUrl }));
        showSuccessToast('Foto do grupo atualizada!');
      }
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      showErrorToast('Erro ao atualizar foto');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [groupData, membersData] = await Promise.all([
        groupService.getGroupById(group.id),
        groupService.getGroupMembers(group.id),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      
      const currentMember = membersData.find(m => m.user?.id === currentUser?.id);
      setIsAdmin(currentMember?.role === 'admin');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [group.id, currentUser?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadFriendsToAdd = async () => {
    try {
      const friends = await groupService.getFriendsNotInGroup(group.id);
      setFriendsToAdd(friends);
      setShowAddModal(true);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
      showErrorToast('Erro ao carregar amigos');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await groupService.addMember(group.id, userId);
      showSuccessToast('Membro adicionado!');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      showErrorToast(error.message || 'Erro ao adicionar membro');
    }
  };

  const handleRemoveMember = (member) => {
    const confirmRemove = () => {
      Alert.alert('Remover Membro', `Remover ${member.user?.name} do grupo?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await groupService.removeMember(group.id, member.user?.id);
            showSuccessToast('Membro removido');
            loadData();
          } catch (error) {
            showErrorToast('Erro ao remover membro');
          }
        }},
      ]);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remover ${member.user?.name} do grupo?`)) {
        groupService.removeMember(group.id, member.user?.id).then(() => {
          showSuccessToast('Membro removido');
          loadData();
        }).catch(() => showErrorToast('Erro ao remover membro'));
      }
    } else {
      confirmRemove();
    }
  };

  const handleLeaveGroup = () => {
    const leave = async () => {
      try {
        await groupService.leaveGroup(group.id);
        showSuccessToast('Você saiu do grupo');
        navigation.navigate('Groups');
      } catch (error) {
        showErrorToast('Erro ao sair do grupo');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja sair do grupo?')) leave();
    } else {
      Alert.alert('Sair do Grupo', 'Tem certeza que deseja sair?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: leave },
      ]);
    }
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <Image
        source={{ uri: item.user?.avatar_url || 'https://via.placeholder.com/48' }}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.user?.name}</Text>
        <Text style={styles.memberRole}>
          {item.role === 'admin' ? 'Administrador' : 'Membro'}
        </Text>
      </View>
      {isAdmin && item.user?.id !== currentUser?.id && item.role !== 'admin' && (
        <TouchableOpacity onPress={() => handleRemoveMember(item)} style={styles.removeButton}>
          <Ionicons name="close-circle" size={24} color={colors.system.error} />
        </TouchableOpacity>
      )}
    </View>
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
        <Text style={styles.headerTitle}>Detalhes do Grupo</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Group Info */}
            <View style={styles.groupInfoSection}>
              <View style={styles.avatarEditContainer}>
                <TouchableOpacity 
                  style={styles.groupAvatar} 
                  onPress={handleChangeGroupImage}
                  disabled={!isAdmin || isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="large" color={colors.botanical.clay} />
                  ) : group.image_url ? (
                    <Image source={{ uri: group.image_url }} style={styles.groupAvatarImage} />
                  ) : (
                    <Ionicons name="people" size={48} color={colors.botanical.sage} />
                  )}
                </TouchableOpacity>
                {isAdmin && !isUploadingImage && (
                  <TouchableOpacity 
                    style={styles.cameraOverlay}
                    onPress={handleChangeGroupImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={20} color={colors.botanical.base} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.groupName}>{group.name}</Text>
              {group.description && <Text style={styles.groupDescription}>{group.description}</Text>}
              <View style={styles.groupMeta}>
                {group.is_private && <Ionicons name="lock-closed" size={14} color={colors.botanical.sage} />}
                <Text style={styles.memberCount}>{members.length} membro{members.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Actions */}
            {isAdmin && (
              <TouchableOpacity style={styles.actionButton} onPress={loadFriendsToAdd}>
                <Ionicons name="person-add" size={20} color={colors.botanical.clay} />
                <Text style={styles.actionButtonText}>Adicionar Membro</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Membros</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={20} color={colors.system.error} />
            <Text style={styles.leaveButtonText}>Sair do Grupo</Text>
          </TouchableOpacity>
        }
      />

      {/* Add Member Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Amigo</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.botanical.dark} />
              </TouchableOpacity>
            </View>
            {friendsToAdd.length === 0 ? (
              <View style={styles.emptyFriends}>
                <Text style={styles.emptyFriendsText}>Todos os seus amigos já estão no grupo</Text>
              </View>
            ) : (
              <FlatList
                data={friendsToAdd}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.friendItem} onPress={() => handleAddMember(item.id)}>
                    <Image source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }} style={styles.friendAvatar} />
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Ionicons name="add-circle" size={24} color={colors.botanical.clay} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ui.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  backButton: { padding: spacing.xs },
  headerTitle: { ...textStyles.h3, flex: 1, textAlign: 'center', color: colors.botanical.dark, fontWeight: '700' },
  listContent: { padding: spacing.md },
  groupInfoSection: { alignItems: 'center', paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.botanical.sand, marginBottom: spacing.lg },
  avatarEditContainer: { alignItems: 'center', position: 'relative', marginBottom: spacing.md },
  groupAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.botanical.sand, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.ui.background },
  groupAvatarImage: { width: 112, height: 112, borderRadius: 56 },
  cameraOverlay: { position: 'absolute', bottom: 0, right: '50%', transform: [{ translateX: 40 }], width: 40, height: 40, borderRadius: 20, backgroundColor: colors.botanical.clay, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.botanical.base, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  groupName: { ...textStyles.h2, color: colors.botanical.dark, fontWeight: '700', marginBottom: spacing.xs },
  groupDescription: { ...textStyles.body, color: colors.botanical.sage, textAlign: 'center', paddingHorizontal: spacing.lg },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  memberCount: { ...textStyles.caption, color: colors.botanical.sage },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.botanical.clay + '15', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg, gap: spacing.sm },
  actionButtonText: { ...textStyles.body, color: colors.botanical.clay, fontWeight: '600' },
  sectionTitle: { ...textStyles.body, fontWeight: '700', color: colors.botanical.dark, marginBottom: spacing.md },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.botanical.base, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
  memberInfo: { flex: 1 },
  memberName: { ...textStyles.body, fontWeight: '600', color: colors.botanical.dark },
  memberRole: { ...textStyles.caption, color: colors.botanical.sage },
  removeButton: { padding: spacing.xs },
  leaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, marginTop: spacing.xl, gap: spacing.sm },
  leaveButtonText: { ...textStyles.body, color: colors.system.error, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.ui.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '70%', padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...textStyles.h3, color: colors.botanical.dark, fontWeight: '700' },
  emptyFriends: { padding: spacing.xl, alignItems: 'center' },
  emptyFriendsText: { ...textStyles.body, color: colors.botanical.sage, textAlign: 'center' },
  friendItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.botanical.sand },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.md },
  friendName: { ...textStyles.body, flex: 1, color: colors.botanical.dark },
});

export default GroupDetailsScreen;
