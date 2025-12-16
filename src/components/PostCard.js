import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Animated,
  Alert,
} from 'react-native';
import Text from './Text';
import LazyImage from './LazyImage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, layout } from '../theme/spacing';
import { componentShadows } from '../theme/shadows';
import { showInfoToast, showErrorToast } from './Toast';
import { useNavigation } from '@react-navigation/native';

const PostCard = ({ post, onPress, onDelete, style }) => {
  const { toggleLike, user } = useAppContext();
  const navigation = useNavigation();
  
  // Animation values using React Native Animated
  const likeScale = useRef(new Animated.Value(1)).current;
  const likeOpacity = useRef(new Animated.Value(1)).current;
  
  // Check if current user is the owner of this post
  const isOwner = user?.id === post.user_id;

  // Format time since publication
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

  // Check if current user liked this post
  const isLiked = post.user_has_liked || false;

  // Handle like button press
  const handleLike = async () => {
    try {
      // Trigger animation immediately for better UX
      Animated.sequence([
        Animated.timing(likeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(likeScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      
      Animated.sequence([
        Animated.timing(likeOpacity, { toValue: 0.8, duration: 150, useNativeDriver: true }),
        Animated.timing(likeOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      await toggleLike(post.id);
      
      // Show toast feedback
      if (isLiked) {
        showInfoToast('Curtida removida');
      } else {
        showInfoToast('Post curtido! ❤️');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showErrorToast('Erro ao curtir post. Tente novamente.');
    }
  };

  // Handle post press
  const handlePress = () => {
    if (onPress) {
      onPress(post);
    }
  };

  // Handle comments button press
  const handleComments = () => {
    // Navigate to post detail screen with comments
    navigation.navigate('PostDetail', { 
      postId: post.id,
      post: post 
    });
  };

  // Handle delete button press
  const handleDelete = () => {
    Alert.alert(
      'Excluir Post',
      'Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(post);
            }
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with user info */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (post.user_id && post.user_id !== user?.id) {
              navigation.navigate('UserProfile', { userId: post.user_id });
            }
          }}
          activeOpacity={0.7}
          style={styles.userTouchable}
        >
          <LazyImage 
            source={{ uri: post.users?.avatar_url || null }} 
            style={styles.avatar}
            placeholder="user"
            showLoadingIndicator={false}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {post.users?.name || 'Usuário'}
            </Text>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Delete button - only visible for post owner */}
        {isOwner && onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={colors.system.error} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Post image */}
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.95}
      >
        {post.image_url && (
          <LazyImage 
            source={{ uri: post.image_url }} 
            style={styles.postImage}
            placeholder="plant"
            showLoadingIndicator={true}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Post description */}
      <View style={styles.content}>
        <TouchableOpacity 
          onPress={handlePress}
          activeOpacity={0.95}
        >
          <Text style={styles.description} numberOfLines={3}>
            {post.description}
          </Text>
        </TouchableOpacity>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {post.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{post.tags.length - 3}</Text>
            )}
          </View>
        )}

        {/* Actions row */}
        <View style={styles.actionsRow}>
          {/* Like button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Animated.View style={{
              transform: [{ scale: likeScale }],
              opacity: likeOpacity,
            }}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? colors.system.error : colors.botanical.sage} 
              />
            </Animated.View>
            <Text style={[
              styles.actionText,
              isLiked && styles.actionTextLiked
            ]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          {/* Comments button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleComments}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={20} 
              color={colors.botanical.sage} 
            />
            <Text style={styles.actionText}>
              {post.comments_count || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    ...componentShadows.plantCard,
    overflow: 'hidden',
    marginHorizontal: spacing.xs, // Adiciona margem lateral para evitar cortes nas safe areas
  },
  
  // Header styles
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  avatar: {
    width: layout.avatar.sm,
    height: layout.avatar.sm,
    borderRadius: layout.avatar.sm / 2,
    backgroundColor: colors.botanical.sand,
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...textStyles.body,
    color: colors.botanical.dark,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeAgo: {
    ...textStyles.caption,
    color: colors.botanical.sage,
  },
  
  // Post image styles
  postImage: {
    width: '100%',
    height: 240,
    backgroundColor: colors.botanical.sand,
  },
  
  // Content styles
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  description: {
    ...textStyles.body,
    color: colors.botanical.dark,
    lineHeight: textStyles.body.fontSize * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  
  // Tags styles
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.botanical.sand,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    fontSize: 11,
    fontWeight: '600',
  },
  moreTagsText: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Actions row styles
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    fontWeight: '600',
  },
  actionTextLiked: {
    color: colors.system.error,
  },
});

export default PostCard;