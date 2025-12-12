import { DatabaseService, StorageService, AuthService } from './supabase';

// Higher-level database operations that combine multiple service calls
export const PlantaDatabase = {
  // Initialize user data after signup/signin
  async initializeUser(userData) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      // Check if user profile exists
      let profile;
      try {
        profile = await DatabaseService.getUserProfile(user.id);
      } catch (error) {
        // Profile doesn't exist, create it
        profile = await DatabaseService.createUser({
          id: user.id,
          email: user.email,
          name: userData.name || 'Usuário',
          ...userData
        });
      }

      return profile;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  },

  // Create a new plant with image upload
  async createPlantWithImage(plantData, imageFile) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const { publicUrl } = await StorageService.uploadPlantImage(imageFile, user.id);
        imageUrl = publicUrl;
      }

      // Create plant record
      const plant = await DatabaseService.createPlant({
        ...plantData,
        user_id: user.id,
        image_url: imageUrl,
      });

      return plant;
    } catch (error) {
      console.error('Error creating plant:', error);
      throw error;
    }
  },

  // Update plant with optional image upload
  async updatePlantWithImage(plantId, updates, imageFile = null) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      let imageUrl = updates.image_url;
      
      // Upload new image if provided
      if (imageFile) {
        const { publicUrl } = await StorageService.uploadPlantImage(imageFile, user.id);
        imageUrl = publicUrl;
      }

      // Update plant record
      const plant = await DatabaseService.updatePlant(plantId, {
        ...updates,
        image_url: imageUrl,
      });

      return plant;
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error;
    }
  },

  // Get user's plants with care status
  async getUserPlantsWithStatus(userId) {
    try {
      const plants = await DatabaseService.getUserPlants(userId);
      
      // Calculate care status for each plant
      const plantsWithStatus = plants.map(plant => {
        const status = this.calculatePlantStatus(plant);
        return { ...plant, calculated_status: status };
      });

      return plantsWithStatus;
    } catch (error) {
      console.error('Error getting user plants:', error);
      throw error;
    }
  },

  // Calculate if a plant needs attention based on care logs
  calculatePlantStatus(plant) {
    if (!plant.care_logs || plant.care_logs.length === 0) {
      return 'attention'; // No care logs, needs attention
    }

    const lastWaterLog = plant.care_logs
      .filter(log => log.care_type === 'water')
      .sort((a, b) => new Date(b.care_date) - new Date(a.care_date))[0];

    if (!lastWaterLog) {
      return 'thirsty'; // Never been watered
    }

    const daysSinceWater = Math.floor(
      (new Date() - new Date(lastWaterLog.care_date)) / (1000 * 60 * 60 * 24)
    );

    // Check watering frequency
    const wateringDays = {
      'daily': 1,
      'every3days': 3,
      'weekly': 7
    };

    const requiredDays = wateringDays[plant.water_frequency] || 7;
    
    if (daysSinceWater >= requiredDays) {
      return 'thirsty';
    } else if (daysSinceWater >= requiredDays - 1) {
      return 'attention';
    }

    return 'fine';
  },

  // Create care log and update plant status
  async addCareLogWithStatusUpdate(plantId, careLogData) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      // Create care log
      const careLog = await DatabaseService.createCareLog({
        ...careLogData,
        plant_id: plantId,
        user_id: user.id,
      });

      // Get updated plant to recalculate status
      const plant = await DatabaseService.getPlantById(plantId);
      const newStatus = this.calculatePlantStatus(plant);

      // Update plant status if it changed
      if (plant.status !== newStatus) {
        await DatabaseService.updatePlant(plantId, { status: newStatus });
      }

      return careLog;
    } catch (error) {
      console.error('Error adding care log:', error);
      throw error;
    }
  },

  // Create post with image upload
  async createPostWithImage(postData, imageFile) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const { publicUrl } = await StorageService.uploadPostImage(imageFile, user.id);
        imageUrl = publicUrl;
      }

      // Create post record
      const post = await DatabaseService.createPost({
        ...postData,
        user_id: user.id,
        image_url: imageUrl,
      });

      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update user profile with avatar upload
  async updateUserProfileWithAvatar(updates, avatarFile = null) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      let avatarUrl = updates.avatar_url;
      
      // Upload new avatar if provided
      if (avatarFile) {
        const { publicUrl } = await StorageService.uploadAvatar(avatarFile, user.id);
        avatarUrl = publicUrl;
      }

      // Update user profile
      const profile = await DatabaseService.updateUserProfile(user.id, {
        ...updates,
        avatar_url: avatarUrl,
      });

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get community feed with pagination
  async getCommunityFeed(category = 'all', page = 0, limit = 20) {
    try {
      const offset = page * limit;
      const posts = await DatabaseService.getCommunityPosts(category, limit, offset);
      
      return {
        posts,
        hasMore: posts.length === limit,
        nextPage: posts.length === limit ? page + 1 : null,
      };
    } catch (error) {
      console.error('Error getting community feed:', error);
      throw error;
    }
  },

  // Toggle like and return updated status
  async togglePostLike(postId) {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const result = await DatabaseService.toggleLike(postId, user.id);
      return result;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Get plant details with comments
  async getPlantWithComments(plantId) {
    try {
      const plant = await DatabaseService.getPlantById(plantId);
      
      // If plant is public, get comments from posts
      if (plant.is_public) {
        // Find post for this plant
        const posts = await DatabaseService.getCommunityPosts('all', 100, 0);
        const plantPost = posts.find(post => post.plant_id === plantId);
        
        if (plantPost) {
          const comments = await DatabaseService.getPostComments(plantPost.id);
          plant.comments = comments;
        }
      }

      return plant;
    } catch (error) {
      console.error('Error getting plant with comments:', error);
      throw error;
    }
  },

  // Search plants by name or scientific name
  async searchPlants(query, isPublicOnly = false) {
    try {
      const user = await AuthService.getCurrentUser();
      
      let plants;
      if (isPublicOnly) {
        plants = await DatabaseService.getPublicPlants();
      } else {
        if (!user) throw new Error('No authenticated user');
        plants = await DatabaseService.getUserPlants(user.id);
      }

      // Filter plants by query
      const filteredPlants = plants.filter(plant => 
        plant.name.toLowerCase().includes(query.toLowerCase()) ||
        (plant.scientific_name && plant.scientific_name.toLowerCase().includes(query.toLowerCase()))
      );

      return filteredPlants;
    } catch (error) {
      console.error('Error searching plants:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const profile = await DatabaseService.getUserProfile(userId);
      const plants = await DatabaseService.getUserPlants(userId);
      
      // Calculate additional stats
      const totalCareLogs = plants.reduce((total, plant) => 
        total + (plant.care_logs ? plant.care_logs.length : 0), 0
      );
      
      const plantsNeedingAttention = plants.filter(plant => 
        this.calculatePlantStatus(plant) !== 'fine'
      ).length;

      return {
        ...profile,
        total_care_logs: totalCareLogs,
        plants_needing_attention: plantsNeedingAttention,
        plants: plants.length,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },
};

export default PlantaDatabase;