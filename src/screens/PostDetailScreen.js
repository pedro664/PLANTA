import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaStyles, getResponsiveSpacing } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import LazyImage from '../components/LazyImage';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, layout } from '../theme/spacing';
import { componentShadows } from '../theme/shadows';
import { showInfoToast, showErrorToast } from '../components/Toast';
import { fadeIn, ANIMATION_DURATION } from '../utils/animations';
import { postService } from '../services/postService';

const PostDetailScreen = ({ route, navigation }) => {
  const { postId, post } = route.params;
  const { user, toggleLike, addComment, posts } = useAppContext();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const safeAreaStyles = useSafeAreaStyles();
  const responsiveSpacing = getResponsiveSpacing();
  
  // Get the latest post data from context
  const currentPost = posts.find(p => p.id === postId) || post;
  
  // Load comments when component mounts
  useEffect(() => {
    loadComments();
  }, [postId]);
  
  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const loadedComments = await postService.getPostComments(postId);
      setComments(loadedComments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  // Animation values using React Native Animated
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const commentInputScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    fadeIn(screenOpacity, ANIMATION_DURATION.NORMAL).start();
  }, []);

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
  const isLiked = currentPost.user_has_liked || false;

  // Handle like button press
  const handleLike = async () => {
    try {
      await toggleLike(currentPost.id);
      
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

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      showErrorToast('Digite um comentário');
      return;
    }

    setIsSubmitting(true);
    Animated.spring(commentInputScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    try {
      // Add comment to the post - addComment expects (postId, text)
      const newCommentData = await addComment(currentPost.id, newComment.trim());
      
      // Add the new comment to local state
      if (newCommentData) {
        setComments(prev => [...prev, newCommentData]);
      } else {
        // Reload comments if we didn't get the new comment back
        await loadComments();
      }
      
      showInfoToast('Comentário adicionado!');
      setNewComment('');
      
      // Reset input animation
      Animated.spring(commentInputScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      showErrorToast('Erro ao enviar comentário. Tente novamente.');
      Animated.spring(commentInputScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Comment component
  const CommentItem = ({ comment }) => (
    <View style={styles.commentItem}>
      <LazyImage 
        source={{ uri: comment.users?.avatar_url || null }} 
        style={styles.commentAvatar}
        placeholder="user"
        showLoadingIndicator={false}
        resizeMode="cover"
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{comment.users?.name || 'Usuário'}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.botanical.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { 
              paddingHorizontal: spacing.xs, // Padding menor para dar mais espaço aos cards
              paddingBottom: safeAreaStyles.contentPaddingBottom 
            }]}
          >
            {/* Post content */}
            <View style={styles.postContainer}>
              {/* Post header */}
              <View style={styles.postHeader}>
                <LazyImage 
                  source={{ uri: currentPost.users?.avatar_url || null }} 
                  style={styles.postAvatar}
                  placeholder="user"
                  showLoadingIndicator={false}
                  resizeMode="cover"
                />
                <View style={styles.postUserInfo}>
                  <Text style={styles.postUserName}>{currentPost.users?.name || 'Usuário'}</Text>
                  <Text style={styles.postTime}>{formatTimeAgo(currentPost.created_at)}</Text>
                </View>
              </View>

              {/* Post image */}
              {currentPost.image_url && (
                <LazyImage 
                  source={{ uri: currentPost.image_url }} 
                  style={styles.postImage}
                  placeholder="plant"
                  showLoadingIndicator={true}
                  resizeMode="cover"
                />
              )}

              {/* Post description */}
              <Text style={styles.postDescription}>{currentPost.description}</Text>

              {/* Post actions */}
              <View style={styles.postActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleLike}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isLiked ? colors.system.error : colors.botanical.sage} 
                  />
                  <Text style={[
                    styles.actionText,
                    isLiked && styles.actionTextLiked
                  ]}>
                    {currentPost.likes_count || 0}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionButton}>
                  <Ionicons 
                    name="chatbubble-outline" 
                    size={24} 
                    color={colors.botanical.sage} 
                  />
                  <Text style={styles.actionText}>
                    {currentPost.comments_count || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Comments section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>
                Comentários ({comments.length || currentPost.comments_count || 0})
              </Text>
              
              {isLoadingComments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.botanical.clay} />
                  <Text style={styles.loadingText}>Carregando comentários...</Text>
                </View>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color={colors.botanical.sage} />
                  <Text style={styles.noCommentsText}>Nenhum comentário ainda</Text>
                  <Text style={styles.noCommentsSubtext}>Seja o primeiro a comentar!</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Comment input */}
          <Animated.View style={[styles.commentInputContainer, { transform: [{ scale: commentInputScale }] }]}>
            <TextInput
              style={styles.commentInput}
              placeholder="Adicione um comentário..."
              placeholderTextColor={colors.botanical.sage}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isSubmitting ? "hourglass-outline" : "send"} 
                size={20} 
                color={(!newComment.trim() || isSubmitting) ? colors.botanical.sage : colors.botanical.dark} 
              />
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
  },
  headerSpacer: {
    width: 40,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  
  // Post styles
  postContainer: {
    backgroundColor: colors.ui.background,
    marginHorizontal: spacing.sm, // Reduz a margem para dar mais espaço lateral
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    ...componentShadows.plantCard,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  postAvatar: {
    width: layout.avatar.md,
    height: layout.avatar.md,
    borderRadius: layout.avatar.md / 2,
    backgroundColor: colors.botanical.sand,
    marginRight: spacing.sm,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    ...textStyles.body,
    color: colors.botanical.dark,
    fontWeight: '700',
    marginBottom: 2,
  },
  postTime: {
    ...textStyles.caption,
    color: colors.botanical.sage,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.botanical.sand,
  },
  postDescription: {
    ...textStyles.body,
    color: colors.botanical.dark,
    padding: spacing.md,
    paddingTop: spacing.sm,
    lineHeight: textStyles.body.fontSize * 1.5,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...textStyles.body,
    color: colors.botanical.sage,
    fontWeight: '600',
  },
  actionTextLiked: {
    color: colors.system.error,
  },
  
  // Comments styles
  commentsSection: {
    marginHorizontal: spacing.sm, // Reduz a margem para consistência com o post container
    marginTop: spacing.lg,
  },
  commentsTitle: {
    ...textStyles.h4,
    color: colors.botanical.dark,
    marginBottom: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.ui.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  commentAvatar: {
    width: layout.avatar.sm,
    height: layout.avatar.sm,
    borderRadius: layout.avatar.sm / 2,
    backgroundColor: colors.botanical.sand,
    marginRight: spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  commentUserName: {
    ...textStyles.caption,
    color: colors.botanical.dark,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  commentTime: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    fontSize: 11,
  },
  commentText: {
    ...textStyles.body,
    color: colors.botanical.dark,
    lineHeight: textStyles.body.fontSize * 1.4,
  },
  
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.botanical.sage,
  },
  
  // No comments styles
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.ui.background,
    borderRadius: borderRadius.md,
  },
  noCommentsText: {
    ...textStyles.body,
    color: colors.botanical.sage,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  noCommentsSubtext: {
    ...textStyles.caption,
    color: colors.botanical.sage,
    marginTop: spacing.xs / 2,
  },
  
  // Comment input styles
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.ui.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 74, 61, 0.1)',
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(46, 74, 61, 0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    ...textStyles.body,
    color: colors.botanical.dark,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.botanical.clay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.botanical.sage,
    opacity: 0.5,
  },
});

export default PostDetailScreen;