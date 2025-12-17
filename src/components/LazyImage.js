import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Animated,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCachedImage, preloadImages } from '../services/imageCache';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

/**
 * LazyImage Component
 * Provides lazy loading with caching, placeholders, and smooth transitions
 */

const LazyImage = ({
  source,
  style,
  placeholder = 'leaf',
  showLoadingIndicator = true,
  fadeDuration = 300,
  resizeMode = 'cover',
  onLoad,
  onError,
  ...props
}) => {
  const [imageUri, setImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const fadeAnimRef = useRef(new Animated.Value(0));
  const placeholderFadeAnimRef = useRef(new Animated.Value(1));
  const loadingOpacityRef = useRef(new Animated.Value(1));
  
  const fadeAnim = fadeAnimRef.current;
  const placeholderFadeAnim = placeholderFadeAnimRef.current;
  const loadingOpacity = loadingOpacityRef.current;

  // Extract URI from source prop
  const sourceUri = typeof source === 'string' ? source : source?.uri;

  useEffect(() => {
    if (!sourceUri) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Check if it's already a local file
    if (sourceUri.startsWith('file://') || sourceUri.startsWith('/')) {
      setImageUri(sourceUri);
      setIsLoading(false);
      animateImageIn();
      return;
    }

    loadImage();
  }, [sourceUri]);

  const loadImage = async () => {
    if (!sourceUri) return;

    try {
      setIsLoading(true);
      setHasError(false);
      
      // Get cached image or download
      const cachedUri = await getCachedImage(sourceUri);
      
      if (cachedUri) {
        setImageUri(cachedUri);
        
        // Try to preload image, but don't fail if prefetch doesn't work (web compatibility)
        try {
          await Image.prefetch(cachedUri);
        } catch {
          // Prefetch failed (common on web), continue anyway
        }
        
        setIsLoading(false);
        animateImageIn();
      } else {
        // No cached URI, try using original source directly
        setImageUri(sourceUri);
        setIsLoading(false);
        animateImageIn();
      }
    } catch (error) {
      console.error('Error loading image:', error);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const animateImageIn = () => {
    // Fade out loading indicator
    Animated.timing(loadingOpacity, {
      toValue: 0,
      duration: fadeDuration / 2,
      useNativeDriver: true,
    }).start();

    // Fade out placeholder and fade in image
    Animated.parallel([
      Animated.timing(placeholderFadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(true);
    });
  };

  const handleImageLoad = () => {
    if (onLoad) {
      onLoad();
    }
  };

  const handleImageError = (error) => {
    // Only log in development, and make it less noisy
    if (__DEV__) {
      console.warn('LazyImage: Failed to load image:', sourceUri?.substring(0, 50));
    }
    setHasError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(error);
    }
  };

  const getPlaceholderIcon = () => {
    switch (placeholder) {
      case 'plant':
        return 'leaf';
      case 'user':
        return 'person';
      case 'camera':
        return 'camera';
      case 'image':
        return 'image';
      default:
        return 'leaf';
    }
  };

  const renderPlaceholder = () => (
    <Animated.View 
      style={[
        styles.placeholder, 
        style,
        { opacity: placeholderFadeAnim }
      ]}
    >
      <View style={styles.placeholderContent}>
        <Ionicons 
          name={getPlaceholderIcon()} 
          size={Math.min((style?.width || 40) * 0.3, 40)} 
          color={colors.botanical.sage} 
        />
      </View>
    </Animated.View>
  );

  const renderLoadingIndicator = () => {
    if (!showLoadingIndicator || !isLoading) return null;

    return (
      <Animated.View 
        style={[
          styles.loadingContainer,
          style,
          { opacity: loadingOpacity }
        ]}
      >
        <ActivityIndicator 
          size="small" 
          color={colors.botanical.clay} 
        />
      </Animated.View>
    );
  };

  const renderErrorState = () => {
    if (!hasError) return null;

    // Show a friendly placeholder instead of error icon
    return (
      <View style={[styles.errorContainer, style]}>
        <View style={styles.errorContent}>
          <Ionicons 
            name={getPlaceholderIcon()} 
            size={Math.min((style?.width || 40) * 0.3, 40)} 
            color={colors.botanical.sage} 
          />
        </View>
      </View>
    );
  };

  const renderImage = () => {
    if (!imageUri || hasError) return null;

    // Extract resizeMode from style if present (to avoid deprecation warning)
    const { resizeMode: styleResizeMode, ...cleanStyle } = StyleSheet.flatten(style) || {};
    const finalResizeMode = resizeMode || styleResizeMode || 'cover';

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, cleanStyle]}
          resizeMode={finalResizeMode}
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...props}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]} {...props}>
      {/* Placeholder */}
      {!isVisible && !hasError && renderPlaceholder()}
      
      {/* Loading indicator */}
      {renderLoadingIndicator()}
      
      {/* Error state */}
      {renderErrorState()}
      
      {/* Actual image */}
      {renderImage()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.botanical.sand,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.botanical.sand,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.botanical.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
});

export default LazyImage;