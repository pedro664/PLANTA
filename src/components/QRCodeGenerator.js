/**
 * QR Code Generator Component
 * Generates and dode for a plant with sharing and printing options
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { showSuccessToast, showErrorToast } from './Toast';
import {
  generatePlantQRData,
  generateQRCodeUrl,
  generateSharingMessage,
  generatePrintMessage,
  generatePlantWebLink,
} from '../utils/qrCodeUtils';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.6, 250);

const QRCodeGenerator = ({ plant, visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset state when modal opens
  const handleModalShow = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  // Don't render if no plant
  if (!plant) return null;

  // Generate QR code data and URL
  const qrData = generatePlantQRData(plant);
  const qrCodeUrl = generateQRCodeUrl(qrData, 300);
  const webLink = generatePlantWebLink(plant.id);

  // Handle sharing the plant info
  const handleShare = async () => {
    try {
      const message = generateSharingMessage(plant);
      await Share.share({
        message,
        title: `${plant.name} - EduCultivo`,
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing:', error);
        showErrorToast('Erro ao compartilhar');
      }
    }
  };

  // Handle sharing QR code for printing
  const handlePrint = async () => {
    try {
      const message = generatePrintMessage(plant, qrCodeUrl);
      await Share.share({
        message,
        title: `QR Code - ${plant.name}`,
      });
      showSuccessToast('QR Code compartilhado para impressão!');
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing QR code:', error);
        showErrorToast('Erro ao compartilhar QR Code');
      }
    }
  };

  // Handle copying the web link
  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: webLink,
        title: 'Link da Planta',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error copying link:', error);
        showErrorToast('Erro ao copiar link');
      }
    }
  };

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Retry loading QR code
  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Fechar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={colors.botanical.clay} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Plant Info */}
          <View style={styles.plantInfo}>
            <Text style={styles.plantName}>{plant.name}</Text>
            {plant.scientific && (
              <Text style={styles.plantScientific}>{plant.scientific}</Text>
            )}
          </View>

          {/* QR Code Display */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.botanical.clay} />
                  <Text style={styles.loadingText}>Gerando QR Code...</Text>
                </View>
              )}
              
              {hasError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color={colors.botanical.sage} />
                  <Text style={styles.errorText}>Erro ao carregar QR Code</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={[styles.qrImage, isLoading && styles.hidden]}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Como usar este QR Code</Text>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="scan-outline" size={20} color={colors.botanical.clay} />
              </View>
              <Text style={styles.instructionText}>
                Use o scanner do app para identificar a planta rapidamente
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="print-outline" size={20} color={colors.botanical.clay} />
              </View>
              <Text style={styles.instructionText}>
                Imprima e cole no vaso para identificação física
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="camera-outline" size={20} color={colors.botanical.clay} />
              </View>
              <Text style={styles.instructionText}>
                Escaneie com a câmera do celular para abrir no app
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handlePrint}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={20} color={colors.botanical.base} />
              <Text style={styles.primaryButtonText}>Imprimir QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Ionicons name="link-outline" size={20} color={colors.botanical.clay} />
              <Text style={styles.secondaryButtonText}>Compartilhar Link</Text>
            </TouchableOpacity>
          </View>

          {/* Link Info */}
          <View style={styles.linkInfo}>
            <Text style={styles.linkLabel}>Link da planta:</Text>
            <Text style={styles.linkText} numberOfLines={2} selectable>
              {webLink}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141, 163, 153, 0.15)',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.botanical.sage,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
  },

  // Plant Info
  plantInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.botanical.sage,
    textAlign: 'center',
  },

  // QR Code
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: colors.ui.background,
    borderRadius: 20,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: QR_SIZE + 40,
    minHeight: QR_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: QR_SIZE,
    height: QR_SIZE,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.botanical.sage,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: QR_SIZE,
    height: QR_SIZE,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.botanical.clay,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.base,
  },

  // Instructions
  instructions: {
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 14,
  },
  instructionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.botanical.clay + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.botanical.dark,
    lineHeight: 20,
  },

  // Actions
  actions: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.botanical.clay,
  },
  secondaryButton: {
    backgroundColor: colors.ui.background,
    borderWidth: 2,
    borderColor: colors.botanical.clay,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.base,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.clay,
  },

  // Link Info
  linkInfo: {
    backgroundColor: colors.ui.background,
    borderRadius: 12,
    padding: 16,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.botanical.sage,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  linkText: {
    fontSize: 14,
    color: colors.botanical.dark,
  },
});

export default QRCodeGenerator;
