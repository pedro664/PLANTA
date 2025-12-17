/**
 * Toast Component - Custom Design
 * Beautiful toast notifications matching the botanical theme
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Toast, { BaseToast } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

// Toast configuration for each type
const toastConfig = {
  success: ({ text1, text2, onPress, hide }) => (
    <CustomToast
      type="success"
      title={text1}
      message={text2}
      icon="checkmark-circle"
      iconColor="#4CAF50"
      backgroundColor={colors.botanical.base}
      borderColor="#4CAF50"
      onPress={onPress}
      onClose={hide}
    />
  ),
  
  error: ({ text1, text2, onPress, hide }) => (
    <CustomToast
      type="error"
      title={text1}
      message={text2}
      icon="close-circle"
      iconColor="#E53935"
      backgroundColor={colors.botanical.base}
      borderColor="#E53935"
      onPress={onPress}
      onClose={hide}
    />
  ),
  
  info: ({ text1, text2, onPress, hide }) => (
    <CustomToast
      type="info"
      title={text1}
      message={text2}
      icon="information-circle"
      iconColor={colors.botanical.clay}
      backgroundColor={colors.botanical.base}
      borderColor={colors.botanical.clay}
      onPress={onPress}
      onClose={hide}
    />
  ),
  
  warning: ({ text1, text2, onPress, hide }) => (
    <CustomToast
      type="warning"
      title={text1}
      message={text2}
      icon="warning"
      iconColor="#FF9800"
      backgroundColor={colors.botanical.base}
      borderColor="#FF9800"
      onPress={onPress}
      onClose={hide}
    />
  ),
};

// Custom Toast Component
const CustomToast = ({ 
  type, 
  title, 
  message, 
  icon, 
  iconColor, 
  backgroundColor, 
  borderColor,
  onPress,
  onClose 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor, borderLeftColor: borderColor }
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: colors.botanical.dark }]}>
            {title}
          </Text>
        )}
        {message && (
          <Text style={[styles.message, { color: colors.botanical.sage }]} numberOfLines={2}>
            {message}
          </Text>
        )}
      </View>
      
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={18} color={colors.botanical.sage} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 64,
    maxWidth: 400,
    width: '92%',
    alignSelf: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

// Helper functions to show toasts
export const showSuccessToast = (message, options = {}) => {
  Toast.show({
    type: 'success',
    text1: options.title || 'Sucesso!',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 50,
    ...options,
  });
};

export const showErrorToast = (message, options = {}) => {
  Toast.show({
    type: 'error',
    text1: options.title || 'Erro',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    topOffset: 50,
    ...options,
  });
};

export const showInfoToast = (message, options = {}) => {
  Toast.show({
    type: 'info',
    text1: options.title || 'Informação',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 50,
    ...options,
  });
};

export const showWarningToast = (message, options = {}) => {
  Toast.show({
    type: 'warning',
    text1: options.title || 'Atenção',
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    topOffset: 50,
    ...options,
  });
};

// Component to render the Toast with custom config
export const ToastComponent = () => {
  return <Toast config={toastConfig} />;
};

export default {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  ToastComponent,
};
