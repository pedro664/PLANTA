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
  Dimensions
} from 'react-native';
// Temporarily disabled reanimated for compatibility
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   runOnJS,
// } from 'react-native-reanimated';
import Text from '../components/Text';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { showSuccessToast, showErrorToast } from '../components/Toast';
// Temporarily removed animation imports for debugging

const { width } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 65;

const PlantDetailScreen = ({ route, navigation }) => {
  const { plantId, plantData } = route.params || {};
  const { getPlantById, addCareLog, updatePlant, user } = useAppContext();
  const insets = useSafeAreaInsets();
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();
  
  // Calculate proper bottom spacing considering tab bar and safe area
  const bottomInset = Math.max(insets.bottom, 0);
  const fabBottomPosition = TAB_BAR_HEIGHT + bottomInset + 16;
  
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [careForm, setCareForm] = useState({
    type: 'water',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Animation values for modal (temporarily disabled)
  // const modalTranslateY = useSharedValue(1000);
  // const modalOpacity = useSharedValue(0);

  // Animation handlers (simplified)
  const openModal = () => {
    setCareModalVisible(true);
  };

  const closeModal = () => {
    setCareModalVisible(false);
    // Reset form
    setCareForm({
      type: 'water',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Get plant from local state or use passed plantData (for QR scanned plants from other users)
  const localPlant = getPlantById(plantId);
  const plant = localPlant || plantData;
  
  // Check if this plant belongs to the current user
  const isOwnPlant = plant && user && plant.user_id === user.id;

  // Animated styles for modal (temporarily disabled)
  // const modalAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: modalTranslateY.value }],
  //   opacity: modalOpacity.value,
  // }));

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.botanical.sage} />
          <Text style={styles.errorText}>Planta não encontrada</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper functions
  const getWaterFrequencyText = (frequency) => {
    const frequencies = {
      daily: 'Diariamente',
      every3days: 'A cada 3 dias',
      weekly: 'Semanalmente',
      biweekly: 'A cada 2 semanas',
      monthly: 'Mensalmente',
    };
    return frequencies[frequency] || frequency || 'Não definido';
  };

  const getLightNeedsText = (needs) => {
    const lightNeeds = {
      direct: 'Sol direto',
      indirect: 'Luz indireta',
      shade: 'Sombra',
      fullsun: 'Pleno sol',
      hybrid: 'Híbrido',
    };
    return lightNeeds[needs] || needs || 'Não definido';
  };

  const getPlantTypeText = (type) => {
    const types = {
      edible: 'Comestível',
      medicinal: 'Medicinal',
      ornamental: 'Ornamental',
      aromatic: 'Aromática',
      succulent: 'Suculenta',
      fruit: 'Frutífera',
      vegetable: 'Hortaliça',
      herb: 'Erva',
      flower: 'Flor',
      tree: 'Árvore',
      vine: 'Trepadeira',
      aquatic: 'Aquática',
      other: 'Outra',
    };
    return types[type] || type || null;
  };

  const getPlantTypeIcon = (type) => {
    const icons = {
      edible: 'restaurant',
      medicinal: 'medkit',
      ornamental: 'flower',
      aromatic: 'sparkles',
      succulent: 'water',
      fruit: 'nutrition',
      vegetable: 'leaf',
      herb: 'leaf',
      flower: 'rose',
      tree: 'git-branch',
      vine: 'git-merge',
      aquatic: 'water',
      other: 'ellipse',
    };
    return icons[type] || 'leaf';
  };

  const getFertilizerTypeText = (type) => {
    const types = {
      organic: 'Orgânico',
      chemical: 'Químico',
      npk: 'NPK',
      compost: 'Composto',
      humus: 'Húmus',
      bokashi: 'Bokashi',
      liquid: 'Líquido',
      slow_release: 'Liberação lenta',
      foliar: 'Foliar',
      none: 'Não aduba',
    };
    return types[type] || type || null;
  };

  const getPruningFrequencyText = (frequency) => {
    const frequencies = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      biannual: 'Semestral',
      annual: 'Anual',
      as_needed: 'Conforme necessário',
    };
    return frequencies[frequency] || frequency || null;
  };

  const getHarvestFrequencyText = (frequency) => {
    const frequencies = {
      daily: 'Diária',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      seasonal: 'Sazonal',
      annual: 'Anual',
    };
    return frequencies[frequency] || frequency || null;
  };

  const getCareTypeIcon = (type) => {
    const icons = {
      water: 'water',
      fertilize: 'leaf',
      prune: 'cut',
      repot: 'flower',
      other: 'ellipsis-horizontal',
    };
    return icons[type] || 'ellipsis-horizontal';
  };

  const getCareTypeText = (type) => {
    const types = {
      water: 'Rega',
      fertilize: 'Adubo',
      prune: 'Poda',
      repot: 'Replantio',
      other: 'Outro',
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle care log submission
  const handleCareSubmit = async () => {
    if (!careForm.type) {
      showErrorToast('Selecione o tipo de cuidado');
      return;
    }

    try {
      const careData = {
        care_type: careForm.type,
        notes: careForm.notes.trim() || null,
        care_date: new Date().toISOString(),
      };

      await addCareLog(plantId, careData);

      showSuccessToast('Cuidado registrado com sucesso!');
      
      // Close modal after a short delay to let user see the toast
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (error) {
      console.error('Error saving care log:', error);
      showErrorToast('Erro ao registrar cuidado. Tente novamente.');
    }
  };

  // Care log item component
  const CareLogItem = ({ log, isLast }) => (
    <View style={[styles.careLogItem, isLast && styles.careLogItemLast]}>
      <View style={styles.careLogIcon}>
        <Ionicons 
          name={getCareTypeIcon(log.type)} 
          size={16} 
          color={colors.botanical.clay} 
        />
      </View>
      <View style={styles.careLogContent}>
        <View style={styles.careLogHeader}>
          <Text style={styles.careLogType}>{getCareTypeText(log.type)}</Text>
          <Text style={styles.careLogDate}>{formatDateTime(log.date)}</Text>
        </View>
        {log.notes && (
          <Text style={styles.careLogNotes}>{log.notes}</Text>
        )}
      </View>
      {!isLast && <View style={styles.careLogLine} />}
    </View>
  );

  // Care type options for modal
  const careTypeOptions = [
    { value: 'water', label: 'Rega', icon: 'water' },
    { value: 'fertilize', label: 'Adubo', icon: 'leaf' },
    { value: 'prune', label: 'Poda', icon: 'cut' },
    { value: 'repot', label: 'Replantio', icon: 'flower' },
    { value: 'other', label: 'Outro', icon: 'ellipsis-horizontal' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{plant.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('SharePlant', { plant })}
          >
            <Ionicons name="share-social-outline" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setQrModalVisible(true)}
          >
            <Ionicons name="qr-code" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: safeAreaStyles.contentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Plant Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: plant.image_url || null }} style={styles.plantImage} />
          {plant.status !== 'fine' && (
            <View style={styles.statusBadge}>
              <Ionicons 
                name={plant.status === 'thirsty' ? 'water' : 'warning'} 
                size={20} 
                color="white" 
              />
            </View>
          )}
        </View>

        {/* Plant Info */}
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plant.name}</Text>
          {plant.scientific_name && (
            <Text style={styles.plantScientific}>{plant.scientific_name}</Text>
          )}
          {plant.description && (
            <Text style={styles.plantDescription}>{plant.description}</Text>
          )}
        </View>

        {/* Care Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Cuidado</Text>
          <View style={styles.careInfoGrid}>
            <View style={styles.careInfoItem}>
              <View style={styles.careInfoIcon}>
                <Ionicons name="water" size={20} color={colors.botanical.clay} />
              </View>
              <Text style={styles.careInfoLabel}>Rega</Text>
              <Text style={styles.careInfoValue}>{getWaterFrequencyText(plant.waterFrequency)}</Text>
            </View>
            <View style={styles.careInfoItem}>
              <View style={styles.careInfoIcon}>
                <Ionicons name="sunny" size={20} color={colors.botanical.clay} />
              </View>
              <Text style={styles.careInfoLabel}>Luz</Text>
              <Text style={styles.careInfoValue}>{getLightNeedsText(plant.lightNeeds)}</Text>
            </View>
          </View>
          <View style={styles.lastWateredContainer}>
            <Text style={styles.lastWateredLabel}>Última rega:</Text>
            <Text style={styles.lastWateredValue}>
              {plant.last_watered ? formatDate(plant.last_watered) : 'Nunca'}
            </Text>
          </View>
          
          {/* Plant dates */}
          {(plant.planted_date || plant.death_date) && (
            <View style={styles.plantDatesContainer}>
              {plant.planted_date && (
                <View style={styles.plantDateItem}>
                  <Text style={styles.plantDateLabel}>Plantada em:</Text>
                  <Text style={styles.plantDateValue}>{formatDate(plant.planted_date)}</Text>
                </View>
              )}
              {plant.death_date && (
                <View style={styles.plantDateItem}>
                  <Text style={styles.plantDateLabel}>Morreu em:</Text>
                  <Text style={styles.plantDateValue}>{formatDate(plant.death_date)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Plant Type Badge */}
        {plant.plant_type && getPlantTypeText(plant.plant_type) && (
          <View style={styles.section}>
            <View style={styles.plantTypeBadge}>
              <View style={styles.plantTypeIconContainer}>
                <Ionicons name={getPlantTypeIcon(plant.plant_type)} size={24} color={colors.botanical.clay} />
              </View>
              <View style={styles.plantTypeInfo}>
                <Text style={styles.plantTypeLabel}>Tipo de Planta</Text>
                <Text style={styles.plantTypeValue}>{getPlantTypeText(plant.plant_type)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Fertilizer Section */}
        {(plant.fertilizer_type || plant.fertilizer_info) && (
          <View style={styles.section}>
            <View style={styles.advancedSectionHeader}>
              <Ionicons name="leaf" size={20} color={colors.botanical.clay} />
              <Text style={styles.sectionTitle}>Adubação</Text>
            </View>
            <View style={styles.advancedInfoCard}>
              {plant.fertilizer_type && getFertilizerTypeText(plant.fertilizer_type) && (
                <View style={styles.advancedInfoRow}>
                  <Text style={styles.advancedInfoLabel}>Tipo:</Text>
                  <View style={styles.advancedInfoBadge}>
                    <Text style={styles.advancedInfoBadgeText}>{getFertilizerTypeText(plant.fertilizer_type)}</Text>
                  </View>
                </View>
              )}
              {plant.fertilizer_info && (
                <View style={styles.advancedInfoDescription}>
                  <Text style={styles.advancedInfoDescriptionText}>{plant.fertilizer_info}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Pruning Section */}
        {(plant.pruning_frequency || plant.pruning_info) && (
          <View style={styles.section}>
            <View style={styles.advancedSectionHeader}>
              <Ionicons name="cut" size={20} color={colors.botanical.clay} />
              <Text style={styles.sectionTitle}>Poda</Text>
            </View>
            <View style={styles.advancedInfoCard}>
              {plant.pruning_frequency && getPruningFrequencyText(plant.pruning_frequency) && (
                <View style={styles.advancedInfoRow}>
                  <Text style={styles.advancedInfoLabel}>Frequência:</Text>
                  <View style={styles.advancedInfoBadge}>
                    <Text style={styles.advancedInfoBadgeText}>{getPruningFrequencyText(plant.pruning_frequency)}</Text>
                  </View>
                </View>
              )}
              {plant.pruning_info && (
                <View style={styles.advancedInfoDescription}>
                  <Text style={styles.advancedInfoDescriptionText}>{plant.pruning_info}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Harvest Section */}
        {(plant.harvest_frequency || plant.harvest_info) && (
          <View style={styles.section}>
            <View style={styles.advancedSectionHeader}>
              <Ionicons name="basket" size={20} color={colors.botanical.clay} />
              <Text style={styles.sectionTitle}>Colheita</Text>
            </View>
            <View style={styles.advancedInfoCard}>
              {plant.harvest_frequency && getHarvestFrequencyText(plant.harvest_frequency) && (
                <View style={styles.advancedInfoRow}>
                  <Text style={styles.advancedInfoLabel}>Frequência:</Text>
                  <View style={styles.advancedInfoBadge}>
                    <Text style={styles.advancedInfoBadgeText}>{getHarvestFrequencyText(plant.harvest_frequency)}</Text>
                  </View>
                </View>
              )}
              {plant.harvest_info && (
                <View style={styles.advancedInfoDescription}>
                  <Text style={styles.advancedInfoDescriptionText}>{plant.harvest_info}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tips Section */}
        {plant.tips && plant.tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dicas de Cuidado</Text>
            {plant.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="bulb" size={16} color={colors.botanical.clay} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Care Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Cuidados</Text>
          {(plant.careLogs || plant.care_logs) && (plant.careLogs || plant.care_logs).length > 0 ? (
            <View style={styles.careTimeline}>
              {(plant.careLogs || plant.care_logs)
                .sort((a, b) => new Date(b.care_date || b.date) - new Date(a.care_date || a.date))
                .map((log, index, array) => (
                  <CareLogItem 
                    key={log.id} 
                    log={{
                      ...log,
                      type: log.care_type || log.type,
                      date: log.care_date || log.date
                    }} 
                    isLast={index === array.length - 1}
                  />
                ))}
            </View>
          ) : (
            <View style={styles.emptyTimeline}>
              <Ionicons name="time" size={32} color={colors.botanical.sage} />
              <Text style={styles.emptyTimelineText}>Nenhum cuidado registrado ainda</Text>
            </View>
          )}
        </View>

        {/* Comments Section */}
        {plant.comments && plant.comments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comentários da Comunidade</Text>
            {plant.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentDate}>{formatDate(comment.date)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button - Only show for own plants */}
      {isOwnPlant && (
        <TouchableOpacity 
          style={[styles.fab, { bottom: fabBottomPosition, right: responsiveSpacing }]}
          onPress={openModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.botanical.base} />
        </TouchableOpacity>
      )}

      {/* Care Log Modal */}
      <Modal
        visible={careModalVisible}
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
            <Text style={styles.modalTitle}>Registrar Cuidado</Text>
            <TouchableOpacity 
              onPress={handleCareSubmit}
              style={styles.modalButton}
            >
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Care Type Selection */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Tipo de Cuidado</Text>
              <View style={styles.careTypeGrid}>
                {careTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.careTypeOption,
                      careForm.type === option.value && styles.careTypeOptionSelected
                    ]}
                    onPress={() => setCareForm(prev => ({ ...prev, type: option.value }))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.careTypeOptionContent}>
                      <Ionicons 
                        name={option.icon} 
                        size={24} 
                        color={careForm.type === option.value ? colors.botanical.base : colors.botanical.clay} 
                      />
                      <Text style={[
                        styles.careTypeOptionText,
                        careForm.type === option.value && styles.careTypeOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Notas (opcional)</Text>
              <TextInput
                style={styles.modalTextInput}
                value={careForm.notes}
                onChangeText={(text) => setCareForm(prev => ({ ...prev, notes: text }))}
                placeholder="Adicione observações sobre o cuidado..."
                placeholderTextColor={colors.botanical.sage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* QR Code Modal */}
      <QRCodeGenerator
        plant={plant}
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141, 163, 153, 0.1)',
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    marginHorizontal: 16,
  },

  // Content styles
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Space for FAB and tab bar
  },

  // Image styles
  imageContainer: {
    height: width * 0.8,
    position: 'relative',
    marginBottom: spacing.lg,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.clay,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  // Plant info styles
  plantInfo: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  plantName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.botanical.sage,
    marginBottom: 12,
  },
  plantDescription: {
    fontSize: 16,
    color: colors.botanical.dark,
    lineHeight: 24,
  },

  // Section styles
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: spacing.md,
  },

  // Care info styles
  careInfoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  careInfoItem: {
    flex: 1,
    backgroundColor: colors.ui.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  careInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.clay + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  careInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.botanical.sage,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  careInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
    textAlign: 'center',
  },
  lastWateredContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
  },
  lastWateredLabel: {
    fontSize: 14,
    color: colors.botanical.sage,
  },
  lastWateredValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  plantDatesContainer: {
    marginTop: 12,
    gap: 8,
  },
  plantDateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
  },
  plantDateLabel: {
    fontSize: 14,
    color: colors.botanical.sage,
  },
  plantDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
  },

  // Plant Type Badge styles
  plantTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.clay + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.botanical.clay + '30',
  },
  plantTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.botanical.clay + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plantTypeInfo: {
    flex: 1,
  },
  plantTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.botanical.sage,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  plantTypeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.clay,
  },

  // Advanced Section styles
  advancedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  advancedInfoCard: {
    backgroundColor: colors.ui.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.botanical.sage + '20',
  },
  advancedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  advancedInfoLabel: {
    fontSize: 14,
    color: colors.botanical.sage,
    fontWeight: '500',
  },
  advancedInfoBadge: {
    backgroundColor: colors.botanical.clay + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  advancedInfoBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.clay,
  },
  advancedInfoDescription: {
    backgroundColor: colors.botanical.base,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  advancedInfoDescriptionText: {
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },

  // Tips styles
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },

  // Care timeline styles
  careTimeline: {
    backgroundColor: colors.ui.background,
    borderRadius: 16,
    padding: 16,
  },
  careLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: 16,
  },
  careLogItemLast: {
    paddingBottom: 0,
  },
  careLogIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.botanical.clay + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  careLogContent: {
    flex: 1,
  },
  careLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  careLogType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  careLogDate: {
    fontSize: 12,
    color: colors.botanical.sage,
  },
  careLogNotes: {
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },
  careLogLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: colors.botanical.sage + '30',
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.ui.background,
    borderRadius: 16,
  },
  emptyTimelineText: {
    fontSize: 14,
    color: colors.botanical.sage,
    marginTop: 8,
  },

  // Comments styles
  commentItem: {
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentDate: {
    fontSize: 12,
    color: colors.botanical.sage,
  },

  // FAB styles - bottom position should be set dynamically
  fab: {
    position: 'absolute',
    bottom: 100, // Default fallback, should be overridden dynamically
    right: spacing.lg,
    width: 56,
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
    zIndex: 100,
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
  careTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careTypeOption: {
    width: (width - 48 - 24) / 3, // 3 columns with gaps
    aspectRatio: 1,
    backgroundColor: colors.ui.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 8,
  },
  careTypeOptionSelected: {
    backgroundColor: colors.botanical.clay,
    borderColor: colors.botanical.clay,
  },
  careTypeOptionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 6, // Space between icon and text
  },
  careTypeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.botanical.dark,
    textAlign: 'center',
  },
  careTypeOptionTextSelected: {
    color: colors.botanical.base,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: colors.botanical.sage + '40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.botanical.dark,
    backgroundColor: colors.ui.background,
    height: 80,
    textAlignVertical: 'top',
  },

  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: colors.botanical.sage,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.botanical.clay,
    borderRadius: 24,
    marginTop: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.base,
  },
});

export default PlantDetailScreen;