import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator
} from 'react-native';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useUniversalImagePicker } from '../components/UniversalImagePicker';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const AddPlantScreen = ({ navigation }) => {
  const { addPlant } = useAppContext();
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();
  
  const [formData, setFormData] = useState({
    name: '',
    scientific: '',
    description: '',
    image: null,
    imageFile: null,
    waterFrequency: 'weekly',
    lightNeeds: 'indirect',
    plantedDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Opções de frequência de rega
  const waterFrequencyOptions = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'every3days', label: 'A cada 3 dias' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'biweekly', label: 'A cada 2 semanas' },
    { value: 'monthly', label: 'Mensalmente' },
  ];

  // Opções de necessidade de luz
  const lightNeedsOptions = [
    { value: 'direct', label: 'Sol direto' },
    { value: 'indirect', label: 'Luz indireta' },
    { value: 'shade', label: 'Sombra' },
  ];

  const { pickImage: pickUniversalImage } = useUniversalImagePicker();

  // Função para selecionar imagem
  const pickImage = async () => {
    try {
      setUploadStatus('Selecionando foto...');
      const result = await pickUniversalImage({
        aspect: [3, 4],
        quality: 0.8,
      });
      
      if (result && result.uri) {
        console.log('📸 Foto selecionada:', {
          uri: result.uri,
          type: result.type,
          width: result.width,
          height: result.height,
        });

        setFormData(prev => ({
          ...prev,
          image: result.uri,
          imageFile: result
        }));
        
        // Limpar erro de imagem anterior
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: undefined }));
        }
        setUploadStatus(null);
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar imagem:', error);
      setUploadStatus(null);
      showErrorToast('Não foi possível selecionar a foto. Tente novamente.');
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da planta é obrigatório';
    }

    if (!formData.image || !formData.imageFile) {
      newErrors.image = 'Selecione uma foto da planta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipular envio do formulário
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast('Por favor, corrija os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    setUploadStatus('Enviando planta e imagem...');

    try {
      console.log('💾 Salvando planta com dados:', {
        name: formData.name,
        hasImage: !!formData.imageFile,
        imageUri: formData.imageFile?.uri,
      });

      const newPlantData = {
        name: formData.name.trim(),
        scientific_name: formData.scientific.trim() || null,
        description: formData.description.trim() || 'Uma planta especial do meu jardim.',
        imageFile: formData.imageFile,
        water_frequency: formData.waterFrequency,
        light_needs: formData.lightNeeds,
        planted_date: formData.plantedDate ? new Date(formData.plantedDate).toISOString() : null,
      };

      setUploadStatus('Processando imagem...');
      const result = await addPlant(newPlantData);
      
      console.log('✅ Planta adicionada com sucesso:', result.id);
      setUploadStatus(null);
      
      showSuccessToast('Sua planta foi adicionada com sucesso!');
      
      // Navegar após delay
      setTimeout(() => {
        setIsLoading(false);
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao salvar planta:', error);
      setUploadStatus(null);
      setIsLoading(false);
      
      // Mensagens de erro específicas
      let mensagem = 'Erro ao salvar a planta.';
      if (error.message.includes('imagem')) {
        mensagem = 'Erro com a imagem: ' + error.message;
      } else if (error.message.includes('permiss')) {
        mensagem = 'Sem permissão para fazer upload.';
      }
      
      showErrorToast(mensagem);
    }
  };

  // Picker component
  const PickerSection = ({ title, options, selectedValue, onValueChange }) => (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              selectedValue === option.value && styles.pickerOptionSelected
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.pickerOptionText,
              selectedValue === option.value && styles.pickerOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => !isLoading && navigation.goBack()}
            style={styles.backButton}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adicionar Planta</Text>
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
        </View>

        {/* Upload Status */}
        {uploadStatus && (
          <View style={styles.uploadStatusBar}>
            <Ionicons name="cloud-upload-outline" size={16} color={colors.botanical.clay} />
            <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
          </View>
        )}

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { 
            paddingHorizontal: responsiveSpacing,
            paddingBottom: safeAreaStyles.contentPaddingBottom 
          }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Foto da Planta *</Text>
            <TouchableOpacity 
              style={[styles.imagePicker, errors.image && styles.inputError]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={32} color={colors.botanical.sage} />
                  <Text style={styles.imagePickerText}>Toque para adicionar foto</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
          </View>

          {/* Plant Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome da Planta *</Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Ex: Monstera Deliciosa"
              placeholderTextColor={colors.botanical.sage}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Scientific Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome Científico (opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.scientific}
              onChangeText={(text) => setFormData(prev => ({ ...prev, scientific: text }))}
              placeholder="Ex: Monstera deliciosa"
              placeholderTextColor={colors.botanical.sage}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Conte um pouco sobre sua planta..."
              placeholderTextColor={colors.botanical.sage}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Water Frequency */}
          <PickerSection
            title="Frequência de Rega"
            options={waterFrequencyOptions}
            selectedValue={formData.waterFrequency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, waterFrequency: value }))}
          />

          {/* Light Needs */}
          <PickerSection
            title="Necessidade de Luz"
            options={lightNeedsOptions}
            selectedValue={formData.lightNeeds}
            onValueChange={(value) => setFormData(prev => ({ ...prev, lightNeeds: value }))}
          />

          {/* Planted Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Data de Plantio (opcional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.botanical.sage}
              value={formData.plantedDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, plantedDate: text }))}
              maxLength={10}
            />
          </View>


        </ScrollView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.botanical.clay,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.botanical.base,
  },

  // Upload status
  uploadStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.clay + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.botanical.clay + '40',
  },
  uploadStatusText: {
    fontSize: 13,
    color: colors.botanical.clay,
    fontWeight: '500',
  },

  // Content styles
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for tab bar
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: 8,
  },

  // Image picker styles
  imagePicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.botanical.sage + '40',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Input styles
  textInput: {
    borderWidth: 1,
    borderColor: colors.botanical.sage + '40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.botanical.dark,
    backgroundColor: colors.ui.background,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  // Picker styles
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.botanical.sage + '40',
    backgroundColor: colors.ui.background,
  },
  pickerOptionSelected: {
    backgroundColor: colors.botanical.clay,
    borderColor: colors.botanical.clay,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.botanical.dark,
  },
  pickerOptionTextSelected: {
    color: colors.botanical.base,
    fontWeight: '600',
  },

  // Switch styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginTop: 2,
  },
});

export default AddPlantScreen;