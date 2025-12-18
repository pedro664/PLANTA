/**
 * Catalog Service
 * Handles plant catalog operations from Supabase database
 */

import { supabase, handleSupabaseError } from './supabase';

// Categorias de plantas
export const PLANT_CATEGORIES = [
  { id: 'vegetable', name: 'Hortaliças', icon: '🥬' },
  { id: 'herb', name: 'Ervas', icon: '🌿' },
  { id: 'fruit', name: 'Frutas', icon: '🍎' },
  { id: 'flower', name: 'Flores', icon: '🌸' },
  { id: 'succulent', name: 'Suculentas', icon: '🌵' },
  { id: 'ornamental', name: 'Ornamentais', icon: '🪴' },
  { id: 'medicinal', name: 'Medicinais', icon: '💊' },
  { id: 'tree', name: 'Árvores', icon: '🌳' },
  { id: 'vine', name: 'Trepadeiras', icon: '🍇' },
  { id: 'aquatic', name: 'Aquáticas', icon: '🪷' },
];

export const catalogService = {
  // Buscar todas as plantas do catálogo
  getAllPlants: async () => {
    try {
      const { data, error } = await supabase
        .from('plant_catalog')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get All Catalog Plants'));
    }
  },

  // Buscar plantas por categoria
  getPlantsByCategory: async (category) => {
    try {
      const { data, error } = await supabase
        .from('plant_catalog')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Plants By Category'));
    }
  },

  // Buscar planta por ID
  getPlantById: async (plantId) => {
    try {
      const { data, error } = await supabase
        .from('plant_catalog')
        .select('*')
        .eq('id', plantId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Catalog Plant By ID'));
    }
  },

  // Pesquisar plantas
  searchPlants: async (query) => {
    try {
      const { data, error } = await supabase
        .from('plant_catalog')
        .select('*')
        .or(`name.ilike.%${query}%,scientific_name.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Search Catalog Plants'));
    }
  },

  // Buscar plantas com filtros (categoria + busca)
  getFilteredPlants: async (category = null, searchQuery = '') => {
    try {
      let query = supabase
        .from('plant_catalog')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,scientific_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query
        .order('name', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Filtered Plants'));
    }
  },

  // Contar plantas por categoria
  getPlantCountByCategory: async () => {
    try {
      const { data, error } = await supabase
        .from('plant_catalog')
        .select('category');

      if (error) throw error;

      const counts = {};
      (data || []).forEach(plant => {
        counts[plant.category] = (counts[plant.category] || 0) + 1;
      });

      return counts;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Get Plant Count By Category'));
    }
  },
};

// Helper para formatar dados do catálogo para o formato esperado pelo app
export const formatCatalogPlant = (plant) => {
  if (!plant) return null;

  return {
    id: plant.id,
    name: plant.name,
    scientific_name: plant.scientific_name,
    category: plant.category,
    description: plant.description,
    image_placeholder: plant.image_placeholder,
    care: {
      water_frequency: plant.water_frequency,
      water_description: plant.water_description,
      light_needs: plant.light_needs,
      light_description: plant.light_description,
      temperature: {
        min: plant.temperature_min,
        max: plant.temperature_max,
        ideal: plant.temperature_ideal,
      },
      humidity: plant.humidity,
      soil: plant.soil,
    },
    growth: {
      germination_days: plant.germination_days,
      harvest_days: plant.harvest_days,
      plant_spacing: plant.plant_spacing,
      planting_depth: plant.planting_depth,
    },
    fertilizer: {
      type: plant.fertilizer_type,
      description: plant.fertilizer_description,
      frequency: plant.fertilizer_frequency,
    },
    pruning: {
      needed: plant.pruning_needed,
      frequency: plant.pruning_frequency,
      description: plant.pruning_description,
    },
    harvest: {
      frequency: plant.harvest_frequency,
      description: plant.harvest_description,
      signs: plant.harvest_signs,
    },
    pests: plant.pests || [],
    tips: plant.tips || [],
  };
};

export default catalogService;
