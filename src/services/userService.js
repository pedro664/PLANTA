/**
 * User Service
 * Handles all user-related database operations
 */

import { supabase, TABLES, handleSupabaseError } from './supabase';
import { uploadAvatarImage, replaceImage, STORAGE_BUCKETS } from './uploadService';

export const userService = {
  // MELHORIA #3: Sincronizar perfil do usuário com auth.users
  syncUserProfile: async (userId, userData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .upsert({
          id: userId,
          name: userData?.name || 'Usuário',
          email: userData?.email || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      console.log('✅ User profile synced:', data?.id);
      return data;
    } catch (error) {
      console.error('❌ Error syncing user profile:', error);
      throw new Error(handleSupabaseError(error, 'Sync User Profile'));
    }
  },

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
            username: userData.username || null,
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
      let avatarUrl = updates.avatar_url;
      
      // Handle avatar upload if new image provided
      if (updates.avatarFile) {
        try {
          console.log('👤 Updating user avatar...');
          
          // Get current user to check for existing avatar
          const { data: currentUser } = await supabase
            .from(TABLES.USERS)
            .select('avatar_url')
            .eq('id', userId)
            .single();

          const uploadResult = await replaceImage(
            updates.avatarFile, 
            STORAGE_BUCKETS.AVATARS, 
            currentUser?.avatar_url,
            `users/${userId}`
          );
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('❌ Error updating user avatar:', uploadError);
          // Continue with update without changing avatar
        }
      }

      // Remove avatarFile from updates and add processed avatarUrl
      const { avatarFile, ...cleanUpdates } = updates;
      const finalUpdates = {
        ...cleanUpdates,
        ...(avatarUrl && { avatar_url: avatarUrl }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(finalUpdates)
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

  // Verificar e conceder badges automaticamente baseado em conquistas
  checkAndAwardBadges: async (userId) => {
    try {
      // Buscar dados do usuário
      const { data: user, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('badges, xp, total_plants, active_days')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Contar plantas do usuário
      const { count: plantCount } = await supabase
        .from(TABLES.PLANTS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Contar care logs do usuário
      const { count: careCount } = await supabase
        .from(TABLES.CARE_LOGS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const currentBadges = user.badges || [];
      const newBadges = [...currentBadges];

      // Regras para conceder badges
      // Primeira Planta - ter pelo menos 1 planta
      if (plantCount >= 1 && !currentBadges.includes('first_plant')) {
        newBadges.push('first_plant');
      }

      // Colecionador - ter 5+ plantas
      if (plantCount >= 5 && !currentBadges.includes('plant_collector')) {
        newBadges.push('plant_collector');
      }

      // Amante de Plantas - ter 10+ plantas
      if (plantCount >= 10 && !currentBadges.includes('plant_lover')) {
        newBadges.push('plant_lover');
      }

      // Cuidador Dedicado - ter 10+ registros de cuidado
      if (careCount >= 10 && !currentBadges.includes('dedicated_caretaker')) {
        newBadges.push('dedicated_caretaker');
      }

      // Mestre da Água - ter 25+ registros de cuidado
      if (careCount >= 25 && !currentBadges.includes('water_master')) {
        newBadges.push('water_master');
      }

      // Polegar Verde - ter 50+ XP
      if (user.xp >= 50 && !currentBadges.includes('green_thumb')) {
        newBadges.push('green_thumb');
      }

      // Dedicação - ter 100+ XP
      if (user.xp >= 100 && !currentBadges.includes('dedication')) {
        newBadges.push('dedication');
      }

      // Especialista - ter 500+ XP
      if (user.xp >= 500 && !currentBadges.includes('expert')) {
        newBadges.push('expert');
      }

      // Se há novas badges, atualizar no banco
      if (newBadges.length > currentBadges.length) {
        const { data, error } = await supabase
          .from(TABLES.USERS)
          .update({ 
            badges: newBadges,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        console.log('🏆 Novas badges concedidas:', newBadges.filter(b => !currentBadges.includes(b)));
        return { user: data, newBadges: newBadges.filter(b => !currentBadges.includes(b)) };
      }

      return { user, newBadges: [] };
    } catch (error) {
      console.error('❌ Erro ao verificar badges:', error);
      return { user: null, newBadges: [] };
    }
  },

  // Verificar se username está disponível
  checkUsernameAvailability: async (username) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // Nenhum resultado encontrado - username disponível
        return true;
      }
      
      if (error) throw error;
      
      // Username já existe
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar username:', error);
      throw new Error('Erro ao verificar disponibilidade do username');
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