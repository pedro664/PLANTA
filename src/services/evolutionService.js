/**
 * EduCultivo - Evolution Service
 * Handles plant evolution/growth progress operations
 */

import { supabase, TABLES, handleSupabaseError } from './supabase';
import { uploadImage, STORAGE_BUCKETS } from './uploadService';

// Adicionar tabela de evoluções
const EVOLUTION_TABLE = 'plant_evolutions';

export const evolutionService = {
  /**
   * Buscar todas as evoluções de uma planta
   */
  getPlantEvolutions: async (plantId) => {
    try {
      const { data, error } = await supabase
        .from(EVOLUTION_TABLE)
        .select('*')
        .eq('plant_id', plantId)
        .order('evolution_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Plant Evolutions'));
    }
  },

  /**
   * Criar nova evolução para uma planta
   */
  createEvolution: async (userId, plantId, evolutionData) => {
    try {
      // Validar imagem obrigatória
      if (!evolutionData.imageFile) {
        throw new Error('Imagem é obrigatória para registrar evolução');
      }

      console.log('📸 Criando evolução para planta:', plantId);

      // Criar registro primeiro (sem imagem)
      const { data: evolution, error: createError } = await supabase
        .from(EVOLUTION_TABLE)
        .insert([{
          plant_id: plantId,
          user_id: userId,
          image_url: '', // Será preenchido após upload
          description: evolutionData.description || null,
          evolution_date: evolutionData.evolution_date || new Date().toISOString(),
          image_status: 'uploading',
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Fazer upload da imagem
      try {
        const uploadResult = await uploadImage(
          evolutionData.imageFile,
          STORAGE_BUCKETS.PLANTS,
          `evolutions/${plantId}/${evolution.id}`
        );

        // Atualizar com URL da imagem
        const { data: updatedEvolution, error: updateError } = await supabase
          .from(EVOLUTION_TABLE)
          .update({
            image_url: uploadResult.url,
            image_status: 'supabase',
            image_size_kb: uploadResult.size ? Math.round(uploadResult.size / 1024) : null,
          })
          .eq('id', evolution.id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log('✅ Evolução criada com sucesso:', updatedEvolution.id);
        return updatedEvolution;
      } catch (uploadError) {
        // Se falhar upload, deletar registro
        await supabase.from(EVOLUTION_TABLE).delete().eq('id', evolution.id);
        throw new Error(`Falha ao fazer upload da imagem: ${uploadError.message}`);
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Create Evolution'));
    }
  },

  /**
   * Atualizar evolução existente
   */
  updateEvolution: async (evolutionId, updates) => {
    try {
      const { data, error } = await supabase
        .from(EVOLUTION_TABLE)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', evolutionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Update Evolution'));
    }
  },

  /**
   * Deletar evolução
   */
  deleteEvolution: async (evolutionId) => {
    try {
      const { error } = await supabase
        .from(EVOLUTION_TABLE)
        .delete()
        .eq('id', evolutionId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Delete Evolution'));
    }
  },

  /**
   * Vincular evolução a um post da comunidade
   */
  linkEvolutionToPost: async (evolutionId, postId) => {
    try {
      const { data, error } = await supabase
        .from(EVOLUTION_TABLE)
        .update({ post_id: postId })
        .eq('id', evolutionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Link Evolution to Post'));
    }
  },
};

export default evolutionService;
