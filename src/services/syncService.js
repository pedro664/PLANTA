// syncService.js - Data synchronization service for offline/online functionality

import AsyncStorage from '@react-native-async-storage/async-storage';
import { showSuccessToast, showErrorToast, showInfoToast } from '../components/Toast';
import { PlantaDatabase } from './database';
import { isOnline } from '../utils/networkListener';

// Storage keys for sync queue
const SYNC_STORAGE_KEYS = {
  PENDING_ACTIONS: '@planta:sync:pendingActions',
  LAST_SYNC: '@planta:sync:lastSync',
  SYNC_STATUS: '@planta:sync:status',
};

// Action types for sync queue
const SYNC_ACTION_TYPES = {
  ADD_PLANT: 'ADD_PLANT',
  UPDATE_PLANT: 'UPDATE_PLANT',
  DELETE_PLANT: 'DELETE_PLANT',
  ADD_CARE_LOG: 'ADD_CARE_LOG',
  ADD_POST: 'ADD_POST',
  UPDATE_USER: 'UPDATE_USER',
  TOGGLE_LIKE: 'TOGGLE_LIKE',
};

// Sync status types
const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Synchronization Service
 * Manages offline actions queue and synchronization with remote database
 */
class SyncService {
  constructor() {
    this.pendingActions = [];
    this.isSyncing = false;
    this.syncListeners = [];
  }

  /**
   * Initialize the sync service
   * Load pending actions from storage
   */
  async initialize() {
    try {
      await this.loadPendingActions();
      console.log('SyncService initialized with', this.pendingActions.length, 'pending actions');
    } catch (error) {
      console.error('Error initializing SyncService:', error);
    }
  }

