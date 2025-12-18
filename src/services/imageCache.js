import { Image, Platform } from 'react-native';

// FileSystem será importado dinamicamente apenas em plataformas nativas
let FileSystem = null;
const getFileSystem = async () => {
  if (Platform.OS === 'web') return null;
  if (!FileSystem) {
    FileSystem = await import('expo-file-system/legacy');
  }
  return FileSystem;
};

/**
 * Image Cache Service for EduCultivo
 * Provides efficient image caching with automatic cleanup and memory management
 */

// Cache configuration
const CACHE_CONFIG = {
  maxCacheSize: 50 * 1024 * 1024, // 50MB max cache size
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours cleanup interval
  compressionQuality: 0.8,
  maxImageSize: 1024, // Max width/height in pixels
};

// Cache directories serão definidos após carregar FileSystem
let CACHE_DIR = '';
let CACHE_INDEX_FILE = '';

// In-memory cache for quick access
const memoryCache = new Map();
const downloadPromises = new Map(); // Prevent duplicate downloads

/**
 * Initialize cache directory and load cache index
 */
const initializeCache = async () => {
  try {
    // Skip cache initialization on web platform
    if (Platform.OS === 'web') {
      console.log('📱 Image cache disabled on web platform');
      return;
    }

    const fs = await getFileSystem();
    if (!fs) return;
    
    // Definir diretórios de cache
    CACHE_DIR = `${fs.cacheDirectory}images/`;
    CACHE_INDEX_FILE = `${fs.cacheDirectory}imageCache.json`;

    // Ensure cache directory exists
    const dirInfo = await fs.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await fs.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }

    // Load cache index
    await loadCacheIndex();
    
    // Schedule periodic cleanup
    scheduleCleanup();
  } catch (error) {
    console.error('Error initializing image cache:', error);
  }
};

/**
 * Load cache index from storage
 */
const loadCacheIndex = async () => {
  try {
    if (Platform.OS === 'web') return;
    const fs = await getFileSystem();
    if (!fs) return;
    
    const indexInfo = await fs.getInfoAsync(CACHE_INDEX_FILE);
    if (indexInfo.exists) {
      const indexData = await fs.readAsStringAsync(CACHE_INDEX_FILE);
      const cacheIndex = JSON.parse(indexData);
      
      // Populate memory cache with metadata
      Object.entries(cacheIndex).forEach(([url, metadata]) => {
        memoryCache.set(url, metadata);
      });
    }
  } catch (error) {
    console.error('Error loading cache index:', error);
  }
};

/**
 * Save cache index to storage
 */
const saveCacheIndex = async () => {
  try {
    if (Platform.OS === 'web') return;
    const fs = await getFileSystem();
    if (!fs) return;
    
    const cacheIndex = Object.fromEntries(memoryCache);
    await fs.writeAsStringAsync(CACHE_INDEX_FILE, JSON.stringify(cacheIndex));
  } catch (error) {
    console.error('Error saving cache index:', error);
  }
};

/**
 * Generate cache key from URL
 */
const getCacheKey = (url) => {
  return url.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString(36);
};

/**
 * Get cached image path if exists and valid
 */
const getCachedImagePath = async (url) => {
  if (Platform.OS === 'web') return null;
  
  const metadata = memoryCache.get(url);
  if (!metadata) return null;

  const cachedPath = `${CACHE_DIR}${metadata.filename}`;
  
  try {
    const fs = await getFileSystem();
    if (!fs) return null;
    
    const fileInfo = await fs.getInfoAsync(cachedPath);
    if (!fileInfo.exists) {
      // File doesn't exist, remove from cache
      memoryCache.delete(url);
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - metadata.cachedAt > CACHE_CONFIG.maxCacheAge) {
      // Cache expired, remove file and metadata
      await fs.deleteAsync(cachedPath);
      memoryCache.delete(url);
      return null;
    }

    // Update last accessed time
    metadata.lastAccessed = now;
    memoryCache.set(url, metadata);
    
    return cachedPath;
  } catch (error) {
    console.error('Error checking cached image:', error);
    return null;
  }
};

/**
 * Download and cache image
 */
