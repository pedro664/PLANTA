import React, { useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Image,
  Dimensions 
} from 'react-native';
import Text from '../components/Text';
import LazyImage from '../components/LazyImage';
import { getOptimizedFlatListProps, createGridItemLayout } from '../utils/performanceUtils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveGrid, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, layout } from '../theme/spacing';
const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, plants, getPlantsNeedingAttention, initializeUserData } = useAppContext();
  const insets = useSafeAreaInsets();
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveGrid = getResponsiveGrid(2);
  const responsiveSpacing = getResponsiveSpacing();
  
  // Initialize user data when component mounts
  useEffect(() => {
    initializeUserData();
  }, [initializeUserData]);
  
  // Level thresholds (XP needed for each level) - exactly like the original
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200];
  
  // Helper functions - exactly like the original
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

  // Get current time for greeting - exactly like the original
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Format current date - exactly like the original
  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('pt-BR', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  const plantsNeedingAttention = useMemo(() => getPlantsNeedingAttention(), [plants]);
  
  // Fallback user data to prevent crashes
  const safeUser = user || { 
    name: 'Usuário', 
    xp: 0, 
    level: 'Iniciante',
    total_plants: 0,
    active_days: 1,
    badges: []
  };

  // Calculate gamification data
  const currentLevel = useMemo(() => getUserLevel(safeUser.xp), [safeUser.xp]);
  const levelName = useMemo(() => getLevelName(currentLevel), [currentLevel]);
  const nextLevelXP = useMemo(() => getNextLevelXP(currentLevel), [currentLevel]);
  const xpProgress = useMemo(() => getXPProgress(safeUser.xp, currentLevel), [safeUser.xp, currentLevel]);
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => getFormattedDate(), []);

  // Memoized render item for better performance
  const renderPlantItem = useCallback(({ item, index }) => (
    <PlantCard plant={item} index={index} />
  ), [navigation]);

  // Memoized key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Status badge component - exactly like the original
  const StatusBadge = ({ status }) => {
    if (status === 'thirsty') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: colors.botanical.clay }]}>
          <Ionicons name="water" size={16} color="white" />
        </View>
      );
    } else if (status === 'attention') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
          <Ionicons name="warning" size={16} color="white" />
        </View>
      );
    }
    return null;
  };

  // Plant card component - exactly like the original design
  const PlantCard = ({ plant, index }) => (
    <TouchableOpacity 
      style={[styles.plantCard, { animationDelay: index * 100 }]}
      onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
      activeOpacity={0.95}
    >
      <View style={styles.plantImageContainer}>
        <LazyImage 
          source={{ uri: plant.image_url || null }} 
          style={styles.plantImage}
          placeholder="plant"
          showLoadingIndicator={true}
          resizeMode="cover"
        />
        <StatusBadge status={plant.status} />
      </View>
      <View style={styles.plantInfo}>
        <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
        <Text style={styles.plantScientific} numberOfLines={1}>{plant.scientific_name || 'Planta doméstica'}</Text>
      </View>
    </TouchableOpacity>
  );

  // Calculate proper bottom spacing considering tab bar and safe area
  const TAB_BAR_HEIGHT = 65;
  const bottomInset = Math.max(insets.bottom, 0);
  const fabBottomPosition = TAB_BAR_HEIGHT + bottomInset + 16;
  const contentBottomPadding = TAB_BAR_HEIGHT + bottomInset + 20;

  // Dynamic styles based on safe area and responsive design
  const dynamicStyles = {
    contentArea: {
      ...styles.contentArea,
      paddingBottom: contentBottomPadding,
      paddingHorizontal: responsiveSpacing,
    },
    fab: {
      ...styles.fab,
      bottom: fabBottomPosition,
      right: responsiveSpacing,
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
      <View style={dynamicStyles.contentArea}>
        {/* Gamification Card - exactly like the original */}
        <View style={styles.gamificationCard}>
          {/* Background blur effect */}
          <View style={styles.backgroundBlur} />
          
          <View style={styles.gamificationContent}>
            <View style={styles.gamificationHeader}>
              <View style={styles.greetingSection}>
                <Text style={styles.greetingText}>
                  {greeting}, {safeUser.name.split(' ')[0]}
                </Text>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <View style={styles.xpContainer}>
                  <Text style={styles.xpNumber}>{safeUser.xp}</Text>
                  <Text style={styles.xpLabel}>XP</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.levelSection}>
              <View style={styles.levelInfo}>
                <Text style={styles.levelText}>Nível {currentLevel}: {levelName}</Text>
                <Text style={styles.goalText}>Meta: {nextLevelXP} XP</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[styles.progressBarFill, { width: `${xpProgress}%` }]} 
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Plants Section Header */}
        <View style={styles.plantsHeader}>
          <Text style={styles.sectionTitle}>Suas Plantas</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('QRScanner')}
              style={styles.scanButton}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.botanical.clay} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Plants')}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plants Grid - Optimized FlatList */}
        <View style={styles.plantsScrollView}>
          <FlatList
            data={plants}
            renderItem={renderPlantItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.plantsContainer}
            columnWrapperStyle={styles.plantsRow}
            // Performance optimizations using utility
            {...getOptimizedFlatListProps('plantGrid', {
              getItemLayout: createGridItemLayout(200, 2, 16),
              initialNumToRender: 4,
              windowSize: 6,
            })}
          />
        </View>
      </View>

      {/* Floating Action Button - exactly like the original */}
      <TouchableOpacity 
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('AddPlant')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.botanical.base} />
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
  contentArea: {
    flex: 1,
    paddingHorizontal: spacing.lg, // 24px like the original
    paddingBottom: 85, // Adjusted for new tab bar height (65px + 20px margin)
  },

  // Gamification card styles - exactly like the original
  gamificationCard: {
    marginTop: 8, // mt-2 = 8px
    marginBottom: 32, // mb-8 = 32px
    padding: spacing.lg, // p-6 = 24px
    backgroundColor: colors.botanical.dark,
    borderRadius: 32, // rounded-[2rem] = 32px
    position: 'relative',
    overflow: 'hidden',
    shadowColor: 'rgba(46, 74, 61, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 8,
  },
  backgroundBlur: {
    position: 'absolute',
    right: -40, // -right-10 = -40px
    top: -40, // -top-10 = -40px
    width: 192, // w-48 = 192px
    height: 192, // h-48 = 192px
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 96,
    // blur-3xl effect would need a library like react-native-blur
  },
  gamificationContent: {
    position: 'relative',
    zIndex: 10,
  },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontFamily: 'Overlock-Italic',
    fontSize: 18, // text-lg
    fontWeight: '400',
    fontStyle: 'italic',
    color: colors.botanical.base,
    opacity: 0.9,
  },
  dateText: {
    fontFamily: 'Overlock-Regular',
    fontSize: 12, // text-xs
    fontWeight: '400',
    color: colors.botanical.base,
    opacity: 0.6,
    marginTop: 4, // mt-1 = 4px
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4, // gap-1 = 4px
    marginTop: 8, // mt-2 = 8px
  },
  xpNumber: {
    fontFamily: 'Overlock-Black',
    fontSize: 48, // text-5xl
    fontWeight: '900',
    letterSpacing: -1, // tracking-tight
    color: colors.botanical.base,
  },
  xpLabel: {
    fontFamily: 'Overlock-Bold',
    fontSize: 14, // text-sm
    fontWeight: '700',
    color: colors.botanical.base,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 2, // tracking-widest
  },

  levelSection: {
    marginTop: spacing.lg, // mt-6 = 24px
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // mb-2 = 8px
  },
  levelText: {
    fontFamily: 'Overlock-Regular',
    fontSize: 12, // text-xs
    fontWeight: '400',
    color: colors.botanical.base,
    opacity: 0.6,
  },
  goalText: {
    fontFamily: 'Overlock-Regular',
    fontSize: 12, // text-xs
    fontWeight: '400',
    color: colors.botanical.base,
    opacity: 0.6,
  },
  progressBarContainer: {
    height: 6, // h-1.5 = 6px
    width: '100%',
    backgroundColor: 'rgba(247, 245, 240, 0.1)', // bg-botanical-base/10
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.botanical.clay,
    borderRadius: 3,
  },

  // Plants section styles - exactly like the original
  plantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20, // mb-5 = 20px
  },
  sectionTitle: {
    fontFamily: 'Overlock-BoldItalic',
    fontSize: 20, // text-xl
    fontWeight: '700',
    fontStyle: 'italic',
    color: colors.botanical.dark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.ui.background,
    borderWidth: 1,
    borderColor: colors.botanical.clay + '20',
  },
  seeAllText: {
    fontFamily: 'Overlock-Bold',
    fontSize: 14, // text-sm
    fontWeight: '700',
    color: colors.botanical.clay,
  },
  plantsScrollView: {
    flex: 1,
    minHeight: 200, // Ensure minimum height for plants section
  },
  plantsContainer: {
    paddingBottom: 20, // Reduced padding to ensure content is visible
    flexGrow: 1,
  },
  plantsRow: {
    justifyContent: 'space-between',
  },

  // Plant card styles - responsive design (48% width for consistent 2-column grid)
  plantCard: {
    width: '48%',
    marginBottom: 16,
  },
  plantImageContainer: {
    aspectRatio: 4/5, // aspect-[4/5]
    borderRadius: 28, // rounded-[1.8rem]
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12, // mb-3 = 12px
    backgroundColor: colors.ui.background,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.95,
  },
  statusBadge: {
    position: 'absolute',
    top: 12, // top-3 = 12px
    right: 12, // right-3 = 12px
    width: 32, // w-8 = 32px
    height: 32, // h-8 = 32px
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    // animate-pulse would need animation implementation
  },
  plantInfo: {
    paddingLeft: 4, // pl-1 = 4px
  },
  plantName: {
    fontWeight: '700',
    fontSize: 18, // text-lg
    lineHeight: 22, // leading-tight
    color: colors.botanical.dark,
  },
  plantScientific: {
    fontSize: 12, // text-xs
    fontWeight: '400',
    fontStyle: 'italic',
    color: colors.botanical.sage,
    marginTop: 2, // mt-0.5 = 2px
  },

  // FAB styles - bottom position is set dynamically based on safe area
  fab: {
    position: 'absolute',
    // bottom is set dynamically in dynamicStyles
    right: spacing.lg, // right-6 = 24px
    width: 56, // Slightly smaller for better mobile experience
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.botanical.clay,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100, // Ensure FAB is always on top
  },
});

export default HomeScreen;
