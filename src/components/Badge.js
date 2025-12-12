import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { textStyles } from '../theme/typography';

const Badge = ({ 
  badgeId, 
  name, 
  icon, 
  color, 
  isEarned = false, 
  size = 'medium',
  style 
}) => {
  // Default badge definitions for common badges
  const defaultBadgeDefinitions = {
    first_sprout: {
      name: "Primeiro Broto",
      icon: "add-circle",
      color: colors.botanical.clay
    },
    water_master: {
      name: "Mestre da Água",
      icon: "water",
      color: '#059669' // green-600
    },
    green_thumb: {
      name: "Polegar Verde",
      icon: "thumbs-up",
      color: '#059669' // emerald-600
    },
    community_star: {
      name: "Estrela da Comunidade",
      icon: "star",
      color: '#F59E0B' // amber-500
    },
    plant_collector: {
      name: "Colecionador",
      icon: "library",
      color: colors.botanical.sage
    },
    dedication: {
      name: "Dedicação",
      icon: "trophy",
      color: '#DC2626' // red-600
    }
  };

  // Get badge data from props or default definitions
  let badgeData;
  if (badgeId && defaultBadgeDefinitions[badgeId]) {
    badgeData = defaultBadgeDefinitions[badgeId];
  } else {
    badgeData = {
      name: name || 'Badge',
      icon: icon || 'star',
      color: color || colors.botanical.clay
    };
  }

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 48,
      iconRadius: 24,
      fontSize: 9,
      minWidth: 60,
    },
    medium: {
      iconSize: 64,
      iconRadius: 32,
      fontSize: 10,
      minWidth: 80,
    },
    large: {
      iconSize: 80,
      iconRadius: 40,
      fontSize: 12,
      minWidth: 100,
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <View style={[
      styles.container, 
      { minWidth: config.minWidth },
      !isEarned && styles.containerLocked,
      style
    ]}>
      <View style={[
        styles.iconContainer,
        {
          width: config.iconSize,
          height: config.iconSize,
          borderRadius: config.iconRadius,
          backgroundColor: isEarned 
            ? `${badgeData.color}1A` 
            : 'rgba(141, 163, 153, 0.1)',
          borderColor: isEarned 
            ? `${badgeData.color}4D` 
            : 'rgba(141, 163, 153, 0.2)'
        }
      ]}>
        <Ionicons 
          name={badgeData.icon} 
          size={config.iconSize * 0.5} 
          color={isEarned ? badgeData.color : colors.botanical.sage} 
        />
      </View>
      <Text style={[
        styles.name,
        { fontSize: config.fontSize },
        !isEarned && styles.nameLocked
      ]}>
        {badgeData.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  containerLocked: {
    opacity: 0.4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  name: {
    ...textStyles.caption,
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    lineHeight: 12,
  },
  nameLocked: {
    color: colors.botanical.sage,
  },
});

export default Badge;