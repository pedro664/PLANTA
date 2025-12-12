/**
 * QR Code Utilities
 * Functions for generating and parsing QR code data for plants
 */

import * as Linking from 'expo-linking';

// QR Code data structure
export const QR_CODE_VERSION = '1.0';
export const QR_CODE_TYPE = 'educultivo';

/**
 * Generate QR code data for a plant
 * @param {Object} plant - Plant object
 * @returns {string} JSON string for QR code
 */
export const generatePlantQRData = (plant) => {
  const qrData = {
    type: QR_CODE_TYPE,
    version: QR_CODE_VERSION,
    plantId: plant.id,
    plantName: plant.name,
    scientificName: plant.scientific_name,
    timestamp: Date.now(),
    deepLink: `educultivo://plant/${plant.id}`
  };

  return JSON.stringify(qrData);
};

/**
 * Parse QR code data
 * @param {string} data - Raw QR code data
 * @returns {Object} Parsed data with validation
 */
export const parseQRData = (data) => {
  try {
    // Try to parse as JSON first
    let parsedData;
    
    try {
      parsedData = JSON.parse(data);
    } catch (jsonError) {
      // If not JSON, check if it's a deep link
      if (data.startsWith('educultivo://plant/')) {
        const plantId = data.replace('educultivo://plant/', '');
        return {
          isValid: true,
          type: 'plant',
          plantId: plantId,
          plantName: null,
          source: 'deeplink'
        };
      }
      
      // Check if it's a web URL
      if (data.startsWith('https://') && data.includes('educultivo')) {
        const url = new URL(data);
        const plantId = url.searchParams.get('plantId') || url.pathname.split('/').pop();
        return {
          isValid: true,
          type: 'plant',
          plantId: plantId,
          plantName: null,
          source: 'weblink'
        };
      }
      
      return {
        isValid: false,
        error: 'QR Code não é válido para o Educultivo'
      };
    }

    // Validate parsed JSON data
    if (!parsedData.type || parsedData.type !== QR_CODE_TYPE) {
      return {
        isValid: false,
        error: 'QR Code não é do Educultivo'
      };
    }

    if (!parsedData.plantId) {
      return {
        isValid: false,
        error: 'QR Code não contém informações válidas da planta'
      };
    }

    return {
      isValid: true,
      type: 'plant',
      plantId: parsedData.plantId,
      plantName: parsedData.plantName,
      scientificName: parsedData.scientificName,
      timestamp: parsedData.timestamp,
      version: parsedData.version,
      source: 'qrcode'
    };

  } catch (error) {
    console.error('Error parsing QR data:', error);
    return {
      isValid: false,
      error: 'Erro ao processar QR Code'
    };
  }
};

/**
 * Generate deep link URL for a plant
 * @param {string} plantId - Plant ID
 * @returns {string} Deep link URL
 */
export const generatePlantDeepLink = (plantId) => {
  return `educultivo://plant/${plantId}`;
};

/**
 * Generate web link for sharing
 * @param {string} plantId - Plant ID
 * @param {string} plantName - Plant name (optional)
 * @returns {string} Web link URL
 */
export const generatePlantWebLink = (plantId, plantName = '') => {
  const baseUrl = 'https://educultivo.com/plant';
  const params = new URLSearchParams({
    plantId: plantId,
    ...(plantName && { name: plantName })
  });
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Handle deep link navigation
 * @param {string} url - Deep link URL
 * @param {Object} navigation - Navigation object
 * @returns {boolean} Success status
 */
export const handleDeepLink = (url, navigation) => {
  try {
    if (url.startsWith('educultivo://plant/')) {
      const plantId = url.replace('educultivo://plant/', '');
      
      // Navigate to plant detail screen
      navigation.navigate('PlantDetail', { plantId });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error handling deep link:', error);
    return false;
  }
};

/**
 * Validate QR code format
 * @param {string} data - QR code data
 * @returns {boolean} Is valid format
 */
export const isValidQRFormat = (data) => {
  if (!data || typeof data !== 'string') {
    return false;
  }

  // Check for JSON format
  try {
    const parsed = JSON.parse(data);
    return parsed.type === QR_CODE_TYPE && parsed.plantId;
  } catch {
    // Check for deep link format
    return data.startsWith('educultivo://plant/') && data.length > 20;
  }
};

/**
 * Get QR code display name
 * @param {Object} parsedData - Parsed QR data
 * @returns {string} Display name
 */
export const getQRDisplayName = (parsedData) => {
  if (parsedData.plantName) {
    return parsedData.plantName;
  }
  
  if (parsedData.scientificName) {
    return parsedData.scientificName;
  }
  
  return `Planta ${parsedData.plantId.slice(-6)}`;
};

/**
 * Generate QR code URL using a QR code API service
 * @param {string} data - Data to encode in QR code
 * @param {number} size - QR code size in pixels
 * @returns {string} QR code image URL
 */
export const generateQRCodeUrl = (data, size = 300) => {
  // Using qr-server.com API (free service)
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
};

/**
 * Generate sharing message for a plant
 * @param {Object} plant - Plant object
 * @returns {string} Sharing message
 */
export const generateSharingMessage = (plant) => {
  const webLink = generatePlantWebLink(plant.id, plant.name);
  return `Confira minha planta "${plant.name}" no Educultivo! 🌱\n\n${webLink}`;
};

/**
 * Generate print message with QR code
 * @param {Object} plant - Plant object
 * @param {string} qrCodeUrl - QR code image URL
 * @returns {string} Print message
 */
export const generatePrintMessage = (plant, qrCodeUrl) => {
  return `QR Code da planta "${plant.name}"\n\nEscaneie para ver detalhes no Educultivo 🌱\n\n${qrCodeUrl}`;
};

/**
 * Generate plant identification card data
 * @param {Object} plant - Plant object
 * @returns {Object} Card data
 */
export const generatePlantCard = (plant) => {
  return {
    name: plant.name,
    scientific: plant.scientific_name || plant.scientific,
    qrCode: generatePlantQRData(plant),
    qrCodeUrl: generateQRCodeUrl(generatePlantQRData(plant)),
    webLink: generatePlantWebLink(plant.id, plant.name),
    deepLink: generatePlantDeepLink(plant.id)
  };
};

export default {
  generatePlantQRData,
  parseQRData,
  generatePlantDeepLink,
  generatePlantWebLink,
  generateQRCodeUrl,
  generateSharingMessage,
  generatePrintMessage,
  generatePlantCard,
  handleDeepLink,
  isValidQRFormat,
  getQRDisplayName,
  QR_CODE_VERSION,
  QR_CODE_TYPE
};