const downloadAndCacheImage = async (url) => {
  if (Platform.OS === 'web') return url;
  
  // Check if download is already in progress
  if (downloadPromises.has(url)) {
    return downloadPromises.get(url);
  }

  const downloadPromise = (async () => {
    try {
      const fs = await getFileSystem();
      if (!fs) return url;
      
      const filename = getCacheKey(url) + '.jpg';
      const cachedPath = `${CACHE_DIR}${filename}`;
      
      // Download image
      const downloadResult = await fs.downloadAsync(url, cachedPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      // Get file info
      const fileInfo = await fs.getInfoAsync(cachedPath);
      
      // Store metadata in memory cache
      const metadata = {
        filename,
        originalUrl: url,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
        size: fileInfo.size,
      };
      
      memoryCache.set(url, metadata);
      
      // Save cache index
      await saveCacheIndex();
      
      // Check cache size and cleanup if needed
      await checkCacheSizeAndCleanup();
      
      return cachedPath;
    } catch (error) {
      console.error('Error downloading and caching image:', error);
      throw error;
    } finally {
      downloadPromises.delete(url);
    }
  })();

  downloadPromises.set(url, downloadPromise);
  return downloadPromise;
};

/**
 * Get image from cache or download if not cached
 */
export const getCachedImage = async (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // On web platform, return original URL (no caching)
  if (Platform.OS === 'web') {
    return url;
  }

  // Check if it's already a local file
  if (url.startsWith('file://') || url.startsWith('/')) {
    return url;
  }

  try {
    // Check cache first
    const cachedPath = await getCachedImagePath(url);
    if (cachedPath) {
      return cachedPath;
    }

    // Download and cache
    return await downloadAndCacheImage(url);
  } catch (error) {
    console.error('Error getting cached image:', error);
    return url; // Return original URL as fallback
  }
};

/**
 * Preload images for better performance
 */
export const preloadImages = async (urls) => {
  if (!Array.isArray(urls)) return;
  
  // Skip preloading on web platform
  if (Platform.OS === 'web') {
    return;
  }

  const preloadPromises = urls
    .filter(url => url && typeof url === 'string')
    .map(url => getCachedImage(url).catch(error => {
      console.warn('Failed to preload image:', url, error);
      return null;
    }));

  try {
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.error('Error preloading images:', error);
  }
};

/**
 * Check cache size and cleanup old files if needed
 */
const checkCacheSizeAndCleanup = async () => {
  try {
    if (Platform.OS === 'web') return;
    const fs = await getFileSystem();
    if (!fs) return;
    
    const files = await fs.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    const fileStats = [];

    // Get file stats
    for (const file of files) {
      const filePath = `${CACHE_DIR}${file}`;
      const fileInfo = await fs.getInfoAsync(filePath);
      if (fileInfo.exists) {
        totalSize += fileInfo.size;
        fileStats.push({
          path: filePath,
          filename: file,
          size: fileInfo.size,
          modificationTime: fileInfo.modificationTime,
        });
      }
    }

    // If cache size exceeds limit, remove oldest files
    if (totalSize > CACHE_CONFIG.maxCacheSize) {
      // Sort by modification time (oldest first)
      fileStats.sort((a, b) => a.modificationTime - b.modificationTime);
      
      let removedSize = 0;
      const targetSize = CACHE_CONFIG.maxCacheSize * 0.8; // Remove until 80% of max size
      
      for (const fileStat of fileStats) {
        if (totalSize - removedSize <= targetSize) break;
        
        try {
          await fs.deleteAsync(fileStat.path);
          removedSize += fileStat.size;
          
          // Remove from memory cache
          const urlToRemove = Array.from(memoryCache.entries())
            .find(([, metadata]) => metadata.filename === fileStat.filename)?.[0];
          if (urlToRemove) {
            memoryCache.delete(urlToRemove);
          }
        } catch (error) {
          console.error('Error removing cached file:', error);
        }
      }
      
      // Save updated cache index
      await saveCacheIndex();
    }
  } catch (error) {
    console.error('Error checking cache size:', error);
  }
};

/**
 * Clean up expired cache entries
 */
const cleanupExpiredCache = async () => {
  try {
    if (Platform.OS === 'web') return;
    const fs = await getFileSystem();
    if (!fs) return;
    
    const now = Date.now();
    const expiredUrls = [];
    
    // Find expired entries
    for (const [url, metadata] of memoryCache.entries()) {
      if (now - metadata.cachedAt > CACHE_CONFIG.maxCacheAge) {
        expiredUrls.push(url);
      }
    }
    
    // Remove expired files and metadata
    for (const url of expiredUrls) {
      const metadata = memoryCache.get(url);
      if (metadata) {
        const filePath = `${CACHE_DIR}${metadata.filename}`;
        try {
          await fs.deleteAsync(filePath);
        } catch (error) {
          // File might already be deleted, ignore error
        }
        memoryCache.delete(url);
      }
    }
    
    if (expiredUrls.length > 0) {
      await saveCacheIndex();
    }
  } catch (error) {
    console.error('Error cleaning up expired cache:', error);
  }
};

/**
 * Schedule periodic cache cleanup
 */
const scheduleCleanup = () => {
  setInterval(() => {
    cleanupExpiredCache();
    checkCacheSizeAndCleanup();
  }, CACHE_CONFIG.cleanupInterval);
};

/**
 * Clear all cached images
 */
export const clearImageCache = async () => {
  // Skip cache operations on web platform
  if (Platform.OS === 'web') {
    return { success: true, message: 'Cache operations not available on web' };
  }
  
  try {
    const fs = await getFileSystem();
    if (!fs) return;
    
    // Clear memory cache
    memoryCache.clear();
    
    // Remove cache directory
    const dirInfo = await fs.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await fs.deleteAsync(CACHE_DIR);
    }
    
    // Remove cache index
    const indexInfo = await fs.getInfoAsync(CACHE_INDEX_FILE);
    if (indexInfo.exists) {
      await fs.deleteAsync(CACHE_INDEX_FILE);
    }
    
    // Recreate cache directory
    await fs.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  // Return empty stats on web platform
  if (Platform.OS === 'web') {
    return {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: null,
      newestFile: null,
    };
  }
  
  try {
    const fs = await getFileSystem();
    if (!fs) {
      return {
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        maxSizeMB: (CACHE_CONFIG.maxCacheSize / (1024 * 1024)).toFixed(2),
        cacheEntries: 0,
      };
    }
    
    const files = await fs.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = `${CACHE_DIR}${file}`;
      const fileInfo = await fs.getInfoAsync(filePath);
      if (fileInfo.exists) {
        totalSize += fileInfo.size;
      }
    }
    
    return {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: (CACHE_CONFIG.maxCacheSize / (1024 * 1024)).toFixed(2),
      cacheEntries: memoryCache.size,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      maxSizeMB: (CACHE_CONFIG.maxCacheSize / (1024 * 1024)).toFixed(2),
      cacheEntries: 0,
    };
  }
};

// Initialize cache when module loads
initializeCache();

// Export cache configuration for external use
export const cacheConfig = CACHE_CONFIG;