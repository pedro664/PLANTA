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
import { useUniversalImagePicker } from '../components/UniversalImagePicker';
import Text from '../components/Text';
import LazyImage from '../components/LazyImage';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { showSuccessToast, showErrorToast } from '../components/Toast';
import { StorageService } from '../services/storageService';

const CreatePostScreen = ({ navigation, route }) => {
  const { createPost, user } = useAppContext();
  const prefillData = route?.params?.prefillData;
  
  const [description, setDescription] = useState(prefillData?.description || '');
  const [selectedImage, setSelectedImage] = useState(
    prefillData?.imageFile ? prefillData.imageFile : null
  );
  const [category, setCategory] = useState('all');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evolutionId] = useState(prefillData?.evolutionId || null);
  
  // Animation values
  const submitButtonScale = useRef(new Animated.Value(1)).current;

  const { pickImage } = useUniversalImagePicker();

  // Handle image selection
  const handleImageSelection = async () => {
    try {
      const result = await pickImage({
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result && result.uri) {
        setSelectedImage(result);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showErrorToast('Erro ao selecionar imagem');
    }
  };

  // Handle post submission
  const handleSubmit = async () => {
    if (!selectedImage) {
      showErrorToast('Selecione uma imagem para o post');
      return;
    }
    
    if (!description.trim()) {
      showErrorToast('Digite uma descrição para o post');
      return;
    }

    setIsSubmitting(true);
    Animated.spring(submitButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    try {
      // Process tags
      const processedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 5); // Limit to 5 tags

      const postData = {
        description: description.trim(),
        category,
        tags: processedTags,
        imageFile: selectedImage, // Pass the image file for upload
      };

      const newPost = await createPost(postData);
      
      // Se for uma evolução compartilhada, vincular ao post
      if (evolutionId && newPost?.id) {
        try {
          const { evolutionService } = await import('../services/evolutionService');
          await evolutionService.linkEvolutionToPost(evolutionId, newPost.id);
        } catch (linkError) {
          console.error('Erro ao vincular evolução ao post:', linkError);
        }
      }
      
      showSuccessToast('Post criado com sucesso!');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error creating post:', error);
      showErrorToast('Erro ao criar post. Tente novamente.');
    } finally {
      setIsSubmitting(false);
      Animated.spring(submitButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  // Category options
  const categories = [
    { value: 'all', label: 'Geral' },
    { value: 'tips', label: 'Dicas' },
    { value: 'identification', label: 'Identificação' },
  ];

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
        <Text style={styles.headerTitle}>Novo Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagem *</Text>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={handleImageSelection}
              activeOpacity={0.8}
            >
              {selectedImage ? (
                <LazyImage 
                  source={{ uri: selectedImage.uri }} 
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={48} color={colors.botanical.sage} />
                  <Text style={styles.imagePlaceholderText}>
                    Toque para adicionar uma foto *
                  </Text>
                  <Text style={styles.imagePlaceholderSubtext}>
                    Imagem obrigatória
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {selectedImage && (
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeImageText}>Remover imagem</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Description section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição *</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Conte sobre sua planta, compartilhe uma dica ou faça uma pergunta..."
              placeholderTextColor={colors.botanical.sage}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {description.length}/500
            </Text>
          </View>

          {/* Category section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat.value && styles.categoryButtonTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (opcional)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="Ex: suculenta, rega, sol (separadas por vírgula)"
              placeholderTextColor={colors.botanical.sage}
              value={tags}
              onChangeText={setTags}
              maxLength={100}
            />
            <Text style={styles.tagsHint}>
              Máximo 5 tags, separadas por vírgula
            </Text>
          </View>
        </ScrollView>

        {/* Submit button */}
        <Animated.View style={[styles.submitContainer, { transform: [{ scale: submitButtonScale }] }]}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!selectedImage || !description.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedImage || !description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isSubmitting ? "hourglass-outline" : "send"} 
              size={20} 
              color={colors.ui.background} 
            />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Publicando...' : 'Publicar Post'}
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
  content: {
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.botanical.dark,
    marginBottom: spacing.sm,
  },
  
  // Image styles
  imageContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.ui.background,
    borderWidth: 2,
    borderColor: 'rgba(46, 74, 61, 0.1)',
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    ...textStyles.body,
    color: colors.botanical.sage,
    textAlign: 'center',
    fontWeight: '600',
  },
  imagePlaceholderSubtext: {
    ...textStyles.caption,
    color: colors.system.error,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  removeImageButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  removeImageText: {
    ...textStyles.caption,
    color: colors.system.error,
    textDecorationLine: 'underline',
  },
  
  // Description styles
  descriptionInput: {
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 120,
    ...textStyles.body,
    color: colors.botanical.dark,
    backgroundColor: colors.ui.background,
  },
  characterCount: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  
  // Category styles
  categoryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.2)',
    backgroundColor: colors.ui.background,
  },
  categoryButtonActive: {
    backgroundColor: colors.botanical.dark,
    borderColor: colors.botanical.dark,
  },
  categoryButtonText: {
    ...textStyles.caption,
    color: colors.botanical.dark,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: colors.ui.background,
  },
  
  // Tags styles
  tagsInput: {
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.botanical.dark,
    backgroundColor: colors.ui.background,
  },
  tagsHint: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    marginTop: spacing.xs,
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

export default CreatePostScreen;