  /**
   * Add an action to the sync queue
   * @param {string} type - Action type from SYNC_ACTION_TYPES
   * @param {Object} payload - Action payload data
   * @param {Object} metadata - Additional metadata (userId, timestamp, etc.)
   */
  async queueAction(type, payload, metadata = {}) {
    try {
      const action = {
        id: this.generateActionId(),
        type,
        payload,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        },
        status: 'pending',
      };

      this.pendingActions.push(action);
      await this.savePendingActions();

      console.log(`Queued action: ${type}`, action.id);

      // Try to sync immediately if online
      if (await isOnline()) {
        this.syncPendingActions();
      }

      return action.id;
    } catch (error) {
      console.error('Error queuing action:', error);
      throw error;
    }
  }

  /**
   * Sync all pending actions with the remote database
   * @param {boolean} showNotifications - Whether to show toast notifications
   */
  async syncPendingActions(showNotifications = true) {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (this.pendingActions.length === 0) {
      console.log('No pending actions to sync');
      return;
    }

    if (!(await isOnline())) {
      console.log('Device is offline, cannot sync');
      if (showNotifications) {
        showInfoToast('Dispositivo offline. Sincronização será feita quando reconectar.');
      }
      return;
    }

    this.isSyncing = true;
    this.notifyListeners(SYNC_STATUS.SYNCING);

    if (showNotifications) {
      showInfoToast(`Sincronizando ${this.pendingActions.length} ações...`);
    }

    let successCount = 0;
    let errorCount = 0;
    const failedActions = [];

    try {
      // Process actions in order
      for (const action of [...this.pendingActions]) {
        try {
          await this.processAction(action);
          
          // Remove successful action from queue
          this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
          successCount++;
          
          console.log(`Successfully synced action: ${action.type}`, action.id);
        } catch (error) {
          console.error(`Failed to sync action: ${action.type}`, action.id, error);
          
          // Increment retry count
          action.metadata.retryCount = (action.metadata.retryCount || 0) + 1;
          action.metadata.lastError = error.message;
          action.metadata.lastRetry = new Date().toISOString();
          
          // Remove action if max retries reached
          if (action.metadata.retryCount >= 3) {
            this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
            failedActions.push(action);
          }
          
          errorCount++;
        }
      }

      // Save updated pending actions
      await this.savePendingActions();
      await this.updateLastSyncTime();

      // Show results
      if (showNotifications) {
        if (successCount > 0 && errorCount === 0) {
          showSuccessToast(`Sincronização concluída! ${successCount} ações sincronizadas.`);
        } else if (successCount > 0 && errorCount > 0) {
          showInfoToast(`Sincronização parcial: ${successCount} sucessos, ${errorCount} falhas.`);
        } else if (errorCount > 0) {
          showErrorToast(`Erro na sincronização: ${errorCount} ações falharam.`);
        }
      }

      this.notifyListeners(SYNC_STATUS.SUCCESS, {
        successCount,
        errorCount,
        failedActions,
      });

    } catch (error) {
      console.error('Error during sync process:', error);
      
      if (showNotifications) {
        showErrorToast('Erro durante a sincronização. Tente novamente.');
      }
      
      this.notifyListeners(SYNC_STATUS.ERROR, { error: error.message });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single sync action
   * @param {Object} action - The action to process
   */
  async processAction(action) {
    const { type, payload, metadata } = action;

    switch (type) {
      case SYNC_ACTION_TYPES.ADD_PLANT:
        return await this.syncAddPlant(payload, metadata);
      
      case SYNC_ACTION_TYPES.UPDATE_PLANT:
        return await this.syncUpdatePlant(payload, metadata);
      
      case SYNC_ACTION_TYPES.DELETE_PLANT:
        return await this.syncDeletePlant(payload, metadata);
      
      case SYNC_ACTION_TYPES.ADD_CARE_LOG:
        return await this.syncAddCareLog(payload, metadata);
      
      case SYNC_ACTION_TYPES.ADD_POST:
        return await this.syncAddPost(payload, metadata);
      
      case SYNC_ACTION_TYPES.UPDATE_USER:
        return await this.syncUpdateUser(payload, metadata);
      
      case SYNC_ACTION_TYPES.TOGGLE_LIKE:
        return await this.syncToggleLike(payload, metadata);
      
      default:
        throw new Error(`Unknown sync action type: ${type}`);
    }
  }

  /**
   * Sync add plant action
   */
  async syncAddPlant(payload, metadata) {
    const { plant, imageFile } = payload;
    
    if (imageFile) {
      return await PlantaDatabase.createPlantWithImage(plant, imageFile);
    } else {
      return await PlantaDatabase.createPlantWithImage(plant, null);
    }
  }

  /**
   * Sync update plant action
   */
  async syncUpdatePlant(payload, metadata) {
    const { plantId, updates, imageFile } = payload;
    return await PlantaDatabase.updatePlantWithImage(plantId, updates, imageFile);
  }

  /**
   * Sync delete plant action
   */
  async syncDeletePlant(payload, metadata) {
    const { plantId } = payload;
    // Note: This would need to be implemented in PlantaDatabase
    throw new Error('Delete plant sync not implemented yet');
  }

  /**
   * Sync add care log action
   */
  async syncAddCareLog(payload, metadata) {
    const { plantId, careLog } = payload;
    return await PlantaDatabase.addCareLogWithStatusUpdate(plantId, careLog);
  }

  /**
   * Sync add post action
   */
  async syncAddPost(payload, metadata) {
    const { post, imageFile } = payload;
    return await PlantaDatabase.createPostWithImage(post, imageFile);
  }

  /**
   * Sync update user action
   */
  async syncUpdateUser(payload, metadata) {
    const { updates, avatarFile } = payload;
    return await PlantaDatabase.updateUserProfileWithAvatar(updates, avatarFile);
  }

  /**
   * Sync toggle like action
   */
  async syncToggleLike(payload, metadata) {
    const { postId } = payload;
    return await PlantaDatabase.togglePostLike(postId);
  }

  /**
   * Get pending actions count
   */
  getPendingActionsCount() {
    return this.pendingActions.length;
  }

  /**
   * Get pending actions by type
   */
  getPendingActionsByType(type) {
    return this.pendingActions.filter(action => action.type === type);
  }

  /**
   * Clear all pending actions (use with caution)
   */
  async clearPendingActions() {
    this.pendingActions = [];
    await this.savePendingActions();
    console.log('All pending actions cleared');
  }

  /**
   * Get sync status information
   */
  async getSyncStatus() {
    try {
      const lastSync = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC);
      const pendingCount = this.pendingActions.length;
      
      return {
        lastSync: lastSync ? new Date(lastSync) : null,
        pendingActionsCount: pendingCount,
        isSyncing: this.isSyncing,
        hasPendingActions: pendingCount > 0,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: null,
        pendingActionsCount: 0,
        isSyncing: false,
        hasPendingActions: false,
      };
    }
  }

  /**
   * Add listener for sync status changes
   */
  addSyncListener(listener) {
    this.syncListeners.push(listener);
    
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all sync listeners
   */
  notifyListeners(status, data = {}) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Load pending actions from AsyncStorage
   */
  async loadPendingActions() {
    try {
      const stored = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.PENDING_ACTIONS);
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
      this.pendingActions = [];
    }
  }

  /**
   * Save pending actions to AsyncStorage
   */
  async savePendingActions() {
    try {
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.PENDING_ACTIONS,
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSyncTime() {
    try {
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }

  /**
   * Generate unique action ID
   */
  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Force sync now (for manual sync triggers)
   */
  async forceSyncNow() {
    console.log('Force sync requested');
    await this.syncPendingActions(true);
  }

  /**
   * Check if device can sync (online and has pending actions)
   */
  async canSync() {
    const online = await isOnline();
    const hasPending = this.pendingActions.length > 0;
    return online && hasPending && !this.isSyncing;
  }
}

// Create singleton instance
const syncService = new SyncService();

// Export the singleton instance and types
export default syncService;
export { SyncService, SYNC_ACTION_TYPES, SYNC_STATUS };