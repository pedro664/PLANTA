import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
// Temporarily disabled reanimated for compatibility
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   runOnJS,
// } from 'react-native-reanimated';
import Text from '../components/Text';
import Badge from '../components/Badge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useUniversalImagePicker } from '../components/UniversalImagePicker';
import { showSuccessToast, showErrorToast } from '../components/Toast';
// Temporarily removed animation imports for debugging

const ProfileScreen = ({ navigation }) => {
  const { user, plants, updateUser, signOut } = useAppContext();
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();

  // BUG FIX #4: Guard clause para prevenir null reference quando user é resetado durante logout
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.scrollView, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator 
            size="large" 
            color={colors.botanical.clay} 
          />
        </View>
      </SafeAreaView>
    );
  }

  // Level thresholds and helper functions - exactly like the original
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200];
  
  const getUserLevel = (xp) => {
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (xp >= levelThresholds[i]) {
        return i;
      }
    }
    return 0;
  };

  const getLevelName = (level) => {
    const names = ["Semente", "Broto", "Muda", "Planta Jovem", "Planta Adulta", "Árvore", "Árvore Antiga", "Floresta", "Jardim Botânico", "Mestre Jardineiro"];
    return names[level] || "Semente";
  };

  const getNextLevelXP = (level) => {
    if (level >= levelThresholds.length - 1) {
      return levelThresholds[levelThresholds.length - 1];
    }
    return levelThresholds[level + 1];
  };

  const getCurrentLevelXP = (level) => {
    return levelThresholds[level] || 0;
  };

  const getXPProgress = (xp, level) => {
    const currentLevelXP = getCurrentLevelXP(level);
    const nextLevelXP = getNextLevelXP(level);
    const progressXP = xp - currentLevelXP;
    const totalNeeded = nextLevelXP - currentLevelXP;
    return Math.min(100, Math.round((progressXP / totalNeeded) * 100));
  };

  const calculateActiveDays = () => {
    // Suporta tanto joinDate quanto join_date (formato do banco)
    const joinDateValue = user?.joinDate || user?.join_date || '2023-01-15';
    const joinDate = new Date(joinDateValue);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Badge definitions - todas as badges disponíveis
  const badgeDefinitions = {
    first_plant: {
      name: "Primeira Planta",
      icon: "leaf",
      color: '#4CAF50'
    },
    plant_collector: {
      name: "Colecionador",
      icon: "albums",
      color: colors.botanical.clay
    },
    plant_lover: {
      name: "Amante de Plantas",
      icon: "heart",
      color: '#E91E63'
    },
    dedicated_caretaker: {
      name: "Cuidador Dedicado",
      icon: "heart-circle",
      color: '#E91E63'
    },
    water_master: {
      name: "Mestre da Água",
      icon: "water",
      color: '#2196F3'
    },
    green_thumb: {
      name: "Polegar Verde",
      icon: "thumbs-up",
      color: '#8BC34A'
    },
    dedication: {
      name: "Dedicação",
      icon: "trophy",
      color: '#FF9800'
    },
    expert: {
      name: "Especialista",
      icon: "ribbon",
      color: '#9C27B0'
    },
    community_star: {
      name: "Estrela da Comunidade",
      icon: "star",
      color: '#FFC107'
    }
  };

  // Calculate profile data
  const totalPlants = plants.length;
  const activeDays = calculateActiveDays();
  const totalBadges = user.badges?.length || 0;
  const currentLevel = getUserLevel(user.xp);
  const levelName = getLevelName(currentLevel);
  const nextLevelXP = getNextLevelXP(currentLevel);
  const xpProgress = getXPProgress(user.xp, currentLevel);
  const joinYear = new Date(user?.joinDate || user?.join_date || '2023-01-15').getFullYear();



  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    username: user.username || '',
    avatar: user.avatar_url,
  });

  // Animation values for modal (temporarily disabled)
  // const modalTranslateY = useSharedValue(1000);
  // const modalOpacity = useSharedValue(0);

  // Animation handlers (simplified)
  const openModal = () => {
    setEditForm({
      name: user.name,
      username: user.username || '',
      avatar: user.avatar_url,
    });
    setEditModalVisible(true);
  };

  const closeModal = () => {
    setEditModalVisible(false);
  };

  const handleEditProfile = () => {
    openModal();
  };

  // Animated styles for modal (temporarily disabled)
  // const modalAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: modalTranslateY.value }],
  //   opacity: modalOpacity.value,
  // }));

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      showErrorToast('Nome é obrigatório');
      return;
    }

    // Validar username se fornecido
    if (editForm.username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(editForm.username)) {
        showErrorToast('Username deve ter 3-20 caracteres (letras, números e _)');
        return;
      }
    }

    try {
      // Update user data
      const updateData = {
        name: editForm.name.trim(),
        username: editForm.username.trim().toLowerCase() || null,
        avatarFile: editForm.avatarFile, // Pass the image file for upload
      };

      await updateUser(updateData);
      
      showSuccessToast('Perfil atualizado com sucesso!');
      
      // Close modal after a short delay to let user see the toast
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('username')) {
        showErrorToast('Este username já está em uso');
      } else {
        showErrorToast('Erro ao atualizar perfil. Tente novamente.');
      }
    }
  };

  const { pickImage } = useUniversalImagePicker();

  const handleChangeAvatar = async () => {
    try {
      const result = await pickImage({
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (result && result.uri) {
        setEditForm(prev => ({
          ...prev,
          avatar: result.uri,
          avatarFile: result // Save the full result for upload
        }));
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
      showErrorToast('Não foi possível alterar a foto. Tente novamente.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => {
          try {
            await signOut();
            // Navigation will be handled automatically by the auth state change
          } catch (error) {
            console.error('Erro ao fazer logout:', error);
            showErrorToast('Erro ao fazer logout. Tente novamente.');
          }
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { 
          paddingHorizontal: responsiveSpacing,
          paddingBottom: safeAreaStyles.contentPaddingBottom 
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar_url || null }} style={styles.avatar} />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          {user.username && (
            <Text style={styles.usernameText}>@{user.username}</Text>
          )}
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <Text style={styles.levelText}>Nível {currentLevel}: {levelName}</Text>
              <Text style={styles.xpText}>{user.xp} / {nextLevelXP} XP</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[styles.progressBarFill, { width: `${xpProgress}%` }]} 
                />
              </View>
            </View>
            <Text style={styles.progressText}>{xpProgress}% até o próximo nível</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPlants}</Text>
            <Text style={styles.statLabel}>PLANTAS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeDays}</Text>
            <Text style={styles.statLabel}>DIAS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalBadges}</Text>
            <Text style={styles.statLabel}>BADGES</Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesContainer}
          >
            {/* Earned badges */}
            {user.badges?.map(badgeId => (
              <Badge key={badgeId} badgeId={badgeId} isEarned={true} />
            ))}
            
            {/* Locked badges (show 2 examples) */}
            {Object.keys(badgeDefinitions)
              .filter(id => !user.badges?.includes(id))
              .slice(0, 2)
              .map(badgeId => (
                <Badge key={badgeId} badgeId={badgeId} isEarned={false} />
              ))
            }
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('MyPosts')}
            activeOpacity={0.98}
          >
            <Text style={styles.actionButtonText}>Meus Posts</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.botanical.sage} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditProfile}
            activeOpacity={0.98}
          >
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.botanical.sage} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLogout}
            activeOpacity={0.98}
          >
            <Text style={[styles.actionButtonText, styles.logoutText]}>Sair</Text>
            <Ionicons name="log-out-outline" size={20} color="#FCA5A5" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={closeModal}
              style={styles.modalButton}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity 
              onPress={handleSaveProfile}
              style={styles.modalButton}
            >
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Avatar Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Foto do Perfil</Text>
              <View style={styles.avatarEditContainer}>
                <Image source={{ uri: editForm.avatar }} style={styles.avatarEdit} />
                <TouchableOpacity 
                  style={styles.avatarEditButton}
                  onPress={handleChangeAvatar}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={20} color={colors.botanical.base} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Nome</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Seu nome"
                placeholderTextColor={colors.botanical.sage}
              />
            </View>

            {/* Username Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Username</Text>
              <View style={styles.usernameInputContainer}>
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  style={styles.usernameInput}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="seu_username"
                  placeholderTextColor={colors.botanical.sage}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
              <Text style={styles.usernameHint}>3-20 caracteres: letras, números e _</Text>
            </View>

            {/* Info Section */}
            <View style={styles.modalSection}>
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color={colors.botanical.clay} />
                <Text style={styles.infoText}>
                  Outras informações como XP, nível e badges são calculadas automaticamente baseadas na sua atividade.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80, // Adjusted space for new tab bar height
  },

  // Profile header styles - exactly like the original
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  avatarContainer: {
    width: 128, // w-32 = 128px
    height: 128, // h-32 = 128px
    borderRadius: 64,
    borderWidth: 4,
    borderColor: colors.ui.background,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: 'rgba(46, 74, 61, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userName: {
    fontSize: 24, // text-2xl
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  usernameText: {
    color: colors.botanical.sage,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 4,
  },

  // XP section styles - exactly like the original
  xpSection: {
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  xpCard: {
    backgroundColor: colors.ui.background,
    borderRadius: 32, // rounded-2xl = 32px
    padding: 20, // p-5 = 20px
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8, // mb-2 = 8px
  },
  levelText: {
    fontSize: 14, // text-sm
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  xpText: {
    fontSize: 12, // text-xs
    color: colors.botanical.sage,
  },
  progressBarContainer: {
    height: 8, // h-2 = 8px
    width: '100%',
    backgroundColor: 'rgba(141, 163, 153, 0.1)', // bg-botanical-sage/10
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.botanical.clay,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12, // text-xs
    color: colors.botanical.sage,
    marginTop: 8, // mt-2 = 8px
    textAlign: 'center',
  },

  // Statistics styles - exactly like the original
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32, // gap-8 = 32px
    marginBottom: 32, // mb-8 = 32px
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(141, 163, 153, 0.1)', // border-botanical-sage/10
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24, // text-2xl
    fontWeight: '900',
    color: colors.botanical.dark,
  },
  statLabel: {
    fontSize: 12, // text-xs
    fontWeight: '700',
    color: colors.botanical.sage,
    textTransform: 'uppercase',
    letterSpacing: 1, // tracking-wider
  },

  // Badges section styles - exactly like the original
  badgesSection: {
    width: '100%',
    marginBottom: 32, // mb-8 = 32px
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '700',
    fontStyle: 'italic',
    color: colors.botanical.dark,
    marginBottom: spacing.md,
    paddingHorizontal: 8, // px-2 = 8px
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 16, // gap-4 = 16px
    paddingHorizontal: 8, // px-2 = 8px
    paddingBottom: spacing.md,
  },


  // Action buttons styles - exactly like the original
  actionsSection: {
    width: '100%',
    gap: 8, // space-y-2 = 8px
  },
  actionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.ui.background,
    borderRadius: 32, // rounded-2xl = 32px
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  logoutText: {
    fontWeight: '700',
    color: '#F87171', // text-red-400
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141, 163, 153, 0.1)',
  },
  modalButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.botanical.sage,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.clay,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: 12,
  },

  // Avatar edit styles
  avatarEditContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarEdit: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.ui.background,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: '50%',
    transform: [{ translateX: 40 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.clay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.botanical.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Input styles
  modalTextInput: {
    borderWidth: 1,
    borderColor: colors.botanical.sage + '40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.botanical.dark,
    backgroundColor: colors.ui.background,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.botanical.sage + '40',
    borderRadius: 12,
    backgroundColor: colors.ui.background,
  },
  usernamePrefix: {
    paddingLeft: 16,
    fontSize: 16,
    color: colors.botanical.sage,
    fontWeight: '600',
  },
  usernameInput: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 16,
    color: colors.botanical.dark,
  },
  usernameHint: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginTop: 6,
  },

  // Info card styles
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.botanical.clay + '10',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.botanical.clay,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },
});

export default ProfileScreen;
