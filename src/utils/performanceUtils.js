import { InteractionManager } from 'react-native';

/**
 * Performance Utilities for EduCultivo
 * Provides utilities for optimizing FlatList performance and general app performance
 */

// FlatList optimization configurations
export const FLATLIST_CONFIGS = {
  // For image-heavy lists (like community feed)
  imageHeavy: {
    windowSize: 10,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 100,
    initialNumToRender: 6,
    removeClippedSubviews: true,
    getItemLayout: null, // Set this if you know item dimensions
  },
  
  // For plant grids (2 columns)
  plantGrid: {
    windowSize: 8,
    maxToRenderPerBatch: 4,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 8,
    removeClippedSubviews: true,
    getItemLayout: null,
  },
  
  // For simple lists (like comments)
  simple: {
    windowSize: 15,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    removeClippedSubviews: false,
    getItemLayout: null,
  },
};

/**
 * Create optimized FlatList props for different use cases
 */
export const getOptimizedFlatListProps = (type = 'simple', customConfig = {}) => {
  const baseConfig = FLATLIST_CONFIGS[type] || FLATLIST_CONFIGS.simple;
  
  return {
    ...baseConfig,
    ...customConfig,
    // Performance optimizations
    keyExtractor: customConfig.keyExtractor || ((item, index) => 
      item.id?.toString() || index.toString()
    ),
    // Prevent unnecessary re-renders
    extraData: customConfig.extraData,
    // Optimize scrolling performance
    scrollEventThrottle: 16,
    // Reduce memory usage
    legacyImplementation: false,
  };
};

/**
 * Create getItemLayout function for known item dimensions
 * This significantly improves FlatList performance
 */
export const createGetItemLayout = (itemHeight, separatorHeight = 0) => {
  return (data, index) => ({
    length: itemHeight,
    offset: (itemHeight + separatorHeight) * index,
    index,
  });
};

/**
 * Create getItemLayout for grid layouts (numColumns > 1)
 */
export const createGridItemLayout = (itemHeight, numColumns, separatorHeight = 0) => {
  return (data, index) => {
    const rowIndex = Math.floor(index / numColumns);
    return {
      length: itemHeight,
      offset: (itemHeight + separatorHeight) * rowIndex,
      index,
    };
  };
};

/**
 * Debounce function for search and other frequent operations
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for scroll events and animations
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Run callback after interactions are complete
 * Useful for heavy operations that shouldn't block UI
 */
export const runAfterInteractions = (callback) => {
  return InteractionManager.runAfterInteractions(callback);
};

/**
 * Batch multiple state updates to prevent unnecessary re-renders
 */
export const batchUpdates = (callback) => {
  // In React Native, state updates are automatically batched in event handlers
  // This is a placeholder for potential future React 18 features
  callback();
};

/**
 * Memory-efficient image preloading
 * Preloads images in batches to avoid memory spikes
 */
export const preloadImagesInBatches = async (imageUrls, batchSize = 5, delay = 100) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return [];
  }

  const results = [];
  
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map(url => {
          if (typeof url === 'string' && url.startsWith('http')) {
            return Image.prefetch(url);
          }
          return Promise.resolve(url);
        })
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < imageUrls.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.warn('Error preloading image batch:', error);
    }
  }
  
  return results;
};

/**
 * Optimize component re-renders with memoization helpers
 */
export const createMemoizedComponent = (Component, areEqual) => {
  return React.memo(Component, areEqual);
};

/**
 * Default comparison function for plant items
 */
export const plantItemsEqual = (prevProps, nextProps) => {
  return (
    prevProps.plant?.id === nextProps.plant?.id &&
    prevProps.plant?.status === nextProps.plant?.status &&
    prevProps.plant?.image === nextProps.plant?.image &&
    prevProps.plant?.name === nextProps.plant?.name
  );
};

/**
 * Default comparison function for post items
 */
export const postItemsEqual = (prevProps, nextProps) => {
  return (
    prevProps.post?.id === nextProps.post?.id &&
    prevProps.post?.likes === nextProps.post?.likes &&
    prevProps.post?.likedBy?.length === nextProps.post?.likedBy?.length &&
    prevProps.post?.image === nextProps.post?.image
  );
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  // Track component render times
  trackRender: (componentName, startTime = Date.now()) => {
    return () => {
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      if (__DEV__ && renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
      }
      
      return renderTime;
    };
  },
  
  // Track async operations
  trackAsync: async (operationName, asyncOperation) => {
    const startTime = Date.now();
    
    try {
      const result = await asyncOperation();
      const endTime = Date.now();
      
      if (__DEV__) {
        console.log(`${operationName} completed in ${endTime - startTime}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      
      if (__DEV__) {
        console.error(`${operationName} failed after ${endTime - startTime}ms:`, error);
      }
      
      throw error;
    }
  },
  
  // Memory usage tracking (basic)
  trackMemory: (label) => {
    if (__DEV__ && global.performance && global.performance.memory) {
      const memory = global.performance.memory;
      console.log(`Memory usage at ${label}:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  },
};

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  // Calculate optimal image dimensions based on container size
  getOptimalDimensions: (containerWidth, containerHeight, aspectRatio = 1) => {
    const maxWidth = Math.min(containerWidth * 2, 1024); // 2x for retina, max 1024px
    const maxHeight = Math.min(containerHeight * 2, 1024);
    
    let width, height;
    
    if (aspectRatio >= 1) {
      // Landscape or square
      width = Math.min(maxWidth, maxHeight * aspectRatio);
      height = width / aspectRatio;
    } else {
      // Portrait
      height = Math.min(maxHeight, maxWidth / aspectRatio);
      width = height * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  },
  
  // Generate optimized image URL (for services that support it)
  getOptimizedUrl: (originalUrl, width, height, quality = 80) => {
    if (!originalUrl || typeof originalUrl !== 'string') {
      return originalUrl;
    }
    
    // For Unsplash images, add optimization parameters
    if (originalUrl.includes('unsplash.com')) {
      const url = new URL(originalUrl);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('h', height.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'format');
      return url.toString();
    }
    
    // For other services, return original URL
    return originalUrl;
  },
};

/**
 * List optimization hooks and utilities
 */
export const listOptimization = {
  // Create optimized keyExtractor
  createKeyExtractor: (idField = 'id') => (item, index) => {
    return item[idField]?.toString() || index.toString();
  },
  
  // Create optimized renderItem with memoization
  createMemoizedRenderItem: (RenderComponent, areEqual) => {
    const MemoizedComponent = React.memo(RenderComponent, areEqual);
    
    return ({ item, index, ...props }) => (
      <MemoizedComponent 
        key={item.id || index}
        item={item} 
        index={index} 
        {...props} 
      />
    );
  },
  
  // Optimize data for FlatList rendering
  optimizeListData: (data, sortKey, filterFn) => {
    if (!Array.isArray(data)) return [];
    
    let optimizedData = data;
    
    // Apply filter if provided
    if (typeof filterFn === 'function') {
      optimizedData = optimizedData.filter(filterFn);
    }
    
    // Apply sort if provided
    if (sortKey) {
      optimizedData = [...optimizedData].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal);
        }
        
        return aVal - bVal;
      });
    }
    
    return optimizedData;
  },
};