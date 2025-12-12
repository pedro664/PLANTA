import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import Text from './Text';
import LazyImage from './LazyImage';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { componentShadows } from '../theme/shadows';

const PlantCard = ({ plant, onPress, style }) => {
  // Animation temporarily disabled for compatibility
  const getStatusIcon = (status) => {
    switch (status) {
      case 'thirsty':
        return '💧';
      case 'attention':
        return '⚠️';
      case 'fine':
      default:
        return '✅';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'thirsty':
        return 'Precisa de água';
      case 'attention':
        return 'Atenção';
      case 'fine':
      default:
        return 'Saudável';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'thirsty':
        return colors.plant.thirsty;
      case 'attention':
        return colors.plant.attention;
      case 'fine':
      default:
        return colors.plant.healthy;
    }
  };

  return (
    <Animated.View style={pulseAnimatedStyle}>
      <TouchableOpacity 
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
      <LazyImage 
        source={{ uri: plant.image }} 
        style={styles.image}
        placeholder="plant"
        showLoadingIndicator={true}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {plant.name}
        </Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>
            {getStatusIcon(plant.status)}
          </Text>
          <Text 
            style={[
              styles.statusText, 
              { color: getStatusColor(plant.status) }
            ]}
            numberOfLines={1}
          >
            {getStatusText(plant.status)}
          </Text>
        </View>

        {plant.scientific && (
          <Text style={styles.scientific} numberOfLines={1}>
            {plant.scientific}
          </Text>
        )}
      </View>

      {/* Status indicator dot */}
      {plant.status !== 'fine' && (
        <View 
          style={[
            styles.statusDot, 
            { backgroundColor: getStatusColor(plant.status) }
          ]} 
        />
      )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    ...componentShadows.plantCard,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: colors.botanical.sand,
  },
  content: {
    padding: spacing.sm,
  },
  name: {
    ...textStyles.body,
    color: colors.botanical.dark,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: spacing.xs / 2,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '700',
    flex: 1,
  },
  scientific: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    fontStyle: 'italic',
  },
  statusDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.ui.background,
  },
});

export default PlantCard;