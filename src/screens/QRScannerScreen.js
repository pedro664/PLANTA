/**
 * QR Scanner Screen
 * Scans QR codes to identify plants and navigate to their details
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { showSuccessToast, showInfoToast, showErrorToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import { parseQRData } from '../utils/qrCodeUtils';
import { plantService } from '../services/plantService';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = 250;

const QRScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const { getPlantById, addPlant, user } = useAppContext();

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Handle barcode scan
  const handleBarCodeScanned = useCallback(async ({ type, data }) => {
    if (scanned || isLoading) return;
    
    setScanned(true);
    setIsLoading(true);

    // Parse the QR code data
    const parsedData = parseQRData(data);

    if (!parsedData.isValid) {
      setIsLoading(false);
      Alert.alert(
        'QR Code Inválido',
        parsedData.error || 'Este QR Code não é válido para o Educultivo.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    if (parsedData.type === 'plant') {
      try {
        // First, try to find the plant in local data (user's plants)
        let plant = getPlantById(parsedData.plantId);

        if (plant) {
          setIsLoading(false);
          showSuccessToast(`Planta encontrada: ${plant.name}`);
          navigation.replace('PlantDetail', { plantId: parsedData.plantId });
          return;
        }

        // If not found locally, search in the database (any user's plant)
        try {
          plant = await plantService.getPlantById(parsedData.plantId);
          
          if (plant) {
            setIsLoading(false);
            showSuccessToast(`Planta encontrada: ${plant.name}`);
            // Navigate to plant details with the full plant data
            navigation.replace('PlantDetail', { 
              plantId: parsedData.plantId,
              plantData: plant // Pass the plant data for plants not owned by user
            });
            return;
          }
        } catch (dbError) {
          console.log('Plant not found in database:', dbError);
        }

        // Plant not found anywhere
        setIsLoading(false);
        Alert.alert(
          'Planta Não Encontrada',
          parsedData.plantName 
            ? `A planta "${parsedData.plantName}" não foi encontrada no sistema.`
            : 'Esta planta não foi encontrada no sistema.',
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
      } catch (error) {
        setIsLoading(false);
        console.error('Error searching for plant:', error);
        showErrorToast('Erro ao buscar planta. Tente novamente.');
        setScanned(false);
      }
    }
  }, [scanned, isLoading, getPlantById, navigation]);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    setFlashOn(prev => !prev);
  }, []);

  // Reset scanner
  const resetScanner = useCallback(() => {
    setScanned(false);
  }, []);

  // Go back
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Loading state while checking permissions
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>Verificando permissões...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.botanical.base} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner QR</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons name="camera-off-outline" size={64} color={colors.botanical.sage} />
          <Text style={styles.messageText}>Permissão da câmera negada</Text>
          <Text style={styles.subMessageText}>
            Para escanear QR Codes, permita o acesso à câmera nas configurações do app.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Solicitar Permissão</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.botanical.base} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner QR</Text>
        <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
          <Ionicons
            name={flashOn ? 'flash' : 'flash-off'}
            size={24}
            color={colors.botanical.base}
          />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        {isLoading ? (
          <>
            <ActivityIndicator size="large" color={colors.botanical.base} />
            <Text style={styles.instructionsTitle}>Buscando planta...</Text>
            <Text style={styles.instructionsText}>
              Aguarde enquanto verificamos os dados
            </Text>
          </>
        ) : (
          <>
            <View style={styles.instructionsHeader}>
              <Ionicons name="qr-code-outline" size={28} color={colors.botanical.clay} />
              <Text style={styles.instructionsTitle}>Escaneie o QR Code da planta</Text>
            </View>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionsText}>
                  Aponte a câmera para o QR Code impresso no vaso
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionsText}>
                  Mantenha o código dentro da área marcada
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionsText}>
                  A planta será identificada automaticamente
                </Text>
              </View>
            </View>

            {scanned && (
              <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
                <Ionicons name="refresh" size={20} color={colors.botanical.base} />
                <Text style={styles.scanAgainButtonText}>Escanear novamente</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.base,
    textAlign: 'center',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  // Corner indicators
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.botanical.base,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },

  // Instructions
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: 10,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.botanical.base,
    textAlign: 'center',
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.botanical.clay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.botanical.base,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: colors.botanical.sage,
    lineHeight: 20,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.botanical.clay,
    borderRadius: 24,
    gap: 8,
  },
  scanAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.base,
  },

  // Center container for messages
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.botanical.base,
    textAlign: 'center',
    marginTop: 16,
  },
  subMessageText: {
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  permissionButton: {
    marginTop: spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.botanical.clay,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.base,
  },
  backButton: {
    marginTop: spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.botanical.sage,
  },
});

export default QRScannerScreen;
