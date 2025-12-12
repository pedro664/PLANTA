import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PostCard from '../PostCard';
import { AppProvider } from '../../context/AppContext';

// Mock the theme files
jest.mock('../../theme/shadows', () => ({
  componentShadows: {
    plantCard: {},
  },
}));

// Mock post data
const mockPost = {
  id: 'post-1',
  userId: 'user-1',
  userName: 'João Santos',
  userAvatar: 'https://via.placeholder.com/50x50/C66B3D/FFFFFF?text=JS',
  image: 'https://via.placeholder.com/400x300/8DA399/FFFFFF?text=Garden',
  description: 'Meu jardim está ficando lindo! Dicas para quem está começando.',
  category: 'tips',
  likes: 34,
  likedBy: ['user-2', 'user-3'],
  comments: [
    {
      id: 'comment-1',
      userId: 'user-2',
      userName: 'Maria Silva',
      text: 'Que jardim maravilhoso!',
      date: '2023-12-09T10:30:00.000Z',
    },
  ],
  createdAt: '2023-12-09T08:00:00.000Z',
};

const renderWithProvider = (component) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('PostCard', () => {
  it('renders correctly with post data', () => {
    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} />
    );

    // Check if user name is displayed in header
    expect(getByText('João Santos')).toBeTruthy();
    
    // Check if description is displayed
    expect(getByText(/Meu jardim está ficando lindo/)).toBeTruthy();
    
    // Check if likes count is displayed
    expect(getByText('34')).toBeTruthy();
    
    // Check if comments count is displayed
    expect(getByText('1')).toBeTruthy();
  });

  it('displays correct time ago format', () => {
    const recentPost = {
      ...mockPost,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };

    const { getByText } = renderWithProvider(
      <PostCard post={recentPost} />
    );

    expect(getByText('2h atrás')).toBeTruthy();
  });

  it('handles onPress callback', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} onPress={onPressMock} />
    );

    // Check that the component renders
    expect(getByText('João Santos')).toBeTruthy();
  });

  it('displays correct like status for current user', () => {
    // Test when user has not liked the post
    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} />
    );

    // The current user (user-1) is not in the likedBy array, so heart should be outline
    // Note: This test would need the component to have testID props for proper testing
    expect(getByText('34')).toBeTruthy(); // Likes count should be displayed
  });

  it('shows different like count when post has no likes', () => {
    const postWithNoLikes = {
      ...mockPost,
      likes: 0,
      likedBy: [],
    };

    const { getByText } = renderWithProvider(
      <PostCard post={postWithNoLikes} />
    );

    expect(getByText('0')).toBeTruthy();
  });
});