import { Platform } from 'react-native';
import { showToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast, TOAST_TYPES } from '../Toast';

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
  ToastAndroid: {
    show: jest.fn(),
    SHORT: 0,
    LONG: 1,
  },
}));

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('Toast Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    test('showToast should use ToastAndroid on Android', () => {
      const { ToastAndroid } = require('react-native');
      
      showToast('Test message', TOAST_TYPES.INFO);
      
      expect(ToastAndroid.show).toHaveBeenCalledWith('Test message', ToastAndroid.SHORT);
    });

    test('showToast should use LONG duration for longer messages', () => {
      const { ToastAndroid } = require('react-native');
      
      showToast('Test message', TOAST_TYPES.INFO, 4000);
      
      expect(ToastAndroid.show).toHaveBeenCalledWith('Test message', ToastAndroid.LONG);
    });
  });

  describe('iOS Platform', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    test('showToast should use react-native-toast-message on iOS', () => {
      const Toast = require('react-native-toast-message');
      
      showToast('Test message', TOAST_TYPES.SUCCESS);
      
      expect(Toast.show).toHaveBeenCalledWith({
        type: TOAST_TYPES.SUCCESS,
        text1: 'Sucesso!',
        text2: 'Test message',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
    });
  });

  describe('Helper Functions', () => {
    test('showSuccessToast should call showToast with success type', () => {
      const { ToastAndroid } = require('react-native');
      Platform.OS = 'android';
      
      showSuccessToast('Success message');
      
      expect(ToastAndroid.show).toHaveBeenCalledWith('Success message', ToastAndroid.SHORT);
    });

    test('showErrorToast should call showToast with error type and long duration', () => {
      const { ToastAndroid } = require('react-native');
      Platform.OS = 'android';
      
      showErrorToast('Error message');
      
      expect(ToastAndroid.show).toHaveBeenCalledWith('Error message', ToastAndroid.LONG);
    });

    test('showInfoToast should call showToast with info type', () => {
      const { ToastAndroid } = require('react-native');
      Platform.OS = 'android';
      
      showInfoToast('Info message');
      
      expect(ToastAndroid.show).toHaveBeenCalledWith('Info message', ToastAndroid.SHORT);
    });

    test('showWarningToast should call showToast with warning type', () => {
      const { ToastAndroid } = require('react-native');
      Platform.OS = 'android';
      
      showWarningToast('Warning message');
      
      expect(ToastAndroid.show).toHaveBeenCalledWith('Warning message', ToastAndroid.SHORT);
    });
  });

  describe('Toast Types', () => {
    test('TOAST_TYPES should have correct values', () => {
      expect(TOAST_TYPES.SUCCESS).toBe('success');
      expect(TOAST_TYPES.ERROR).toBe('error');
      expect(TOAST_TYPES.INFO).toBe('info');
      expect(TOAST_TYPES.WARNING).toBe('warning');
    });
  });
});