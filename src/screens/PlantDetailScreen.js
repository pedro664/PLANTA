import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Switch,
  FlatList,
} from 'react-native';
import Text from '../components/Text';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { showSuccessToast, showErrorToast } from '../components/Toast';
import { evolutionService } from '../services/evolutionService';
import { useUniversalImagePicker } from '../components/UniversalImagePicker';
import { catalogService, formatCatalogPlant } from '../services/catalogService';

const { width } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 65;

const PlantDetailScreen = ({ route, navigation }) => {
  const { plantId, plantData } = route.params || {};
  const { getPlantById, addCareLog, updatePlant, user, plants, refreshData } = useAppContext();
  const insets = useSafeAreaInsets();
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();
  
  // Calculate proper bottom spacing considering tab bar and safe area
  const bottomInset = Math.max(insets.bottom, 0);
  const fabBottomPosition = TAB_BAR_HEIGHT + bottomInset + 16;
  
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [evolutionModalVisible, setEvolutionModalVisible] = useState(false);
  const [evolutions, setEvolutions] = useState([]);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [savingEvolution, setSavingEvolution] = useState(false);
  const [savingToMyPlants, setSavingToMyPlants] = useState(false);
  const [careForm, setCareForm] = useState({
    type: 'water',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [evolutionForm, setEvolutionForm] = useState({
    image: null,
    imageFile: null,
    description: '',
    shareToFeed: false,
  });
  
  // Estado para dados do catálogo (carregados do banco de dados)
  const [catalogData, setCatalogData] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const { pickImage: pickUniversalImage } = useUniversalImagePicker();

  // Carregar dados do catálogo do banco de dados
  const loadCatalogData = useCallback(async () => {
    const localPlant = getPlantById(plantId);
    const currentPlant = localPlant || plantData;
    
    if (!currentPlant?.catalog_id) return;
    
    setLoadingCatalog(true);
    try {
      const data = await catalogService.getPlantById(currentPlant.catalog_id);
      if (data) {
        setCatalogData(formatCatalogPlant(data));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do catálogo:', error);
    } finally {
      setLoadingCatalog(false);
    }
  }, [plantId, plantData, getPlantById]);

  // Carregar evoluções da planta
  const loadEvolutions = useCallback(async () => {
    if (!plantId) return;
    setLoadingEvolutions(true);
    try {
      const data = await evolutionService.getPlantEvolutions(plantId);
      setEvolutions(data);
    } catch (error) {
      console.error('Erro ao carregar evoluções:', error);
    } finally {
      setLoadingEvolutions(false);
    }
  }, [plantId]);

  useEffect(() => {
    loadEvolutions();
    loadCatalogData();
  }, [loadEvolutions, loadCatalogData]);

  // Animation handlers (simplified)
  const openModal = () => {
    setCareModalVisible(true);
  };

  const closeModal = () => {
    setCareModalVisible(false);
    setCareForm({
      type: 'water',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Evolution modal handlers
  const openEvolutionModal = () => {
    setEvolutionModalVisible(true);
  };

  const closeEvolutionModal = () => {
    setEvolutionModalVisible(false);
    setEvolutionForm({
      image: null,
      imageFile: null,
      description: '',
      shareToFeed: false,
    });
  };

  // Selecionar imagem para evolução
  const pickEvolutionImage = async () => {
    try {
      const result = await pickUniversalImage({
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result && result.uri) {
        setEvolutionForm((prev) => ({
          ...prev,
          image: result.uri,
          imageFile: result,
        }));
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      showErrorToast('Não foi possível selecionar a foto');
    }
  };

  // Salvar evolução
  const handleSaveEvolution = async () => {
    if (!evolutionForm.imageFile) {
      showErrorToast('Selecione uma foto para registrar a evolução');
      return;
    }

    setSavingEvolution(true);
    try {
      const evolutionData = {
        imageFile: evolutionForm.imageFile,
        description: evolutionForm.description.trim() || null,
        evolution_date: new Date().toISOString(),
      };

      const newEvolution = await evolutionService.createEvolution(
        user.id,
        plantId,
        evolutionData
      );

      // Se o usuário quiser compartilhar na comunidade
      if (evolutionForm.shareToFeed) {
        navigation.navigate('CreatePost', {
          prefillData: {
            image: evolutionForm.image,
            imageFile: evolutionForm.imageFile,
            description: evolutionForm.description || `Nova evolução da minha ${plant.name}! 🌱`,
            plantId: plantId,
            evolutionId: newEvolution.id,
          },
        });
      }

      showSuccessToast('Evolução registrada com sucesso!');
      await loadEvolutions();
      closeEvolutionModal();
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
      showErrorToast('Erro ao registrar evolução');
    } finally {
      setSavingEvolution(false);
    }
  };

  // Deletar evolução
  const handleDeleteEvolution = (evolutionId) => {
    Alert.alert(
      'Excluir Evolução',
      'Tem certeza que deseja excluir este registro de evolução?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await evolutionService.deleteEvolution(evolutionId);
              showSuccessToast('Evolução excluída');
              loadEvolutions();
            } catch (error) {
              showErrorToast('Erro ao excluir evolução');
            }
          },
        },
      ]
    );
  };

  // Get plant from local state or use passed plantData (for QR scanned plants from other users)
  const localPlant = getPlantById(plantId);
  const plant = localPlant || plantData;
  
  // Check if this plant belongs to the current user
  const isOwnPlant = plant && user && plant.user_id === user.id;

  // Check if user already has a copy of this plant (by name and scientific name)
  const alreadyHasPlant = plants?.some(
    (p) =>
      p.name === plant?.name &&
      p.scientific_name === plant?.scientific_name &&
      p.user_id === user?.id
  );

  // Função para adicionar planta às "Minhas Plantas"
  const handleAddToMyPlants = async () => {
    if (!plant || !user) return;

    Alert.alert(
      'Adicionar Planta',
      `Deseja adicionar "${plant.name}" às suas plantas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Adicionar',
          onPress: async () => {
            setSavingToMyPlants(true);
            try {
              // Criar uma cópia da planta para o usuário atual
              const newPlantData = {
                name: plant.name,
                scientific_name: plant.scientific_name || null,
                description: plant.description || `Planta adicionada via QR Code`,
                water_frequency: plant.water_frequency || 'weekly',
                light_needs: plant.light_needs || 'indirect',
                plant_type: plant.plant_type || null,
                fertilizer_type: plant.fertilizer_type || null,
                fertilizer_info: plant.fertilizer_info || null,
                pruning_frequency: plant.pruning_frequency || null,
                pruning_info: plant.pruning_info || null,
                harvest_frequency: plant.harvest_frequency || null,
                harvest_info: plant.harvest_info || null,
                // Usar a mesma imagem da planta original
                image_url: plant.image_url,
              };

              // Usar o serviço de plantas para criar uma cópia
              const { plantService } = await import('../services/plantService');
              const newPlant = await plantService.createPlantFromQR(user.id, newPlantData);

              showSuccessToast(`"${plant.name}" adicionada às suas plantas!`);
              
              // Recarregar dados do usuário para atualizar a lista de plantas
              await refreshData();
              
              // Navegar para a nova planta
              navigation.replace('PlantDetail', { plantId: newPlant.id });
            } catch (error) {
              console.error('Erro ao adicionar planta:', error);
              showErrorToast('Erro ao adicionar planta. Tente novamente.');
            } finally {
              setSavingToMyPlants(false);
            }
          },
        },
      ]
    );
  };

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
      harvest: 'basket',
      repot: 'flower',
      pest_control: 'bug',
      clean: 'sparkles',
      other: 'ellipsis-horizontal',
    };
    return icons[type] || 'ellipsis-horizontal';
  };

  const getCareTypeText = (type) => {
    const types = {
      water: 'Rega',
      fertilize: 'Adubo',
      prune: 'Poda',
      harvest: 'Colheita',
      repot: 'Replantio',
      pest_control: 'Controle de Pragas',
      clean: 'Limpeza',
      other: 'Outro',
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não definido';
    
    // Criar data a partir da string ISO
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return 'Data inválida';
    
    // Usar UTC para evitar problemas de fuso horário
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo', // Fuso horário do Brasil
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

  // Função para obter a última data de um tipo específico de cuidado
  const getLastCareDate = (careType) => {
    const careLogs = plant.careLogs || plant.care_logs || [];
    const careLogsOfType = careLogs.filter(log => 
      (log.care_type || log.type) === careType
    );
    
    if (careLogsOfType.length === 0) return null;
    
    // Ordenar por data decrescente e pegar o primeiro
    const sortedLogs = careLogsOfType.sort((a, b) => 
      new Date(b.care_date || b.date) - new Date(a.care_date || a.date)
    );
    
    return sortedLogs[0].care_date || sortedLogs[0].date;
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
    { value: 'harvest', label: 'Colheita', icon: 'basket' },
    { value: 'repot', label: 'Replantio', icon: 'flower' },
    { value: 'pest_control', label: 'Controle de Pragas', icon: 'bug' },
    { value: 'clean', label: 'Limpeza', icon: 'sparkles' },
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
              <Text style={styles.careInfoValue}>{getWaterFrequencyText(plant.water_frequency)}</Text>
            </View>
            <View style={styles.careInfoItem}>
              <View style={styles.careInfoIcon}>
                <Ionicons name="sunny" size={20} color={colors.botanical.clay} />
              </View>
              <Text style={styles.careInfoLabel}>Luz</Text>
              <Text style={styles.careInfoValue}>{getLightNeedsText(plant.light_needs)}</Text>
            </View>
          </View>
          <View style={styles.lastCareContainer}>
            <View style={styles.lastCareItem}>
              <Text style={styles.lastCareLabel}>Última rega:</Text>
              <Text style={styles.lastCareValue}>
                {getLastCareDate('water') ? formatDate(getLastCareDate('water')) : 'Nunca'}
              </Text>
            </View>
            
            {getLastCareDate('fertilize') && (
              <View style={styles.lastCareItem}>
                <Text style={styles.lastCareLabel}>Última adubação:</Text>
                <Text style={styles.lastCareValue}>
                  {formatDate(getLastCareDate('fertilize'))}
                </Text>
              </View>
            )}
            
            {getLastCareDate('prune') && (
              <View style={styles.lastCareItem}>
                <Text style={styles.lastCareLabel}>Última poda:</Text>
                <Text style={styles.lastCareValue}>
                  {formatDate(getLastCareDate('prune'))}
                </Text>
              </View>
            )}
            
            {getLastCareDate('harvest') && (
              <View style={styles.lastCareItem}>
                <Text style={styles.lastCareLabel}>Última colheita:</Text>
                <Text style={styles.lastCareValue}>
                  {formatDate(getLastCareDate('harvest'))}
                </Text>
              </View>
            )}
          </View>
          
          {/* Plant dates */}
          {(plant.created_at || plant.death_date) && (
            <View style={styles.plantDatesContainer}>
              {plant.created_at && (
                <View style={styles.plantDateItem}>
                  <Text style={styles.plantDateLabel}>Plantada em:</Text>
                  <Text style={styles.plantDateValue}>{formatDate(plant.created_at)}</Text>
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

        {/* Care Instructions Section - Using catalog data from database */}
        {(() => {
          // catalogData já está carregado do banco de dados via useEffect
          
          return (
            <View style={styles.section}>
              <View style={styles.advancedSectionHeader}>
                <Ionicons name="book" size={20} color={colors.botanical.clay} />
                <Text style={styles.sectionTitle}>Instruções de Cuidados</Text>
              </View>
              
              {/* Rega */}
              <View style={styles.careInstructionCard}>
                <View style={styles.careInstructionHeader}>
                  <View style={styles.careInstructionIconContainer}>
                    <Ionicons name="water" size={18} color={colors.botanical.clay} />
                  </View>
                  <Text style={styles.careInstructionPhase}>Rega</Text>
                </View>
                <View style={styles.careInstructionContent}>
                  <View style={styles.careInstructionItem}>
                    <Ionicons name="time" size={16} color={colors.botanical.sage} />
                    <Text style={styles.careInstructionText}>
                      {catalogData?.care?.water_description || `Frequência: ${getWaterFrequencyText(plant.water_frequency)}`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Luz */}
              <View style={styles.careInstructionCard}>
                <View style={styles.careInstructionHeader}>
                  <View style={styles.careInstructionIconContainer}>
                    <Ionicons name="sunny" size={18} color={colors.botanical.clay} />
                  </View>
                  <Text style={styles.careInstructionPhase}>Luz</Text>
                </View>
                <View style={styles.careInstructionContent}>
                  <View style={styles.careInstructionItem}>
                    <Ionicons name="sunny-outline" size={16} color={colors.botanical.sage} />
                    <Text style={styles.careInstructionText}>
                      {catalogData?.care?.light_description || getLightNeedsText(plant.light_needs)}
                    </Text>
                  </View>
                  {catalogData?.care?.temperature && (
                    <View style={styles.careInstructionItem}>
                      <Ionicons name="thermometer" size={16} color={colors.botanical.sage} />
                      <Text style={styles.careInstructionText}>
                        Temperatura ideal: {catalogData.care.temperature.ideal}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Solo - do catálogo */}
              {catalogData?.care?.soil && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="earth" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Solo</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    <View style={styles.careInstructionItem}>
                      <Ionicons name="information-circle" size={16} color={colors.botanical.sage} />
                      <Text style={styles.careInstructionText}>
                        {catalogData.care.soil}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Adubação */}
              {(catalogData?.fertilizer || plant.fertilizer_info) && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="leaf" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Adubação</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    <View style={styles.careInstructionItem}>
                      <Ionicons name="flask" size={16} color={colors.botanical.sage} />
                      <Text style={styles.careInstructionText}>
                        {catalogData?.fertilizer?.description || plant.fertilizer_info}
                      </Text>
                    </View>
                    {catalogData?.fertilizer?.frequency && (
                      <View style={styles.careInstructionItem}>
                        <Ionicons name="calendar" size={16} color={colors.botanical.sage} />
                        <Text style={styles.careInstructionText}>
                          {catalogData.fertilizer.frequency}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Poda */}
              {(catalogData?.pruning?.needed || plant.pruning_info) && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="cut" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Poda</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    <View style={styles.careInstructionItem}>
                      <Ionicons name="information-circle" size={16} color={colors.botanical.sage} />
                      <Text style={styles.careInstructionText}>
                        {catalogData?.pruning?.description || plant.pruning_info}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Colheita */}
              {(catalogData?.harvest?.frequency || plant.harvest_info) && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="basket" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Colheita</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    {catalogData?.growth?.harvest_days && (
                      <View style={styles.careInstructionItem}>
                        <Ionicons name="time" size={16} color={colors.botanical.sage} />
                        <Text style={styles.careInstructionText}>
                          Tempo: {catalogData.growth.harvest_days}
                        </Text>
                      </View>
                    )}
                    <View style={styles.careInstructionItem}>
                      <Ionicons name="information-circle" size={16} color={colors.botanical.sage} />
                      <Text style={styles.careInstructionText}>
                        {catalogData?.harvest?.description || plant.harvest_info}
                      </Text>
                    </View>
                    {catalogData?.harvest?.signs && (
                      <View style={styles.careInstructionItem}>
                        <Ionicons name="eye" size={16} color={colors.botanical.sage} />
                        <Text style={styles.careInstructionText}>
                          Sinais: {catalogData.harvest.signs}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Crescimento - do catálogo */}
              {catalogData?.growth && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="trending-up" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Crescimento</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    {catalogData.growth.germination_days && (
                      <View style={styles.careInstructionItem}>
                        <Ionicons name="leaf" size={16} color={colors.botanical.sage} />
                        <Text style={styles.careInstructionText}>
                          Germinação: {catalogData.growth.germination_days}
                        </Text>
                      </View>
                    )}
                    {catalogData.growth.plant_spacing && (
                      <View style={styles.careInstructionItem}>
                        <Ionicons name="resize" size={16} color={colors.botanical.sage} />
                        <Text style={styles.careInstructionText}>
                          Espaçamento: {catalogData.growth.plant_spacing}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Dicas - do catálogo */}
              {catalogData?.tips && catalogData.tips.length > 0 && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="bulb" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Dicas</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    {catalogData.tips.map((tip, index) => (
                      <View key={index} style={styles.careInstructionItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.botanical.sage} />
                        <Text style={styles.careInstructionText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Pragas - do catálogo */}
              {catalogData?.pests && catalogData.pests.length > 0 && (
                <View style={styles.careInstructionCard}>
                  <View style={styles.careInstructionHeader}>
                    <View style={styles.careInstructionIconContainer}>
                      <Ionicons name="bug" size={18} color={colors.botanical.clay} />
                    </View>
                    <Text style={styles.careInstructionPhase}>Pragas Comuns</Text>
                  </View>
                  <View style={styles.careInstructionContent}>
                    <View style={styles.careInstructionItem}>
                      <Ionicons name="warning" size={16} color={colors.botanical.sage} />
                      <Text style={styles.careInstructionText}>
                        {catalogData.pests.join(', ')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Mensagem se não houver dados do catálogo */}
              {!catalogData && !plant.fertilizer_info && !plant.pruning_info && !plant.harvest_info && (
                <View style={styles.noCareInfoContainer}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.botanical.sage} />
                  <Text style={styles.noCareInfoText}>
                    Para ver instruções detalhadas, crie uma nova planta selecionando do catálogo.
                  </Text>
                </View>
              )}
            </View>
          );
        })()}

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

        {/* Growth Progress Section */}
        {isOwnPlant && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="trending-up" size={22} color={colors.botanical.clay} />
                <Text style={styles.sectionTitle}>Progresso de Crescimento</Text>
              </View>
              <TouchableOpacity
                style={styles.addEvolutionButton}
                onPress={openEvolutionModal}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={18} color={colors.botanical.base} />
                <Text style={styles.addEvolutionButtonText}>Registrar</Text>
              </TouchableOpacity>
            </View>

            {loadingEvolutions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.botanical.clay} />
              </View>
            ) : evolutions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.evolutionsContainer}
              >
                {evolutions.map((evolution, index) => (
                  <TouchableOpacity
                    key={evolution.id}
                    style={styles.evolutionCard}
                    onLongPress={() => handleDeleteEvolution(evolution.id)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: evolution.image_url }}
                      style={styles.evolutionImage}
                    />
                    <View style={styles.evolutionInfo}>
                      <Text style={styles.evolutionDate}>
                        {formatDate(evolution.evolution_date)}
                      </Text>
                      {evolution.description && (
                        <Text style={styles.evolutionDescription} numberOfLines={2}>
                          {evolution.description}
                        </Text>
                      )}
                    </View>
                    {evolution.post_id && (
                      <View style={styles.sharedBadge}>
                        <Ionicons name="share-social" size={12} color={colors.botanical.base} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyEvolutions}>
                <Ionicons name="images-outline" size={40} color={colors.botanical.sage} />
                <Text style={styles.emptyEvolutionsText}>
                  Registre a evolução da sua planta
                </Text>
                <Text style={styles.emptyEvolutionsSubtext}>
                  Tire fotos para acompanhar o crescimento
                </Text>
              </View>
            )}
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

      {/* Add to My Plants Button - Show for other users' plants */}
      {!isOwnPlant && !alreadyHasPlant && (
        <TouchableOpacity
          style={[styles.addToMyPlantsButton, { bottom: fabBottomPosition }]}
          onPress={handleAddToMyPlants}
          activeOpacity={0.8}
          disabled={savingToMyPlants}
        >
          {savingToMyPlants ? (
            <ActivityIndicator size="small" color={colors.botanical.base} />
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color={colors.botanical.base} />
              <Text style={styles.addToMyPlantsText}>Adicionar às Minhas Plantas</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Already has plant indicator */}
      {!isOwnPlant && alreadyHasPlant && (
        <View style={[styles.alreadyHasPlantBadge, { bottom: fabBottomPosition }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.botanical.base} />
          <Text style={styles.alreadyHasPlantText}>Você já tem esta planta</Text>
        </View>
      )}

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

      {/* Evolution Modal */}
      <Modal
        visible={evolutionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEvolutionModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeEvolutionModal}
              style={styles.modalButton}
              disabled={savingEvolution}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Registrar Evolução</Text>
            <TouchableOpacity
              onPress={handleSaveEvolution}
              style={styles.modalButton}
              disabled={savingEvolution || !evolutionForm.imageFile}
            >
              {savingEvolution ? (
                <ActivityIndicator size="small" color={colors.botanical.clay} />
              ) : (
                <Text style={[
                  styles.modalSaveText,
                  !evolutionForm.imageFile && { opacity: 0.5 }
                ]}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Image Picker */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Foto da Evolução *</Text>
              <TouchableOpacity
                style={styles.evolutionImagePicker}
                onPress={pickEvolutionImage}
                activeOpacity={0.8}
              >
                {evolutionForm.image ? (
                  <Image
                    source={{ uri: evolutionForm.image }}
                    style={styles.evolutionPickerImage}
                  />
                ) : (
                  <View style={styles.evolutionPickerPlaceholder}>
                    <Ionicons name="camera" size={40} color={colors.botanical.sage} />
                    <Text style={styles.evolutionPickerText}>
                      Toque para tirar uma foto
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>O que aconteceu? (opcional)</Text>
              <TextInput
                style={styles.modalTextInput}
                value={evolutionForm.description}
                onChangeText={(text) =>
                  setEvolutionForm((prev) => ({ ...prev, description: text }))
                }
                placeholder="Ex: Apareceu uma nova folha, cresceu 5cm..."
                placeholderTextColor={colors.botanical.sage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Share to Feed Toggle */}
            <View style={styles.modalSection}>
              <View style={styles.shareToggleContainer}>
                <View style={styles.shareToggleInfo}>
                  <Ionicons name="share-social" size={24} color={colors.botanical.clay} />
                  <View style={styles.shareToggleText}>
                    <Text style={styles.shareToggleTitle}>Compartilhar na Comunidade</Text>
                    <Text style={styles.shareToggleSubtitle}>
                      Criar um post com esta evolução
                    </Text>
                  </View>
                </View>
                <Switch
                  value={evolutionForm.shareToFeed}
                  onValueChange={(value) =>
                    setEvolutionForm((prev) => ({ ...prev, shareToFeed: value }))
                  }
                  trackColor={{
                    false: colors.botanical.sage + '40',
                    true: colors.botanical.clay + '80',
                  }}
                  thumbColor={
                    evolutionForm.shareToFeed ? colors.botanical.clay : colors.ui.background
                  }
                />
              </View>
            </View>

            {/* Date Info */}
            <View style={styles.modalSection}>
              <View style={styles.dateInfoContainer}>
                <Ionicons name="calendar" size={18} color={colors.botanical.sage} />
                <Text style={styles.dateInfoText}>
                  Data: {new Date().toLocaleDateString('pt-BR')}
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
  lastCareContainer: {
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  lastCareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastCareLabel: {
    fontSize: 14,
    color: colors.botanical.sage,
  },
  lastCareValue: {
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

  // Care Instructions styles
  careInstructionCard: {
    backgroundColor: colors.ui.background,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  careInstructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.clay + '10',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  careInstructionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.botanical.clay + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  careInstructionPhase: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.botanical.clay,
  },
  careInstructionContent: {
    padding: 16,
    gap: 10,
  },
  careInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  careInstructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },
  noCareInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.botanical.sage + '15',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  noCareInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.botanical.sage,
    lineHeight: 18,
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

  // Evolution/Growth Progress styles
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addEvolutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.botanical.clay,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addEvolutionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.botanical.base,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  evolutionsContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  evolutionCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: colors.ui.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evolutionImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  evolutionInfo: {
    padding: 10,
  },
  evolutionDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.botanical.clay,
    marginBottom: 4,
  },
  evolutionDescription: {
    fontSize: 12,
    color: colors.botanical.dark,
    lineHeight: 16,
  },
  sharedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.botanical.clay,
    borderRadius: 12,
    padding: 4,
  },
  emptyEvolutions: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.ui.background,
    borderRadius: 16,
  },
  emptyEvolutionsText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginTop: 12,
  },
  emptyEvolutionsSubtext: {
    fontSize: 13,
    color: colors.botanical.sage,
    marginTop: 4,
  },

  // Evolution Modal styles
  evolutionImagePicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.botanical.sage + '40',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  evolutionPickerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  evolutionPickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  evolutionPickerText: {
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
  },
  shareToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
  },
  shareToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shareToggleText: {
    flex: 1,
  },
  shareToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  shareToggleSubtitle: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginTop: 2,
  },
  dateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 12,
  },
  dateInfoText: {
    fontSize: 14,
    color: colors.botanical.sage,
  },

  // Add to My Plants styles
  addToMyPlantsButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.botanical.clay,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  addToMyPlantsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.base,
  },
  alreadyHasPlantBadge: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.system.success,
    paddingVertical: 12,
    borderRadius: 28,
    zIndex: 100,
  },
  alreadyHasPlantText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.base,
  },
});

export default PlantDetailScreen;