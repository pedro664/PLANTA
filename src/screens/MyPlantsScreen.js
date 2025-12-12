import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Dimensions,
  Alert
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
import { spacing, borderRadius } from '../theme/spacing';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const { width } = Dimensions.get('window');
const cardWidth = (width - (spacing.md * 3)) / 2; // 2 columns with margins

const MyPlantsScreen = ({ navigation }) => {
  const { plants, getPlantsNeedingAttention, deletePlant } = useAppContext();
  const [filter, setFilter] = useState('all');
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveGrid = getResponsiveGrid(2);
  const responsiveSpacing = getResponsiveSpacing();

  // Get filtered plants based on current filter
  const getFilteredPlants = () => {
    if (filter === 'attention') {
      return getPlantsNeedingAttention();
    }
    return plants;
  };

  const filteredPlants = useMemo(() => getFilteredPlants(), [filter, plants]);
  const attentionCount = useMemo(() => getPlantsNeedingAttention().length, [plants]);

  // Memoized render item for better performance
  const renderPlantItem = useCallback(({ item, index }) => (
    <PlantCard plant={item} index={index} />
  ), [navigation]);

  // Memoized key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Handle edit plant
  const handleEditPlant = (plant) => {
    navigation.navigate('EditPlant', { plant });
  };

  // Handle delete plant
  const handleDeletePlant = (plant) => {
    Alert.alert(
      'Excluir Planta',
      `Tem certeza que deseja excluir "${plant.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteSelectedPlant(plant.id)
        },
      ]
    );
  };

  // Delete plant
  const deleteSelectedPlant = async (plantId) => {
    try {
      await deletePlant(plantId);
      showSuccessToast('Planta excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting plant:', error);
      showErrorToast('Erro ao excluir planta');
    }
  };

  // Status badge component matching the original design
  const StatusBadge = ({ status }) => {
    const getBadgeConfig = () => {
      switch (status) {
        case 'thirsty':
          return {
            color: '#3B82F6', // blue-500
            icon: 'water',
            animated: true
          };
        case 'attention':
          return {
            color: '#F59E0B', // amber-500
            icon: 'warning',
            animated: true
          };
        default:
          return {
            color: '#10B981', // green-500
            icon: 'checkmark',
            animated: false
          };
      }
    };

    const config = getBadgeConfig();

    return (
      <View style={[
        styles.statusBadge, 
        { backgroundColor: config.color },
        config.animated && styles.statusBadgeAnimated
      ]}>
        <Ionicons 
          name={config.icon} 
          size={16} 
          color="white" 
        />
      </View>
    );
  };

  // Plant card component matching the original design exactly
  const PlantCard = ({ plant, index }) => {
    const getStatusText = (status) => {
      switch (status) {
        case 'thirsty':
          return 'Precisa de água';
        case 'attention':
          return 'Precisa de atenção';
        default:
          return 'Saudável';
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'thirsty':
          return '#93C5FD'; // blue-300
        case 'attention':
          return '#FCD34D'; // amber-300
        default:
          return '#86EFAC'; // green-300
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'thirsty':
          return 'water';
        case 'attention':
          return 'warning';
        default:
          return 'checkmark';
      }
    };

    return (
      <TouchableOpacity 
        style={[
          styles.plantCard,
          {
            marginLeft: index % 2 === 0 ? 0 : spacing.sm,
            marginRight: index % 2 === 0 ? spacing.sm : 0,
          }
        ]}
        onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
        activeOpacity={0.95}
      >
        {/* Plant image with aspect ratio 3:4 */}
        <View style={styles.imageContainer}>
          <LazyImage 
            source={{ uri: plant.image_url || null }} 
            style={styles.plantImage}
            placeholder="plant"
            showLoadingIndicator={true}
            resizeMode="cover"
          />
          
          {/* Status badge */}
          <StatusBadge status={plant.status} />
        </View>
        
        {/* Plant info overlay with gradient effect - exactly like the original */}
        <View style={styles.plantInfoOverlay}>
          {/* Gradient background simulation */}
          <View style={styles.gradientOverlay} />
          
          <View style={styles.plantInfoContent}>
            <View style={styles.plantNameContainer}>
              <Text style={styles.plantName} numberOfLines={1}>
                {plant.name}
              </Text>
              <Text style={styles.plantScientific} numberOfLines={1}>
                {plant.scientific_name || 'Planta doméstica'}
              </Text>
            </View>
            
            {/* Quick status info */}
            <View style={styles.statusContainer}>
              <View style={styles.statusInfo}>
                <Ionicons 
                  name={getStatusIcon(plant.status)} 
                  size={12} 
                  color={getStatusColor(plant.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(plant.status) }]}>
                  {getStatusText(plant.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditPlant(plant);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color={colors.botanical.sage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePlant(plant);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={16} color={colors.system.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const isFilteredEmpty = filter === 'attention' && filteredPlants.length === 0;
    
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons 
            name="leaf-outline" 
            size={40} 
            color={colors.botanical.clay} 
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isFilteredEmpty 
            ? 'Todas as plantas estão bem!' 
            : 'Nenhuma planta encontrada'
          }
        </Text>
        <Text style={styles.emptySubtitle}>
          {isFilteredEmpty 
            ? 'Nenhuma planta precisa de atenção no momento.' 
            : 'Adicione sua primeira planta clicando no botão abaixo'
          }
        </Text>
      </View>
    );
  };

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Dynamic styles based on safe area and responsive design
  const dynamicStyles = {
    contentArea: {
      ...styles.contentArea,
      paddingBottom: safeAreaStyles.contentPaddingBottom,
      paddingHorizontal: responsiveSpacing,
    },
    fab: {
      ...styles.fab,
      bottom: safeAreaStyles.fabBottom,
      right: responsiveSpacing,
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={dynamicStyles.contentArea}>
        {/* Header with Filter Buttons and Scanner */}
        <View style={styles.headerContainer}>
          <View style={styles.filterContainer}>
            {renderFilterButton('all', 'Todas')}
            {renderFilterButton('attention', 'Precisam de Atenção')}
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('QRScanner')}
            style={styles.scanButton}
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.botanical.clay} />
          </TouchableOpacity>
        </View>

        {/* Plants count indicator - exactly like the original */}
        <View style={styles.countContainer}>
          {filter === 'all' ? (
            <Text style={styles.countText}>
              <Text style={styles.countNumber}>{plants.length}</Text> plantas no total
              {attentionCount > 0 && (
                <Text style={styles.attentionText}> • <Text style={styles.attentionNumber}>{attentionCount}</Text> precisam de atenção</Text>
              )}
            </Text>
          ) : (
            <Text style={styles.countText}>
              <Text style={styles.countNumber}>{filteredPlants.length}</Text> plantas precisam de atenção
            </Text>
          )}
        </View>

        {/* Plants Grid or Empty State */}
        {filteredPlants.length > 0 ? (
          <FlatList
            key={`plants-grid-${responsiveGrid.columns}`}
            data={filteredPlants}
            renderItem={renderPlantItem}
            keyExtractor={keyExtractor}
            numColumns={responsiveGrid.columns}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            // Performance optimizations using utility
            {...getOptimizedFlatListProps('plantGrid', {
              getItemLayout: createGridItemLayout(responsiveGrid.itemWidth * (3/4) + 20, responsiveGrid.columns, 20),
            })}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Floating Action Button - exactly like the original */}
      <TouchableOpacity 
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('AddPlant')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.botanical.base} />
      </TouchableOpacity>
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

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  // Filter styles - exactly like the original
  filterContainer: {
    flexDirection: 'row',
    gap: 12, // 3 * 4px = 12px
    flex: 1,
  },
  scanButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.ui.background,
    borderWidth: 1,
    borderColor: colors.botanical.clay + '20',
    marginLeft: 12,
  },
  filterButton: {
    paddingHorizontal: 20, // px-5 = 20px
    paddingVertical: 8, // py-2 = 8px
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.1)', // border-botanical-dark/10
    backgroundColor: colors.ui.background,
  },
  filterButtonActive: {
    backgroundColor: colors.botanical.dark,
    borderColor: colors.botanical.dark,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontFamily: 'Overlock-Bold',
    fontSize: 12, // text-xs
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  filterButtonTextActive: {
    fontFamily: 'Overlock-Bold',
    color: colors.ui.background,
  },

  // Count indicator - exactly like the original
  countContainer: {
    marginBottom: spacing.md,
  },
  countText: {
    fontFamily: 'Overlock-Regular',
    fontSize: 14, // text-sm
    color: colors.botanical.sage,
  },
  countNumber: {
    fontFamily: 'Overlock-Bold',
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  attentionText: {
    fontFamily: 'Overlock-Regular',
    color: colors.botanical.sage,
  },
  attentionNumber: {
    fontFamily: 'Overlock-Bold',
    color: colors.botanical.clay,
  },

  // Grid styles
  gridContainer: {
    paddingBottom: 20, // Reduced to ensure content is visible above tab bar
  },
  itemSeparator: {
    height: 20, // gap-5 = 20px
  },

  // Plant card styles - responsive design
  plantCard: {
    width: Math.floor(cardWidth), // Ensure integer width
    marginBottom: 20, // gap-5 = 20px
    backgroundColor: colors.ui.background,
    borderRadius: 28, // rounded-[1.8rem] ≈ 28px
    overflow: 'hidden',
    shadowColor: 'rgba(46, 74, 61, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 8,
  },
  imageContainer: {
    aspectRatio: 3/4, // aspect-[3/4]
    position: 'relative',
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  },
  statusBadgeAnimated: {
    // This would need a proper animation implementation
    // For now, we'll use a simple opacity animation
  },

  // Plant info overlay - exactly like the original with gradient
  plantInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Enough height to cover the text area
    backgroundColor: 'transparent',
    // Simulate gradient with multiple overlays
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    // Create gradient effect using shadow and background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 0,
  },
  plantInfoContent: {
    position: 'relative',
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  plantNameContainer: {
    flexDirection: 'column',
    marginBottom: 8, // mt-2 = 8px
  },
  plantName: {
    fontFamily: 'Overlock-Bold',
    color: colors.ui.background,
    fontSize: 14, // text-sm
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  plantScientific: {
    fontFamily: 'Overlock-Italic',
    color: 'rgba(255, 255, 255, 0.7)', // text-white/70
    fontSize: 12, // text-xs
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3 = 12px
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1 = 4px
  },
  statusText: {
    fontFamily: 'Overlock-Regular',
    fontSize: 12, // text-xs
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Empty state styles - exactly like the original
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48, // py-12 = 48px
    textAlign: 'center',
  },
  emptyIconContainer: {
    width: 80, // w-20 = 80px
    height: 80, // h-20 = 80px
    backgroundColor: 'rgba(141, 163, 153, 0.1)', // bg-botanical-sage/10
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Overlock-Bold',
    fontSize: 18, // text-lg
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    marginBottom: 8, // mb-2 = 8px
  },
  emptySubtitle: {
    fontFamily: 'Overlock-Regular',
    fontSize: 14, // text-sm
    color: colors.botanical.sage,
    textAlign: 'center',
  },

  // Action buttons styles
  actionButtons: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // FAB styles - adjusted for new tab bar height
  fab: {
    position: 'absolute',
    bottom: 80, // Adjusted for new tab bar height (65px + 15px margin)
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
  },
});

export default MyPlantsScreen;
