/**
 * Toast Component
 * Simple toast notifications using react-native-toast-message
 */

import React from 'react';
import Toast from 'react-native-toast-message';

export const showSuccessToast = (message, options = {}) => {
  Toast.show({
    type: 'success',
    text1: 'Sucesso',
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    ...options,
  });
};

export const showErrorToast = (message, options = {}) => {
  Toast.show({
    type: 'error',
    text1: 'Erro',
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    ...options,
  });
};

export const showInfoToast = (message, options = {}) => {
  Toast.show({
    type: 'info',
    text1: 'Informação',
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    ...options,
  });
};

// Component to render the Toast
export const ToastComponent = () => {
  return <Toast />;
};

export default {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  ToastComponent,
};