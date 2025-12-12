import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/Text';
import LazyImage from '../components/LazyImage';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const EditPlantScreen = ({ route, navigation }) => {
  const { plant } = route.params;
  const { updatePlant } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: plant.name || '',
    scientific: plant.scientific_name || '',
    description: plant.description || '',
    image: plant.image_url ? { uri: plant.image_url } : null,
    waterFrequency: plant.water_frequency || 'weekly',
    lightNeeds: plant.light_needs || 'indirect',
    plantedDate: plant.planted_date ? new Date(plant.planted_date).toISOString().split('T')[0] : '',
    deathDate: plant.death_date ? new Date(plant.death_date).toISOString().split('T')[0] : '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const submitButtonScale = useRef(new Animated.Value(1)).current;

  // Water frequency options
  const waterFrequencyOptions = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'every3days', label: 'A cada 3 dias' },
    { value: 'weekly', label: 'Semanalmente' },
  ];

  // Light needs options
  const lightNeedsOptions = [
    { value: 'shade', label: 'Sombra' },
    { value: 'indirect', label: 'Luz indireta' },
    { value: 'fullsun', label: 'Sol pleno' },
  ];

  // Handle image selection
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, image: result.assets[0] }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showErrorToast('Erro ao selecionar imagem');
    }
  };
  // Handle camera
  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para usar a câmera.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, image: result.assets[0] }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showErrorToast('Erro ao tirar foto');
    }
  };

  // Handle image options
  const showImageOptions = () => {
    Alert.alert(
      'Alterar Foto da Planta',
      'Escolha uma opção:',
      [
        { text: 'Câmera', onPress: handleCamera },
        { text: 'Galeria', onPress: handleImagePicker },
        { text: 'Remover Foto', onPress: () => setFormData(prev => ({ ...prev, image: null })), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showErrorToast('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSubmitting(true);
    Animated.spring(submitButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    try {
      const updatedPlantData = {
        name: formData.name.trim(),
        scientific_name: formData.scientific.trim() || null,
        description: formData.description.trim() || 'Uma planta especial do meu jardim.',
        image_url: formData.image?.uri || null,
        water_frequency: formData.waterFrequency,
        light_needs: formData.lightNeeds,
        planted_date: formData.plantedDate ? new Date(formData.plantedDate).toISOString() : null,
        death_date: formData.deathDate ? new Date(formData.deathDate).toISOString() : null,
      };

      await updatePlant(plant.id, updatedPlantData);
      
      showSuccessToast('Planta atualizada com sucesso!');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error updating plant:', error);
      showErrorToast('Erro ao atualizar planta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
      Animated.spring(submitButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  // Picker section component
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Planta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Plant Image */}
          <View style={styles.section}>
            <Text style={styles.label}>Foto da Planta</Text>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              {formData.image ? (
                <LazyImage 
                  source={{ uri: formData.image.uri }} 
                  style={styles.plantImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={48} color={colors.botanical.sage} />
                  <Text style={styles.imagePlaceholderText}>
                    Toque para alterar a foto
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Plant Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome da Planta *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ex: Samambaia da sala"
              placeholderTextColor={colors.botanical.sage}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              maxLength={100}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Scientific Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome Científico (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Nephrolepis exaltata"
              placeholderTextColor={colors.botanical.sage}
              value={formData.scientific}
              onChangeText={(text) => setFormData(prev => ({ ...prev, scientific: text }))}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Conte um pouco sobre sua planta..."
              placeholderTextColor={colors.botanical.sage}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              maxLength={500}
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
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.botanical.sage}
              value={formData.plantedDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, plantedDate: text }))}
              maxLength={10}
            />
          </View>

          {/* Death Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Data de Morte (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.botanical.sage}
              value={formData.deathDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, deathDate: text }))}
              maxLength={10}
            />
          </View>
        </ScrollView>

        {/* Submit Button */}
        <Animated.View style={[styles.submitContainer, { transform: [{ scale: submitButtonScale }] }]}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!formData.name.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isSubmitting ? "hourglass-outline" : "checkmark"} 
              size={20} 
              color={colors.ui.background} 
            />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Atualizando...' : 'Atualizar Planta'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.botanical.dark,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Content styles
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  
  // Section styles
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.body,
    color: colors.botanical.dark,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  
  // Image styles
  imageContainer: {
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.ui.background,
    borderWidth: 2,
    borderColor: 'rgba(46, 74, 61, 0.1)',
    borderStyle: 'dashed',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    ...textStyles.body,
    color: colors.botanical.sage,
    textAlign: 'center',
  },
  
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.botanical.dark,
    backgroundColor: colors.ui.background,
  },
  inputError: {
    borderColor: colors.system.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    ...textStyles.caption,
    color: colors.system.error,
    marginTop: spacing.xs,
  },
  
  // Picker styles
  pickerContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.2)',
    backgroundColor: colors.ui.background,
  },
  pickerOptionSelected: {
    backgroundColor: colors.botanical.dark,
    borderColor: colors.botanical.dark,
  },
  pickerOptionText: {
    ...textStyles.caption,
    color: colors.botanical.dark,
    fontWeight: '600',
  },
  pickerOptionTextSelected: {
    color: colors.ui.background,
  },
  
  // Submit styles
  submitContainer: {
    padding: spacing.lg,
    backgroundColor: colors.ui.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 74, 61, 0.1)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.botanical.dark,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.botanical.sage,
    opacity: 0.5,
  },
  submitButtonText: {
    ...textStyles.body,
    color: colors.ui.background,
    fontWeight: '700',
  },
});

export default EditPlantScreen;