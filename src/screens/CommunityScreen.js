import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  FlatList,
  RefreshControl
} from 'react-native';
import Text from '../components/Text';
import PostCard from '../components/PostCard';
import { getOptimizedFlatListProps, createGetItemLayout } from '../utils/performanceUtils';
import { preloadImages } from '../services/imageCache';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { getRefreshControlColors } from '../utils/gestureUtils';

const CommunityScreen = ({ navigation }) => {
  const { posts, getFilteredPosts, loadPosts } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [displayedPostsCount, setDisplayedPostsCount] = useState(6);
  const [refreshing, setRefreshing] = useState(false);
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();

  // Load posts when component mounts
  useEffect(() => {
    loadPosts(filter);
  }, [filter]);

  // Preload images for better performance
  useEffect(() => {
    const preloadPostImages = async () => {
      const imageUrls = posts.slice(0, 10).map(post => post.image);
      await preloadImages(imageUrls);
    };
    
    preloadPostImages();
  }, [posts]);

  // Memoized render item for better performance
  const renderPostItem = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      onPress={(post) => {
        navigation.navigate('PostDetail', { 
          postId: post.id,
          post: post 
        });
      }}
    />
  ), [navigation]);

  // Memoized key extractor
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPosts(filter);
      setDisplayedPostsCount(6);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadPosts, filter]);



  // Filter posts based on current filter
  const filteredPosts = getFilteredPosts(filter);
  
  const postsToShow = filteredPosts.slice(0, displayedPostsCount);

  // Filter button component - exactly like the original
  const FilterButton = ({ filterType, label, isActive }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        isActive && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.contentArea, { paddingHorizontal: spacing.md, paddingBottom: safeAreaStyles.contentPaddingBottom }]}>
        {/* Header with create post button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comunidade</Text>
          <TouchableOpacity 
            style={styles.createPostButton}
            onPress={() => navigation.navigate('CreatePost')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={colors.ui.background} />
            <Text style={styles.createPostButtonText}>Novo Post</Text>
          </TouchableOpacity>
        </View>

        {/* Filter buttons - exactly like the original */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContainer}
        >
          <FilterButton filterType="all" label="Tudo" isActive={filter === 'all'} />
          <FilterButton filterType="tips" label="Dicas" isActive={filter === 'tips'} />
          <FilterButton filterType="identification" label="Identificação" isActive={filter === 'identification'} />
        </ScrollView>

        {/* Community feed - Optimized FlatList with Pull to Refresh */}
        <FlatList
          data={postsToShow}
          renderItem={renderPostItem}
          keyExtractor={keyExtractor}
          style={styles.feedScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          // Pull to refresh functionality
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              {...getRefreshControlColors(colors)}
            />
          }
          onEndReached={() => {
            if (displayedPostsCount < filteredPosts.length) {
              setDisplayedPostsCount(prev => Math.min(prev + 6, filteredPosts.length));
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (displayedPostsCount < filteredPosts.length) {
              return (
                <View style={styles.loadMoreContainer}>
                  <Ionicons name="refresh" size={20} color={colors.botanical.sage} />
                  <Text style={styles.loadMoreText}>Carregando mais posts...</Text>
                </View>
              );
            }
            return null;
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: spacing.lg, // 24px like the original
    paddingBottom: 10, // Small padding to ensure content doesn't overlap tab bar
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.botanical.dark,
    fontWeight: '700',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.dark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  createPostButtonText: {
    ...textStyles.caption,
    color: colors.ui.background,
    fontWeight: '700',
  },

  // Filter styles - exactly like the original
  filtersScrollView: {
    flexGrow: 0,
    marginBottom: spacing.lg,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12, // gap-3 = 12px
    paddingBottom: 8, // pb-2 = 8px
  },
  filterButton: {
    paddingHorizontal: 20, // px-5 = 20px
    paddingVertical: 8, // py-2 = 8px
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.1)', // border-botanical-dark/10
    backgroundColor: colors.ui.background,
  },
  filterButtonActive: {
    backgroundColor: colors.botanical.dark,
    borderColor: colors.botanical.dark,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 12, // text-xs
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    fontWeight: '700',
    color: colors.ui.background,
  },

  // Feed styles
  feedScrollView: {
    flex: 1,
  },
  feedContainer: {
    paddingBottom: 80, // Adjusted space for new tab bar height
    paddingHorizontal: spacing.xs, // Adiciona padding para compensar a margem dos cards
  },



  // Load more styles
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2 = 8px
    paddingVertical: 32, // py-8 = 32px
  },
  loadMoreText: {
    fontSize: 14, // text-sm
    fontWeight: '400',
    color: colors.botanical.sage,
  },
});

export default CommunityScreen;
