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
  // Badge definitions com cores vibrantes do tema botanical
  const badgeDefinitions = {
    // Badges principais
    first_sprout: {
      name: "Primeiro Broto",
      icon: "leaf",
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    },
    first_plant: {
      name: "Primeira Planta",
      icon: "leaf",
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    },
    water_master: {
      name: "Mestre da Água",
      icon: "water",
      color: '#2196F3',
      bgColor: '#E3F2FD'
    },
    green_thumb: {
      name: "Polegar Verde",
      icon: "thumbs-up",
      color: '#8BC34A',
      bgColor: '#F1F8E9'
    },
    plant_lover: {
      name: "Amante de Plantas",
      icon: "heart",
      color: '#E91E63',
      bgColor: '#FCE4EC'
    },
    community_star: {
      name: "Estrela da Comunidade",
      icon: "star",
      color: '#FFC107',
      bgColor: '#FFF8E1'
    },
    plant_collector: {
      name: "Colecionador",
      icon: "albums",
      color: colors.botanical.clay,
      bgColor: '#FBE9E7'
    },
    dedication: {
      name: "Dedicação",
      icon: "trophy",
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
    dedicated_caretaker: {
      name: "Cuidador Dedicado",
      icon: "heart-circle",
      color: '#E91E63',
      bgColor: '#FCE4EC'
    },
    expert: {
      name: "Especialista",
      icon: "ribbon",
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    },
    early_bird: {
      name: "Madrugador",
      icon: "sunny",
      color: '#FFEB3B',
      bgColor: '#FFFDE7'
    },
    plant_whisperer: {
      name: "Sussurrador",
      icon: "ear",
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    }
  };

  // Aliases para nomes em português ou variações
  const badgeAliases = {
    'Primeira Planta': 'first_plant',
    'Primeiro Broto': 'first_sprout',
    'Cuidador Dedicado': 'dedicated_caretaker',
    'Polegar Verde': 'green_thumb',
    'Mestre da Água': 'water_master',
    'Amante de Plantas': 'plant_lover',
    'Colecionador': 'plant_collector',
    'Especialista': 'expert',
    'Dedicação': 'dedication',
  };

  // Resolver o ID da badge (pode vir como ID ou nome em português)
  const resolvedBadgeId = badgeAliases[badgeId] || badgeId;

  // Get badge data from definitions
  let badgeData;
  if (resolvedBadgeId && badgeDefinitions[resolvedBadgeId]) {
    badgeData = badgeDefinitions[resolvedBadgeId];
  } else {
    // Fallback para badges desconhecidas - usar nome fornecido
    badgeData = {
      name: badgeId || name || 'Badge',
      icon: icon || 'ribbon',
      color: color || '#8BC34A',
      bgColor: '#F1F8E9'
    };
  }

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 48,
      iconRadius: 24,
      fontSize: 9,
      minWidth: 60,
      iconInnerSize: 22,
    },
    medium: {
      iconSize: 64,
      iconRadius: 32,
      fontSize: 10,
      minWidth: 80,
      iconInnerSize: 28,
    },
    large: {
      iconSize: 80,
      iconRadius: 40,
      fontSize: 12,
      minWidth: 100,
      iconInnerSize: 36,
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
            ? badgeData.bgColor 
            : colors.botanical.sand,
          borderColor: isEarned 
            ? badgeData.color 
            : colors.botanical.sage + '40',
        }
      ]}>
        <Ionicons 
          name={badgeData.icon} 
          size={config.iconInnerSize} 
          color={isEarned ? badgeData.color : colors.botanical.sage} 
        />
      </View>
      <Text style={[
        styles.name,
        { fontSize: config.fontSize },
        isEarned && { color: badgeData.color },
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
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  containerLocked: {
    opacity: 0.45,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  name: {
    ...textStyles.caption,
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 75,
  },
  nameLocked: {
    color: colors.botanical.sage,
    fontWeight: '500',
  },
});

export default Badge;