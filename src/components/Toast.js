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

  badge: ({ text1, text2, onPress, hide }) => (
    <BadgeToast
      title={text1}
      badgeName={text2}
      onPress={onPress}
      onClose={hide}
    />
  ),
};

// Badge Toast Component - Special celebration toast for earning badges
const BadgeToast = ({ title, badgeName, onPress, onClose }) => {
  return (
    <TouchableOpacity
      style={styles.badgeContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Celebration icon */}
      <View style={styles.badgeIconContainer}>
        <Ionicons name="trophy" size={28} color="#FFD700" />
      </View>

      {/* Content */}
      <View style={styles.badgeContent}>
        <Text style={styles.badgeTitle}>
          {title || '🎉 Nova Conquista!'}
        </Text>
        <Text style={styles.badgeName} numberOfLines={1}>
          {badgeName}
        </Text>
      </View>

      {/* Sparkle decoration */}
      <View style={styles.sparkleContainer}>
        <Ionicons name="sparkles" size={20} color="#FFD700" />
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.badgeCloseButton} onPress={onClose}>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
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

  // Badge Toast styles
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.botanical.dark,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    minHeight: 72,
    maxWidth: 400,
    width: '92%',
    alignSelf: 'center',
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 2,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.base,
  },
  sparkleContainer: {
    marginRight: spacing.sm,
  },
  badgeCloseButton: {
    padding: spacing.xs,
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

export const showBadgeToast = (badgeName, options = {}) => {
  Toast.show({
    type: 'badge',
    text1: options.title || '🎉 Nova Conquista!',
    text2: badgeName,
    position: 'top',
    visibilityTime: 5000,
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
  showBadgeToast,
  ToastComponent,
};
