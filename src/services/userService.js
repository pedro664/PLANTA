/**
 * User Service
 * Handles all user-related database operations
 */

import { supabase, TABLES, handleSupabaseError } from './supabase';

export const userService = {
  // Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get User Profile'));
    }
  },

  // Create user profile (called after auth signup)
  createUserProfile: async (userId, userData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([
          {
            id: userId,
            name: userData.name || 'Usuário',
            email: userData.email,
            avatar_url: userData.avatar_url || null,
            join_date: new Date().toISOString(),
            xp: 0,
            level: 'Iniciante',
            total_plants: 0,
            active_days: 1,
            badges: [],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Create User Profile'));
    }
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Update User Profile'));
    }
  },

  // Add XP to user
  addXP: async (userId, xpAmount) => {
    try {
      // Get current user data
      const { data: user, error: getUserError } = await supabase
        .from(TABLES.USERS)
        .select('xp, level')
        .eq('id', userId)
        .single();

      if (getUserError) throw getUserError;

      const newXP = user.xp + xpAmount;
      const newLevel = calculateLevel(newXP);

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { user: data, xpGained: xpAmount, levelUp: newLevel !== user.level };
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Add XP'));
    }
  },

  // Add badge to user
  addBadge: async (userId, badgeName) => {
    try {
      const { data: user, error: getUserError } = await supabase
        .from(TABLES.USERS)
        .select('badges')
        .eq('id', userId)
        .single();

      if (getUserError) throw getUserError;

      const currentBadges = user.badges || [];
      if (currentBadges.includes(badgeName)) {
        return user; // Badge already exists
      }

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          badges: [...currentBadges, badgeName],
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Add Badge'));
    }
  },

  // Get user stats
  getUserStats: async (userId) => {
    try {
      // Get user basic info
      const { data: user, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get plant count
      const { count: plantCount, error: plantError } = await supabase
        .from(TABLES.PLANTS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (plantError) throw plantError;

      // Get care logs count
      const { count: careCount, error: careError } = await supabase
        .from(TABLES.CARE_LOGS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (careError) throw careError;

      return {
        ...user,
        total_plants: plantCount || 0,
        total_care_logs: careCount || 0,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get User Stats'));
    }
  },
};

// Helper function to calculate level based on XP
const calculateLevel = (xp) => {
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200];
  const levelNames = [
    'Semente',
    'Broto',
    'Muda',
    'Planta Jovem',
    'Planta Adulta',
    'Árvore',
    'Árvore Antiga',
    'Floresta',
    'Jardim Botânico',
    'Mestre Jardineiro',
  ];

  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (xp >= levelThresholds[i]) {
      return levelNames[i] || 'Semente';
    }
  }
  return 'Semente';
};

export default userService;