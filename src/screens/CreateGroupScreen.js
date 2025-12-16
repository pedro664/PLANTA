/**
 * Tela de Criação de Grupo
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { groupService } from '../services/groupService';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const CreateGroupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groupImage, setGroupImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showErrorToast('Permissão necessária para acessar fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      showErrorToast('Erro ao selecionar imagem');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showErrorToast('Digite um nome para o grupo');
      return;
    }

    setIsLoading(true);
    try {
      // Criar o grupo primeiro (sem imagem)
      const group = await groupService.createGroup(
        name.trim(),
        description.trim(),
        isPrivate,
        null
      );

      // Upload da imagem se selecionada (usando o ID do grupo criado)
      if (groupImage) {
        setIsUploadingImage(true);
        try {
          const imageUrl = await groupService.uploadGroupImage(groupImage, group.id);
          await groupService.updateGroup(group.id, { image_url: imageUrl });
          group.image_url = imageUrl;
        } catch (uploadError) {
          console.warn('Erro ao fazer upload da imagem:', uploadError);
          // Continua mesmo se o upload falhar
        }
        setIsUploadingImage(false);
      }

      showSuccessToast('Grupo criado com sucesso!');
      navigation.replace('GroupChat', { group });
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      showErrorToast('Erro ao criar grupo: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Grupo</Text>
          <TouchableOpacity
            style={[styles.createButton, (!name.trim() || isLoading) && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.botanical.base} />
            ) : (
              <Text style={styles.createButtonText}>Criar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Icon */}
          <View style={styles.iconSection}>
            <View style={styles.avatarEditContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.groupIconPlaceholder}>
                {groupImage ? (
                  <Image source={{ uri: groupImage }} style={styles.groupIconImage} />
                ) : (
                  <Ionicons name="people" size={48} color={colors.botanical.sage} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cameraOverlay}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color={colors.botanical.base} />
              </TouchableOpacity>
            </View>
            <Text style={styles.iconHint}>
              {groupImage ? 'Toque para alterar' : 'Adicionar foto do grupo'}
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Nome do Grupo *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Amantes de Suculentas"
              placeholderTextColor={colors.botanical.sage}
              maxLength={50}
              autoFocus
            />
            <Text style={styles.charCount}>{name.length}/50</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva o propósito do grupo..."
              placeholderTextColor={colors.botanical.sage}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          {/* Privacy Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Ionicons 
                name={isPrivate ? 'lock-closed' : 'globe-outline'} 
                size={24} 
                color={colors.botanical.dark} 
              />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>
                  {isPrivate ? 'Grupo Privado' : 'Grupo Público'}
                </Text>
                <Text style={styles.toggleDescription}>
                  {isPrivate 
                    ? 'Apenas membros convidados podem participar'
                    : 'Qualquer pessoa pode encontrar e participar'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.botanical.sand, true: colors.botanical.clay + '60' }}
              thumbColor={isPrivate ? colors.botanical.clay : colors.ui.background}
            />
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color={colors.botanical.sage} />
            <Text style={styles.infoText}>
              Você será o administrador do grupo e poderá adicionar seus amigos como membros.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...textStyles.h3,
    flex: 1,
    textAlign: 'center',
    color: colors.botanical.dark,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: colors.botanical.clay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.botanical.sage,
    opacity: 0.5,
  },
  createButtonText: {
    color: colors.botanical.base,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarEditContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  groupIconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.ui.background,
  },
  groupIconImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  cameraOverlay: {
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
  iconHint: {
    ...textStyles.caption,
    color: colors.botanical.sage,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.botanical.dark,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.botanical.base,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.botanical.dark,
    borderWidth: 1,
    borderColor: colors.botanical.sand,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  charCount: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.botanical.base,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  toggleTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  toggleDescription: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.botanical.sand + '50',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoText: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
});

export default CreateGroupScreen;
