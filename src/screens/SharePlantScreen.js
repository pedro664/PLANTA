/**
 * Tela de Compartilhamento de Planta
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { communityService } from '../services/communityService';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const SharePlantScreen = ({ navigation, route }) => {
  const { plant } = route.params;
  
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    try {
      const data = await communityService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      const data = await communityService.searchUsers(searchQuery);
      setSearchResults(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShare = async () => {
    if (!selectedUser) {
      showErrorToast('Selecione um usuário');
      return;
    }

    try {
      setIsSharing(true);
      await communityService.sharePlant(plant.id, selectedUser.id, message);
      showSuccessToast(`Planta compartilhada com ${selectedUser.name}!`);
      navigation.goBack();
    } catch (error) {
      showErrorToast('Erro ao compartilhar planta');
    } finally {
      setIsSharing(false);
    }
  };

  const renderUser = ({ item }) => {
    const user = item.friend || item;
    const isSelected = selectedUser?.id === user.id;

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => setSelectedUser(isSelected ? null : user)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: user.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userLevel}>{user.level || 'Iniciante'}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={20} color={colors.botanical.base} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const displayList = searchQuery.length >= 2 ? searchResults : friends;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compartilhar Planta</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Plant Preview */}
      <View style={styles.plantPreview}>
        <Image
          source={{ uri: plant.image_url || 'https://via.placeholder.com/60' }}
          style={styles.plantImage}
        />
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plant.name}</Text>
          {plant.scientific_name && (
            <Text style={styles.plantScientific}>{plant.scientific_name}</Text>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.botanical.sage} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar usuário..."
          placeholderTextColor={colors.botanical.sage}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.botanical.clay} />}
      </View>

      {/* User List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          {searchQuery.length >= 2 ? 'Resultados da busca' : 'Seus amigos'}
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.botanical.clay} />
          </View>
        ) : (
          <FlatList
            data={displayList}
            renderItem={renderUser}
            keyExtractor={item => item.friend?.id || item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={40} color={colors.botanical.sage} />
                <Text style={styles.emptyText}>
                  {searchQuery.length >= 2 
                    ? 'Nenhum usuário encontrado' 
                    : 'Você ainda não tem amigos'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Message Input */}
      {selectedUser && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Mensagem (opcional)</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Adicione uma mensagem..."
            placeholderTextColor={colors.botanical.sage}
            multiline
            maxLength={200}
          />
        </View>
      )}

      {/* Share Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.shareButton, !selectedUser && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={!selectedUser || isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={colors.botanical.base} />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color={colors.botanical.base} />
              <Text style={styles.shareButtonText}>
                {selectedUser ? `Compartilhar com ${selectedUser.name}` : 'Selecione um usuário'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  plantPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.botanical.sage + '30',
  },
  plantInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  plantScientific: {
    fontSize: 13,
    color: colors.botanical.sage,
    fontStyle: 'italic',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: colors.botanical.dark,
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.sage,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  userItemSelected: {
    backgroundColor: colors.botanical.clay + '10',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.botanical.sage + '30',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  userLevel: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.botanical.clay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.botanical.sage,
    marginTop: spacing.sm,
  },
  messageContainer: {
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 74, 61, 0.1)',
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.botanical.sage,
    marginBottom: spacing.xs,
  },
  messageInput: {
    backgroundColor: colors.botanical.base,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.botanical.dark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 74, 61, 0.1)',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.botanical.clay,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  shareButtonDisabled: {
    backgroundColor: colors.botanical.sage,
    opacity: 0.5,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.base,
  },
});

export default SharePlantScreen;