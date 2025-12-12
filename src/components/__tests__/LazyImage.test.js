import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LazyImage from '../LazyImage';

// Mock the image cache service
jest.mock('../../services/imageCache', () => ({
  getCachedImage: jest.fn(),
}));

// Mock expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('LazyImage', () => {
  const mockGetCachedImage = require('../../services/imageCache').getCachedImage;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render placeholder initially', () => {
    mockGetCachedImage.mockResolvedValue('cached-image-uri');
    
    const { getByTestId } = render(
      <LazyImage 
        source={{ uri: 'test-image.jpg' }}
        style={{ width: 100, height: 100 }}
        testID="lazy-image"
      />
    );

    // Should render the container
    expect(getByTestId('lazy-image')).toBeTruthy();
  });

  it('should handle string source', () => {
    mockGetCachedImage.mockResolvedValue('cached-image-uri');
    
    const { getByTestId } = render(
      <LazyImage 
        source="test-image.jpg"
        style={{ width: 100, height: 100 }}
        testID="lazy-image"
      />
    );

    expect(getByTestId('lazy-image')).toBeTruthy();
  });

  it('should handle null source gracefully', () => {
    const { getByTestId } = render(
      <LazyImage 
        source={null}
        style={{ width: 100, height: 100 }}
        testID="lazy-image"
      />
    );

    expect(getByTestId('lazy-image')).toBeTruthy();
  });

  it('should call getCachedImage with correct URI', async () => {
    const testUri = 'test-image.jpg';
    mockGetCachedImage.mockResolvedValue('cached-image-uri');
    
    render(
      <LazyImage 
        source={{ uri: testUri }}
        style={{ width: 100, height: 100 }}
      />
    );

    await waitFor(() => {
      expect(mockGetCachedImage).toHaveBeenCalledWith(testUri);
    });
  });

  it('should handle cache error gracefully', async () => {
    mockGetCachedImage.mockRejectedValue(new Error('Cache error'));
    
    const { getByTestId } = render(
      <LazyImage 
        source={{ uri: 'test-image.jpg' }}
        style={{ width: 100, height: 100 }}
        testID="lazy-image"
      />
    );

    // Should still render without crashing
    expect(getByTestId('lazy-image')).toBeTruthy();
  });

  it('should handle local file URIs', () => {
    // Clear previous mock calls
    mockGetCachedImage.mockClear();
    
    const localUri = 'file:///path/to/local/image.jpg';
    
    render(
      <LazyImage 
        source={{ uri: localUri }}
        style={{ width: 100, height: 100 }}
      />
    );

    // Should not call getCachedImage for local files
    expect(mockGetCachedImage).not.toHaveBeenCalled();
  });

  it('should apply custom styles', () => {
    const customStyle = { width: 200, height: 150, borderRadius: 10 };
    
    const { getByTestId } = render(
      <LazyImage 
        source={{ uri: 'test-image.jpg' }}
        style={customStyle}
        testID="lazy-image"
      />
    );

    const component = getByTestId('lazy-image');
    // Style should be an array with container styles and custom styles
    expect(component.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining(customStyle)
    ]));
  });
});