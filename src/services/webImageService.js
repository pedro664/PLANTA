/**
 * Web-compatible Image Service
 * Handles image upload for web browsers using HTML5 File API
 */

import { Platform } from 'react-native';

// Web-specific image handling
export const createWebImagePicker = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      resolve(null);
      return;
    }

    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Create object URL for preview
        const imageUri = URL.createObjectURL(file);
        
        // Convert to base64 for compatibility
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            uri: imageUri,
            base64: reader.result.split(',')[1],
            type: file.type,
            name: file.name,
            size: file.size,
            file: file // Keep original file for upload
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    // Trigger file picker
    input.click();
  });
};

// Web-compatible camera capture (using getUserMedia)
export const createWebCameraCapture = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      resolve(null);
      return;
    }

    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Câmera não disponível neste navegador');
      resolve(null);
      return;
    }

    // Create modal for camera
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const video = document.createElement('video');
    video.style.cssText = `
      width: 90%;
      max-width: 400px;
      height: auto;
      border-radius: 8px;
    `;
    video.autoplay = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      margin-top: 20px;
      display: flex;
      gap: 10px;
    `;

    const captureBtn = document.createElement('button');
    captureBtn.textContent = 'Capturar';
    captureBtn.style.cssText = `
      padding: 12px 24px;
      background: #2E4A3D;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = `
      padding: 12px 24px;
      background: #666;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    `;

    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(cancelBtn);
    modal.appendChild(video);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);

    let stream = null;

    // Start camera
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // Back camera on mobile
      } 
    })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error('Error accessing camera:', error);
      alert('Erro ao acessar a câmera');
      cleanup();
      resolve(null);
    });

    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      document.body.removeChild(modal);
    };

    captureBtn.onclick = () => {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        const imageUri = URL.createObjectURL(blob);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
          cleanup();
          resolve({
            uri: imageUri,
            base64: reader.result.split(',')[1],
            type: 'image/jpeg',
            name: `camera-${Date.now()}.jpg`,
            size: blob.size,
            file: blob
          });
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };
  });
};

// Unified image picker that works on all platforms
export const showUniversalImagePicker = () => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // Show web-specific options
      const options = [
        { text: 'Escolher Arquivo', action: 'gallery' },
        { text: 'Usar Câmera', action: 'camera' },
        { text: 'Cancelar', action: 'cancel' }
      ];

      // Create simple modal for options
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        min-width: 250px;
        text-align: center;
      `;

      const title = document.createElement('h3');
      title.textContent = 'Selecionar Imagem';
      title.style.cssText = `
        margin: 0 0 20px 0;
        color: #2E4A3D;
      `;
      dialog.appendChild(title);

      options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.style.cssText = `
          display: block;
          width: 100%;
          padding: 12px;
          margin: 8px 0;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: ${option.action === 'cancel' ? '#f5f5f5' : '#2E4A3D'};
          color: ${option.action === 'cancel' ? '#666' : 'white'};
          cursor: pointer;
          font-size: 16px;
        `;

        button.onclick = async () => {
          document.body.removeChild(modal);
          
          if (option.action === 'gallery') {
            const result = await createWebImagePicker();
            resolve(result);
          } else if (option.action === 'camera') {
            const result = await createWebCameraCapture();
            resolve(result);
          } else {
            resolve(null);
          }
        };

        dialog.appendChild(button);
      });

      modal.appendChild(dialog);
      document.body.appendChild(modal);

      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(null);
        }
      };
    } else {
      // Use native image picker for mobile
      resolve(null);
    }
  });
};

// Convert image to different formats for upload
export const processImageForUpload = async (imageResult) => {
  if (!imageResult) return null;

  if (Platform.OS === 'web') {
    // For web, we already have the processed data
    return {
      uri: imageResult.uri,
      type: imageResult.type,
      name: imageResult.name,
      size: imageResult.size,
      base64: imageResult.base64,
      file: imageResult.file
    };
  }

  // For native platforms, return as-is
  return imageResult;
};

// Clean up object URLs to prevent memory leaks
export const cleanupImageUri = (uri) => {
  if (Platform.OS === 'web' && uri && uri.startsWith('blob:')) {
    URL.revokeObjectURL(uri);
  }
};