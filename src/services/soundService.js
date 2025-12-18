/**
 * EduCultivo - Feedback Service
 * Vibrações sutis para feedback tátil
 */

import * as Haptics from 'expo-haptics';

let feedbackEnabled = true;

export const setFeedbackEnabled = (enabled) => {
  feedbackEnabled = enabled;
};

export const isFeedbackEnabled = () => feedbackEnabled;

// Vibrações sutis para diferentes ações
export const playLikeSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
};

export const playCommentSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.selectionAsync();
  } catch (e) {}
};

export const playMessageSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
};

export const playPlantCreatedSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}
};

export const playCareLoggedSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
};

export const playQRScannedSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}
};

export const playBadgeEarnedSound = async () => {
  if (!feedbackEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}
};

// Funções vazias para compatibilidade
export const initializeAudio = async () => {};
export const setSoundEnabled = setFeedbackEnabled;
export const isSoundEnabled = isFeedbackEnabled;
export const preloadSounds = async () => {};
export const cleanupSounds = async () => {};

export default {
  initializeAudio,
  setSoundEnabled: setFeedbackEnabled,
  isSoundEnabled: isFeedbackEnabled,
  playLikeSound,
  playCommentSound,
  playMessageSound,
  playPlantCreatedSound,
  playCareLoggedSound,
  playQRScannedSound,
  playBadgeEarnedSound,
  preloadSounds,
  cleanupSounds,
};
