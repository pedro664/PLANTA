import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import PostCard from '../components/PostCard';
import { getOptimizedFlatListProps, createGetItemLayout } from '../utils/performanceUtils';
import { preloadImages } from '../services/imageCache';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { communityService } from '../services/communityService';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { getRefreshControlColors } from '../utils/gestureUtils';

const CommunityScreen = ({ navigation }) => {
  const { posts, getFilteredPosts, loadPosts, user } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [displayedPostsCount, setDisplayedPostsCount] = useState(6);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();

  // Carregar contadores de notificações
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [msgCount, reqCount] = await Promise.all([
          communityService.getUnreadNotificationsCount(),
          communityService.getPendingFriendRequests().then(r => r.length)
        ]);
        setUnreadMessages(msgCount);
        setPendingRequests(reqCount);
      } catch (error) {
        console.error('Erro ao carregar contadores:', error);
      }
    };
    loadCounts();
    
    // Recarregar ao focar
    const unsubscribe = navigation.addListener('focus', loadCounts);
    return unsubscribe;
  }, [navigation]);

  // Buscar usuários
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsSearching(true);
        const results = await communityService.searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Load posts when component mounts
  useEffect(() => {
    loadPosts(filter);
  }, [filter]);

  // Preload images for better performance
  useEffect(() => {
    const preloadPostImages = async () => {
      const imageUrls = posts.slice(0, 10).map(post => post.image_url);
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



  // Renderizar item de usuário na busca
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userSearchItem}
      onPress={() => {
        setShowSearch(false);
        setSearchQuery('');
        navigation.navigate('UserProfile', { userId: item.id });
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
        style={styles.userSearchAvatar}
      />
      <View style={styles.userSearchInfo}>
        <Text style={styles.userSearchName}>{item.name}</Text>
        <Text style={styles.userSearchLevel}>{item.level || 'Iniciante'}</Text>
      </View>
      {item.friendship_status === 'accepted' && (
        <View style={styles.friendBadgeSmall}>
          <Ionicons name="people" size={12} color={colors.botanical.base} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.contentArea, { paddingHorizontal: spacing.md, paddingBottom: safeAreaStyles.contentPaddingBottom }]}>
        {/* Header with actions */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comunidade</Text>
          <View style={styles.headerActions}>
            {/* Search Button */}
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => setShowSearch(!showSearch)}
              activeOpacity={0.8}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={22} color={colors.botanical.dark} />
            </TouchableOpacity>
            
            {/* Messages Button */}
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Conversations')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={colors.botanical.dark} />
              {unreadMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Friends Button */}
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Friends')}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={22} color={colors.botanical.dark} />
              {pendingRequests > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {pendingRequests > 9 ? '9+' : pendingRequests}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Groups Button */}
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Groups')}
              activeOpacity={0.8}
            >
              <Ionicons name="people-circle-outline" size={22} color={colors.botanical.dark} />
            </TouchableOpacity>
            
            {/* Create Post Button */}
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => navigation.navigate('CreatePost')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.ui.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color={colors.botanical.sage} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar usuários..."
                placeholderTextColor={colors.botanical.sage}
                autoFocus
              />
              {isSearching && <ActivityIndicator size="small" color={colors.botanical.clay} />}
            </View>
            
            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <View style={styles.searchResults}>
                {searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id}
                    style={styles.searchResultsList}
                    keyboardShouldPersistTaps="handled"
                  />
                ) : !isSearching && (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>Nenhum usuário encontrado</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Filter buttons */}
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
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.botanical.dark,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ui.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.botanical.clay,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: colors.botanical.base,
    fontSize: 10,
    fontWeight: '700',
  },
  createPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostButtonText: {
    ...textStyles.caption,
    color: colors.ui.background,
    fontWeight: '700',
  },

  // Search styles
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: colors.botanical.dark,
  },
  searchResults: {
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.1)',
  },
  searchResultsList: {
    maxHeight: 250,
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 74, 61, 0.05)',
  },
  userSearchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.sage + '30',
  },
  userSearchInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userSearchName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.botanical.dark,
  },
  userSearchLevel: {
    fontSize: 12,
    color: colors.botanical.sage,
  },
  friendBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.system.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: colors.botanical.sage,
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
