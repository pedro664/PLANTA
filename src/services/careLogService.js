/**
 * Care Log Service
 * Handles all care log-related database operations
 */

import { supabase, TABLES, handleSupabaseError } from './supabase';

export const careLogService = {
  // Get care logs for a plant
  getPlantCareLogs: async (plantId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARE_LOGS)
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .eq('plant_id', plantId)
        .order('care_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Plant Care Logs'));
    }
  },

  // Get care logs for a user
  getUserCareLogs: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARE_LOGS)
        .select(`
          *,
          plants (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('care_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get User Care Logs'));
    }
  },

  // Create care log
  createCareLog: async (userId, plantId, careData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARE_LOGS)
        .insert([
          {
            user_id: userId,
            plant_id: plantId,
            care_type: careData.care_type,
            notes: careData.notes || null,
            care_date: careData.care_date || new Date().toISOString(),
          },
        ])
        .select(`
          *,
          plants (
            id,
            name,
            image_url
          )
        `)
        .single();

      if (error) throw error;

      // If it's a watering log, update the plant's last_watered date
      if (careData.care_type === 'water') {
        await supabase
          .from(TABLES.PLANTS)
          .update({
            last_watered: careData.care_date || new Date().toISOString(),
            status: 'fine', // Reset status when watered
            updated_at: new Date().toISOString(),
          })
          .eq('id', plantId);
      }

      return data;
    } catch (error) {
      try {
        const { logAndNotifyError } = await import('../utils/errorUtils');
        logAndNotifyError(error, {
          context: 'careLogService.createCareLog',
          userMessage: 'Erro ao registrar cuidado da planta',
          suggestion: 'Tente novamente',
        });
      } catch (e) {
        console.error('Erro ao notificar createCareLog error:', e);
      }
      throw new Error(handleSupabaseError(error, 'Create Care Log'));
    }
  },

  // Update care log
  updateCareLog: async (careLogId, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARE_LOGS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', careLogId)
        .select(`
          *,
          plants (
            id,
            name,
            image_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Update Care Log'));
    }
  },

  // Delete care log
  deleteCareLog: async (careLogId) => {
    try {
      const { error } = await supabase
        .from(TABLES.CARE_LOGS)
        .delete()
        .eq('id', careLogId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Delete Care Log'));
    }
  },

  // Get care statistics for a user
  getCareStats: async (userId, days = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from(TABLES.CARE_LOGS)
        .select('care_type, care_date')
        .eq('user_id', userId)
        .gte('care_date', startDate.toISOString())
        .order('care_date', { ascending: false });

      if (error) throw error;

      // Process statistics
      const stats = {
        total: data.length,
        water: 0,
        fertilize: 0,
        prune: 0,
        repot: 0,
        clean: 0,
        byDay: {},
      };

      data.forEach((log) => {
        // Count by type
        stats[log.care_type] = (stats[log.care_type] || 0) + 1;

        // Count by day
        const day = new Date(log.care_date).toDateString();
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Care Stats'));
    }
  },

  // Get recent care activities (for dashboard)
  getRecentActivities: async (userId, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARE_LOGS)
        .select(`
          *,
          plants (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('care_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Recent Activities'));
    }
  },

  // Get care reminders (plants that need care)
  getCareReminders: async (userId) => {
    try {
      // Get all user plants with their last care logs
      const { data: plants, error } = await supabase
        .from(TABLES.PLANTS)
        .select(`
          *,
          care_logs (
            care_type,
            care_date
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reminders = [];
      const now = new Date();

      plants.forEach((plant) => {
        const lastWatered = plant.last_watered ? new Date(plant.last_watered) : null;
        
        if (lastWatered) {
          const daysSinceWatered = Math.floor((now - lastWatered) / (1000 * 60 * 60 * 24));
          let shouldWater = false;

          switch (plant.water_frequency) {
            case 'daily':
              shouldWater = daysSinceWatered >= 1;
              break;
            case 'every3days':
              shouldWater = daysSinceWatered >= 3;
              break;
            case 'weekly':
              shouldWater = daysSinceWatered >= 7;
              break;
          }

          if (shouldWater) {
            reminders.push({
              plant,
              type: 'water',
              daysOverdue: daysSinceWatered,
              priority: daysSinceWatered > 2 ? 'high' : 'medium',
            });
          }
        } else {
          // Never watered
          reminders.push({
            plant,
            type: 'water',
            daysOverdue: 999,
            priority: 'high',
          });
        }
      });

      return reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Care Reminders'));
    }
  },
};

export default careLogService;