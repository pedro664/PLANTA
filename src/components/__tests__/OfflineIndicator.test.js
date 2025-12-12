// OfflineIndicator.test.js - Tests for offline status indicator

import React from 'react';
import { render } from '@testing-library/react-native';
import OfflineIndicator from '../OfflineIndicator';
import { useAppContext } from '../../context/AppContext';

// Mock the AppContext
jest.mock('../../context/AppContext');

// Mock the sync service
jest.mock('../../services/syncService', () => ({
  __esModule: true,
  default: {
    getPendingActionsCount: jest.fn(() => 0),
    addSyncListener: jest.fn(() => jest.fn()),
  },
  SYNC_STATUS: {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SUCCESS: 'success',
    ERROR: 'error',
  },
}));

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when online', () => {
    useAppContext.mockReturnValue({
      isOffline: false,
      hasPendingSync: jest.fn(() => false),
      forceSyncNow: jest.fn(),
    });

    const { queryByText } = render(<OfflineIndicator />);

    expect(queryByText('📡 Sem conexão com a internet')).toBeNull();
  });

  it('should render offline message when offline', () => {
    useAppContext.mockReturnValue({
      isOffline: true,
      hasPendingSync: jest.fn(() => false),
      forceSyncNow: jest.fn(),
    });

    const { getByText } = render(<OfflineIndicator />);

    expect(getByText('📡 Sem conexão com a internet')).toBeTruthy();
    expect(getByText('Suas alterações serão sincronizadas quando voltar online')).toBeTruthy();
  });

  it('should have correct styling when offline', () => {
    useAppContext.mockReturnValue({
      isOffline: true,
      hasPendingSync: jest.fn(() => false),
      forceSyncNow: jest.fn(),
    });

    const { getByText } = render(<OfflineIndicator />);
    const mainText = getByText('📡 Sem conexão com a internet');
    const container = mainText.parent.parent; // Get the View container

    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          position: 'absolute',
          backgroundColor: '#FF6B35',
          zIndex: 1000,
        })
      ])
    );
  });

  it('should toggle visibility based on isOffline state', () => {
    const mockContext = { 
      isOffline: false,
      hasPendingSync: jest.fn(() => false),
      forceSyncNow: jest.fn(),
    };
    useAppContext.mockReturnValue(mockContext);

    const { queryByText, rerender } = render(<OfflineIndicator />);

    // Should not be visible when online
    expect(queryByText('📡 Sem conexão com a internet')).toBeNull();

    // Update mock to offline
    mockContext.isOffline = true;
    useAppContext.mockReturnValue(mockContext);
    rerender(<OfflineIndicator />);

    // Should be visible when offline
    expect(queryByText('📡 Sem conexão com a internet')).toBeTruthy();
  });
});