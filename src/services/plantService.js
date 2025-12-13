/**
 * Plant Service
 * Handles all plant-related database operations
 */

import { supabase, TABLES, handleSupabaseError } from './supabase';
import { uploadPlantImage, replaceImage, STORAGE_BUCKETS } from './uploadService';

export const plantService = {
  // Get all plants for a user
  getUserPlants: async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLANTS)
        .select(`
          *,
          care_logs (
            id,
            care_type,
            notes,
            care_date,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get User Plants'));
    }
  },

  // Get plant by ID
  getPlantById: async (plantId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLANTS)
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          ),
          care_logs (
            id,
            care_type,
            notes,
            care_date,
            created_at
          )
        `)
        .eq('id', plantId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Plant By ID'));
    }
  },

  // Create new plant
  createPlant: async (userId, plantData) => {
    try {
      // VALIDAÇÃO CRÍTICA #1: Imagem obrigatória
      if (!plantData.imageFile) {
        throw new Error('Imagem é obrigatória para criar uma planta');
      }

      let imageUrl = null;
      
      console.log('🌱 Criando planta:', plantData.name);
      
      // Criar planta SEM imagem primeiro (para obter ID)
      const { data: plantRecord, error: plantError } = await supabase
        .from(TABLES.PLANTS)
        .insert([
          {
            user_id: userId,
            name: plantData.name,
            scientific_name: plantData.scientific_name || null,
            image_url: null, // Será preenchido após upload
            description: plantData.description || null,
            water_frequency: plantData.water_frequency,
            light_needs: plantData.light_needs,
            status: 'fine',
            last_watered: plantData.last_watered || new Date().toISOString(),
            tips: plantData.tips || [],
            image_status: 'uploading', // Marca como pendente de upload
            image_size_kb: null,
            image_uploaded_at: null,
          },
        ])
        .select()
        .single();

      if (plantError) throw plantError;

      console.log('✅ Planta criada com ID:', plantRecord.id);

      // Fazer upload da imagem (OBRIGATÓRIO agora)
      try {
        console.log('📸 Iniciando upload da imagem...');
        const uploadResult = await uploadPlantImage(plantData.imageFile, plantRecord.id);
        imageUrl = uploadResult.url;
        
        console.log('✅ Imagem enviada com sucesso:', imageUrl);
        
        // Atualizar planta com URL da imagem
        const { data: updatedPlant, error: updateError } = await supabase
          .from(TABLES.PLANTS)
          .update({ 
            image_url: imageUrl,
            image_status: 'supabase',
            image_size_kb: uploadResult.size ? Math.round(uploadResult.size / 1024) : null,
            image_uploaded_at: uploadResult.uploadedAt || new Date().toISOString()
          })
          .eq('id', plantRecord.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        console.log('✅ Planta atualizada com imagem no banco');
        return updatedPlant;
      } catch (uploadError) {
        console.error('❌ Erro ao fazer upload da imagem:', uploadError);
        
        // VALIDAÇÃO CRÍTICA #2: Deletar planta se upload falhar
        try {
          await supabase
            .from(TABLES.PLANTS)
            .delete()
            .eq('id', plantRecord.id);
          console.log('🗑️ Planta deletada porque o upload falhou');
        } catch (deleteError) {
          console.error('⚠️ Erro ao deletar planta sem imagem:', deleteError);
        }
        
        throw new Error(`Falha ao fazer upload da imagem: ${uploadError.message}`);
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Create Plant'));
    }
  },

  // Update plant
  updatePlant: async (plantId, updates) => {
    try {
      let imageUrl = updates.image_url;
      
      // Handle image upload if new image provided
      if (updates.imageFile) {
        try {
          console.log('🌱 Updating plant image...');
          
          // Get current plant to check for existing image
          const { data: currentPlant } = await supabase
            .from(TABLES.PLANTS)
            .select('image_url')
            .eq('id', plantId)
            .single();

          const uploadResult = await replaceImage(
            updates.imageFile, 
            STORAGE_BUCKETS.PLANTS, 
            currentPlant?.image_url,
            `plants/${plantId}`
          );
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('❌ Error updating plant image:', uploadError);
          // Continue with update without changing image
        }
      }

      // Remove imageFile from updates and add processed imageUrl
      const { imageFile, ...cleanUpdates } = updates;
      const finalUpdates = {
        ...cleanUpdates,
        ...(imageUrl && { image_url: imageUrl }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(TABLES.PLANTS)
        .update(finalUpdates)
        .eq('id', plantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Update Plant'));
    }
  },

  // Delete plant
  deletePlant: async (plantId) => {
    try {
      const { error } = await supabase
        .from(TABLES.PLANTS)
        .delete()
        .eq('id', plantId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Delete Plant'));
    }
  },

  // Get public plants (community feed)
  getPublicPlants: async (limit = 20, offset = 0) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLANTS)
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Public Plants'));
    }
  },

  // Get plants that need attention
  getPlantsNeedingAttention: async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLANTS)
        .select('*')
        .eq('user_id', userId)
        .in('status', ['thirsty', 'attention'])
        .order('last_watered', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Plants Needing Attention'));
    }
  },

  // Update plant status based on care schedule
  updatePlantStatus: async (plantId) => {
    try {
      const { data: plant, error: getError } = await supabase
        .from(TABLES.PLANTS)
        .select('*')
        .eq('id', plantId)
        .single();

      if (getError) throw getError;

      const now = new Date();
      const lastWatered = new Date(plant.last_watered);
      const daysSinceWatered = Math.floor((now - lastWatered) / (1000 * 60 * 60 * 24));

      let newStatus = 'fine';
      
      // Determine status based on water frequency
      switch (plant.water_frequency) {
        case 'daily':
          if (daysSinceWatered >= 2) newStatus = 'thirsty';
          else if (daysSinceWatered >= 1) newStatus = 'attention';
          break;
        case 'every3days':
          if (daysSinceWatered >= 5) newStatus = 'thirsty';
          else if (daysSinceWatered >= 3) newStatus = 'attention';
          break;
        case 'weekly':
          if (daysSinceWatered >= 10) newStatus = 'thirsty';
          else if (daysSinceWatered >= 7) newStatus = 'attention';
          break;
      }

      if (newStatus !== plant.status) {
        const { data, error } = await supabase
          .from(TABLES.PLANTS)
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plantId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      return plant;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Update Plant Status'));
    }
  },

  // Search plants
  searchPlants: async (query, userId = null, includePublic = true) => {
    try {
      let queryBuilder = supabase
        .from(TABLES.PLANTS)
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .or(`name.ilike.%${query}%,scientific_name.ilike.%${query}%,description.ilike.%${query}%`);

      if (userId && includePublic) {
        queryBuilder = queryBuilder.or(`user_id.eq.${userId},is_public.eq.true`);
      } else if (userId) {
        queryBuilder = queryBuilder.eq('user_id', userId);
      } else if (includePublic) {
        queryBuilder = queryBuilder.eq('is_public', true);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Search Plants'));
    }
  },
};

export default plantService;