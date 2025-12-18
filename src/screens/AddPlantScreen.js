import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useUniversalImagePicker } from '../components/UniversalImagePicker';
import { showSuccessToast, showErrorToast } from '../components/Toast';
import { catalogService, PLANT_CATEGORIES, formatCatalogPlant } from '../services/catalogService';

const AddPlantScreen = ({ navigation }) => {
  const { addPlant } = useAppContext();
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();

  // Estados do formulário
  const [step, setStep] = useState(1); // 1: foto, 2: selecionar planta, 3: confirmar
  const [formData, setFormData] = useState({
    image: null,
    imageFile: null,
    plantedDate: new Date().toISOString().split('T')[0],
    selectedPlant: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // Estados para o catálogo do banco de dados
  const [catalogPlants, setCatalogPlants] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState(null);

  const { pickImage: pickUniversalImage } = useUniversalImagePicker();


  // Carregar plantas do catálogo
  const loadCatalogPlants = useCallback(async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    
    try {
      const plants = await catalogService.getFilteredPlants(selectedCategory, searchQuery);
      setCatalogPlants(plants);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      setCatalogError('Não foi possível carregar o catálogo de plantas');
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [selectedCategory, searchQuery]);

  // Carregar catálogo quando mudar categoria ou busca
  useEffect(() => {
    if (step === 2) {
      const debounceTimer = setTimeout(() => {
        loadCatalogPlants();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [step, selectedCategory, searchQuery, loadCatalogPlants]);

  // Selecionar imagem
  const pickImage = async () => {
    try {
      setUploadStatus('Selecionando foto...');
      const result = await pickUniversalImage({
        aspect: [3, 4],
        quality: 0.8,
      });

      if (result && result.uri) {
        setFormData((prev) => ({
          ...prev,
          image: result.uri,
          imageFile: result,
        }));
        setUploadStatus(null);
        setStep(2);
      } else {
        setUploadStatus(null);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      setUploadStatus(null);
      showErrorToast('Não foi possível selecionar a foto.');
    }
  };

  // Selecionar planta do catálogo
  const selectPlant = (plant) => {
    const formattedPlant = formatCatalogPlant(plant);
    setFormData((prev) => ({ ...prev, selectedPlant: formattedPlant }));
    setStep(3);
  };

  // Salvar planta
  const handleSave = async () => {
    if (!formData.imageFile || !formData.selectedPlant) {
      showErrorToast('Selecione uma foto e uma planta');
      return;
    }

    setIsLoading(true);
    setUploadStatus('Salvando sua planta...');

    try {
      const plant = formData.selectedPlant;

      const newPlantData = {
        name: plant.name,
        scientific_name: plant.scientific_name,
        description: plant.description,
        imageFile: formData.imageFile,
        water_frequency: plant.care.water_frequency,
        light_needs: plant.care.light_needs,
        planted_date: formData.plantedDate
          ? new Date(formData.plantedDate).toISOString()
          : new Date().toISOString(),
        plant_type: plant.category,
        fertilizer_type: plant.fertilizer?.type || null,
        fertilizer_info: plant.fertilizer?.description || null,
        pruning_frequency: plant.pruning?.frequency || null,
        pruning_info: plant.pruning?.description || null,
        harvest_frequency: plant.harvest?.frequency || null,
        harvest_info: plant.harvest?.description || null,
        catalog_id: plant.id,
      };

      await addPlant(newPlantData);

      setUploadStatus(null);
      showSuccessToast('Planta adicionada com sucesso!');

      setTimeout(() => {
        setIsLoading(false);
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar planta:', error);
      setUploadStatus(null);
      setIsLoading(false);
      showErrorToast('Erro ao salvar a planta.');
    }
  };


  // Renderizar item da planta
  const renderPlantItem = ({ item }) => (
    <TouchableOpacity
      style={styles.plantItem}
      onPress={() => selectPlant(item)}
      activeOpacity={0.8}
    >
      <View style={styles.plantItemIcon}>
        <Text style={styles.plantItemEmoji}>{item.image_placeholder}</Text>
      </View>
      <View style={styles.plantItemInfo}>
        <Text style={styles.plantItemName}>{item.name}</Text>
        <Text style={styles.plantItemScientific}>{item.scientific_name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.botanical.sage} />
    </TouchableOpacity>
  );

  // Renderizar categoria
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipSelected,
      ]}
      onPress={() =>
        setSelectedCategory(selectedCategory === item.id ? null : item.id)
      }
      activeOpacity={0.8}
    >
      <Text style={styles.categoryEmoji}>{item.icon}</Text>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Renderizar lista vazia ou erro
  const renderEmptyList = () => {
    if (isLoadingCatalog) {
      return (
        <View style={styles.emptyList}>
          <ActivityIndicator size="large" color={colors.botanical.clay} />
          <Text style={styles.emptyText}>Carregando catálogo...</Text>
        </View>
      );
    }

    if (catalogError) {
      return (
        <View style={styles.emptyList}>
          <Ionicons name="cloud-offline" size={48} color={colors.botanical.sage} />
          <Text style={styles.emptyText}>{catalogError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCatalogPlants}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyList}>
        <Ionicons name="leaf-outline" size={48} color={colors.botanical.sage} />
        <Text style={styles.emptyText}>Nenhuma planta encontrada</Text>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step > 1 && !isLoading) {
                setStep(step - 1);
              } else if (!isLoading) {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 && 'Adicionar Foto'}
            {step === 2 && 'Escolher Planta'}
            {step === 3 && 'Confirmar'}
          </Text>
          <View style={styles.headerRight}>
            {step === 3 && (
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.botanical.base} />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
        </View>

        {/* Upload Status */}
        {uploadStatus && (
          <View style={styles.uploadStatusBar}>
            <ActivityIndicator size="small" color={colors.botanical.clay} />
            <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
          </View>
        )}

        {/* Step 1: Foto */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <Ionicons name="camera" size={64} color={colors.botanical.sage} />
              <Text style={styles.stepTitle}>Tire uma foto da sua planta</Text>
              <Text style={styles.stepDescription}>
                Fotografe sua planta para começar a registrar seu crescimento
              </Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={24} color={colors.botanical.base} />
                <Text style={styles.photoButtonText}>Tirar Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Selecionar Planta */}
        {step === 2 && (
          <View style={styles.selectContainer}>
            {formData.image && (
              <View style={styles.photoPreviewSmall}>
                <Image source={{ uri: formData.image }} style={styles.previewImageSmall} />
              </View>
            )}

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.botanical.sage} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar planta..."
                placeholderTextColor={colors.botanical.sage}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.botanical.sage} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={PLANT_CATEGORIES}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />

            <FlatList
              data={catalogPlants}
              renderItem={renderPlantItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.plantsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyList}
            />
          </View>
        )}


        {/* Step 3: Confirmar */}
        {step === 3 && formData.selectedPlant && (
          <ScrollView
            style={styles.confirmContainer}
            contentContainerStyle={styles.confirmContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.confirmHeader}>
              {formData.image && (
                <Image source={{ uri: formData.image }} style={styles.confirmImage} />
              )}
              <View style={styles.confirmInfo}>
                <Text style={styles.confirmName}>{formData.selectedPlant.name}</Text>
                <Text style={styles.confirmScientific}>
                  {formData.selectedPlant.scientific_name}
                </Text>
                <Text style={styles.confirmDescription}>
                  {formData.selectedPlant.description}
                </Text>
              </View>
            </View>

            <View style={styles.dateSection}>
              <Text style={styles.sectionLabel}>Data de Plantio</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.botanical.sage}
                value={formData.plantedDate}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, plantedDate: text }))
                }
                maxLength={10}
              />
            </View>

            <View style={styles.careSection}>
              <Text style={styles.sectionLabel}>Cuidados Necessários</Text>

              <View style={styles.careItem}>
                <Ionicons name="water" size={20} color={colors.botanical.clay} />
                <View style={styles.careItemInfo}>
                  <Text style={styles.careItemTitle}>Rega</Text>
                  <Text style={styles.careItemValue}>
                    {formData.selectedPlant.care.water_description}
                  </Text>
                </View>
              </View>

              <View style={styles.careItem}>
                <Ionicons name="sunny" size={20} color={colors.botanical.clay} />
                <View style={styles.careItemInfo}>
                  <Text style={styles.careItemTitle}>Luz</Text>
                  <Text style={styles.careItemValue}>
                    {formData.selectedPlant.care.light_description}
                  </Text>
                </View>
              </View>

              <View style={styles.careItem}>
                <Ionicons name="thermometer" size={20} color={colors.botanical.clay} />
                <View style={styles.careItemInfo}>
                  <Text style={styles.careItemTitle}>Temperatura</Text>
                  <Text style={styles.careItemValue}>
                    {formData.selectedPlant.care.temperature.ideal}
                  </Text>
                </View>
              </View>

              {formData.selectedPlant.harvest?.frequency && (
                <View style={styles.careItem}>
                  <Ionicons name="basket" size={20} color={colors.botanical.clay} />
                  <View style={styles.careItemInfo}>
                    <Text style={styles.careItemTitle}>Colheita</Text>
                    <Text style={styles.careItemValue}>
                      {formData.selectedPlant.growth.harvest_days}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {formData.selectedPlant.tips && formData.selectedPlant.tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={styles.sectionLabel}>Dicas</Text>
                {formData.selectedPlant.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="bulb" size={16} color={colors.botanical.clay} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141, 163, 153, 0.1)',
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  saveButton: {
    backgroundColor: colors.botanical.clay,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.base,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: colors.botanical.sage + '30',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: colors.botanical.clay,
  },
  uploadStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    backgroundColor: colors.botanical.clay + '10',
  },
  uploadStatusText: {
    fontSize: 14,
    color: colors.botanical.clay,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stepContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.botanical.sage,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.botanical.clay,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.base,
  },
  selectContainer: {
    flex: 1,
  },
  photoPreviewSmall: {
    height: 100,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImageSmall: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ui.background,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.botanical.dark,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ui.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: colors.botanical.clay,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.botanical.dark,
  },
  categoryTextSelected: {
    color: colors.botanical.base,
  },
  plantsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  plantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ui.background,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  plantItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.botanical.clay + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  plantItemEmoji: {
    fontSize: 24,
  },
  plantItemInfo: {
    flex: 1,
  },
  plantItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginBottom: 2,
  },
  plantItemScientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.botanical.sage,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.botanical.sage,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.botanical.clay,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.base,
  },
  confirmContainer: {
    flex: 1,
  },
  confirmContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  confirmHeader: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  confirmImage: {
    width: 100,
    height: 130,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  confirmInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  confirmName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: 4,
  },
  confirmScientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.botanical.sage,
    marginBottom: 8,
  },
  confirmDescription: {
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },
  dateSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: spacing.sm,
  },
  dateInput: {
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.botanical.dark,
  },
  careSection: {
    marginBottom: spacing.lg,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.ui.background,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  careItemInfo: {
    flex: 1,
  },
  careItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginBottom: 2,
  },
  careItemValue: {
    fontSize: 14,
    color: colors.botanical.sage,
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: spacing.lg,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.sm,
    backgroundColor: colors.ui.background,
    padding: spacing.md,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },
});

export default AddPlantScreen;
