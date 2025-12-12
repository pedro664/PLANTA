import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import LazyImage from '../components/LazyImage';
import { useAppContext } from '../context/AppContext';
import { postService } from '../services/postService';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, layout } from '../theme/spacing';
import { componentShadows } from '../theme/shadows';
import { showSuccessToast, showErrorToast } from '../components/Toast';
import { getRefreshControlColors } from '../utils/gestureUtils';

const { width } = Dimensions.get('window');
const GRID_SPACING = 2;
const GRID_ITEM_SIZE = (width - (GRID_SPACING * 4)) / 3; // 3 colunas com espaçamento

const MyPostsScreen = ({ navigation }) => {
  const { user, session } = useAppContext();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user posts
  const loadMyPosts = useCallback(async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id || user?.id;
      if (!userId) return;

      const posts = await postService.getUserPosts(userId);
      setMyPosts(posts);
    } catch (error) {
      console.error('Error loading my posts:', error);
      showErrorToast('Erro ao carregar seus posts');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    loadMyPosts();
  }, [loadMyPosts]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMyPosts();
    setRefreshing(false);
  }, [loadMyPosts]);

  // Format time
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    }
  };

  // Handle delete post
  const handleDeletePost = (post) => {
    Alert.alert(
      'Excluir Post',
      'Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deletePost(post.id)
        },
      ]
    );
  };
  // Delete post
  const deletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setMyPosts(prev => prev.filter(post => post.id !== postId));
      showSuccessToast('Post excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting post:', error);
      showErrorToast('Erro ao excluir post');
    }
  };

  // Handle edit post
  const handleEditPost = (post) => {
    navigation.navigate('EditPost', { post });
  };

  // Handle post tap
  const handlePostTap = (post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // Handle long press for actions
  const handlePostLongPress = (post) => {
    Alert.alert(
      'Opções do Post',
      'O que você gostaria de fazer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Editar', 
          onPress: () => handleEditPost(post)
        },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => handleDeletePost(post)
        },
      ]
    );
  };

  // Render grid post item - Instagram style
  const renderGridPostItem = ({ item: post, index }) => (
    <TouchableOpacity 
      style={[
        styles.gridItem,
        {
          marginLeft: index % 3 === 0 ? 0 : GRID_SPACING,
          marginRight: index % 3 === 2 ? 0 : GRID_SPACING,
        }
      ]}
      onPress={() => handlePostTap(post)}
      onLongPress={() => handlePostLongPress(post)}
      activeOpacity={0.9}
    >
      <LazyImage 
        source={{ uri: post.image_url }} 
        style={styles.gridImage}
        placeholder="plant"
        showLoadingIndicator={true}
        resizeMode="cover"
      />
      
      {/* Overlay with stats */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStats}>
          <View style={styles.gridStatItem}>
            <Ionicons name="heart" size={16} color="white" />
            <Text style={styles.gridStatText}>{post.likes_count || 0}</Text>
          </View>
          <View style={styles.gridStatItem}>
            <Ionicons name="chatbubble" size={16} color="white" />
            <Text style={styles.gridStatText}>{post.comments_count || 0}</Text>
          </View>
        </View>
      </View>

      {/* Category indicator */}
      <View style={styles.categoryIndicator}>
        <Ionicons 
          name={
            post.category === 'tips' ? 'bulb' : 
            post.category === 'identification' ? 'search' : 'leaf'
          } 
          size={12} 
          color="white" 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Posts</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreatePost')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.botanical.dark} />
        </TouchableOpacity>
      </View>

      {/* Posts count */}
      {myPosts.length > 0 && (
        <View style={styles.statsHeader}>
          <Text style={styles.postsCount}>
            <Text style={styles.postsCountNumber}>{myPosts.length}</Text> post{myPosts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Posts grid */}
      <FlatList
        data={myPosts}
        renderItem={renderGridPostItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        style={styles.list}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.gridRowSeparator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...getRefreshControlColors(colors)}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="camera-outline" size={64} color={colors.botanical.sage} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
            <Text style={styles.emptySubtitle}>
              Compartilhe fotos das suas plantas com a comunidade!
            </Text>
            <TouchableOpacity 
              style={styles.createFirstPostButton}
              onPress={() => navigation.navigate('CreatePost')}
              activeOpacity={0.8}
            >
              <Text style={styles.createFirstPostText}>Criar Primeiro Post</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.botanical.dark,
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  addButton: {
    padding: spacing.xs,
  },
  
  // Stats header
  statsHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.ui.background,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(46, 74, 61, 0.1)',
  },
  postsCount: {
    ...textStyles.body,
    color: colors.botanical.sage,
    fontSize: 14,
  },
  postsCountNumber: {
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  
  // Grid styles
  list: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  gridContent: {
    paddingTop: GRID_SPACING,
    paddingBottom: spacing.xl,
  },
  gridRowSeparator: {
    height: GRID_SPACING,
  },
  
  // Grid item styles - Instagram style
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: 'relative',
    backgroundColor: colors.botanical.sand,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridStatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Category indicator
  categoryIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(141, 163, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.botanical.dark,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...textStyles.body,
    color: colors.botanical.sage,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  createFirstPostButton: {
    backgroundColor: colors.botanical.dark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createFirstPostText: {
    ...textStyles.body,
    color: colors.ui.background,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default MyPostsScreen;