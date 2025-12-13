/**
 * Image Migration Service
 * Migrate images from external sources to Supabase Storage
 */

import { supabase, TABLES } from './supabase';
import { uploadPlantImage, uploadPostImage } from './uploadService';
import { v4 as uuidv4 } from 'uuid';

export const imageMigrationService = {
  // Migrate a single plant image to Supabase Storage
  migrateImageToSupabaseStorage: async (plantId) => {
    try {
      const plant = await supabase
        .from(TABLES.PLANTS)
        .select('id, image_url, image_status')
        .eq('id', plantId)
        .single();

      if (!plant?.data?.image_url) {
        console.log('⚠️ Plant has no image to migrate:', plantId);
        return null;
      }

      if (plant.data.image_status === 'supabase') {
        console.log('✅ Plant image already in Supabase:', plantId);
        return plant.data;
      }

      console.log('🌱 Migrating plant image:', plantId);

      // Download image from external source
      const response = await fetch(plant.data.image_url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileName = `plants/${plantId}.jpg`;
      const { data, error } = await supabase.storage
        .from('plant-images')
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;

      // Generate public URL
      const { data: { publicUrl } } = supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName);

      // Update plant record
      const { data: updatedPlant, error: updateError } = await supabase
        .from(TABLES.PLANTS)
        .update({
          image_url: publicUrl,
          image_status: 'supabase',
          image_size_kb: Math.round(blob.size / 1024),
          image_uploaded_at: new Date().toISOString()
        })
        .eq('id', plantId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('✅ Plant image migrated:', plantId);
      return updatedPlant;
    } catch (error) {
      console.error('❌ Error migrating plant image:', error);
      return null;
    }
  },

  // Migrate all plant images to Supabase Storage
  migrateAllPlantImages: async (onProgress) => {
    try {
      console.log('🌱 Starting plant image migration...');

      const { data: plants, error } = await supabase
        .from(TABLES.PLANTS)
        .select('id, image_status')
        .neq('image_status', 'supabase')
        .limit(100);

      if (error) throw error;

      if (!plants || plants.length === 0) {
        console.log('✅ All plants already migrated!');
        return { success: plants?.length || 0, failed: 0 };
      }

      const results = { success: 0, failed: 0 };

      for (let i = 0; i < plants.length; i++) {
        const plant = plants[i];
        const success = await this.migrateImageToSupabaseStorage(plant.id);

        if (success) {
          results.success++;
        } else {
          results.failed++;
        }

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: plants.length,
            success: results.success,
            failed: results.failed,
          });
        }
      }

      console.log('✅ Plant migration complete:', results);
      return results;
    } catch (error) {
      console.error('❌ Error during plant migration:', error);
      throw error;
    }
  },

  // Similar for posts
  migrateImageToSupabaseStoragePost: async (postId) => {
    try {
      const post = await supabase
        .from(TABLES.POSTS)
        .select('id, image_url, image_status')
        .eq('id', postId)
        .single();

      if (!post?.data?.image_url) {
        console.log('⚠️ Post has no image to migrate:', postId);
        return null;
      }

      if (post.data.image_status === 'supabase') {
        console.log('✅ Post image already in Supabase:', postId);
        return post.data;
      }

      console.log('📸 Migrating post image:', postId);

      // Download image from external source
      const response = await fetch(post.data.image_url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileName = `posts/${postId}.jpg`;
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;

      // Generate public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      // Update post record
      const { data: updatedPost, error: updateError } = await supabase
        .from(TABLES.POSTS)
        .update({
          image_url: publicUrl,
          image_status: 'supabase',
          image_size_kb: Math.round(blob.size / 1024),
          image_uploaded_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('✅ Post image migrated:', postId);
      return updatedPost;
    } catch (error) {
      console.error('❌ Error migrating post image:', error);
      return null;
    }
  },

  // Migrate all post images to Supabase Storage
  migrateAllPostImages: async (onProgress) => {
    try {
      console.log('📸 Starting post image migration...');

      const { data: posts, error } = await supabase
        .from(TABLES.POSTS)
        .select('id, image_status')
        .neq('image_status', 'supabase')
        .limit(100);

      if (error) throw error;

      if (!posts || posts.length === 0) {
        console.log('✅ All posts already migrated!');
        return { success: posts?.length || 0, failed: 0 };
      }

      const results = { success: 0, failed: 0 };

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const success = await this.migrateImageToSupabaseStoragePost(post.id);

        if (success) {
          results.success++;
        } else {
          results.failed++;
        }

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: posts.length,
            success: results.success,
            failed: results.failed,
          });
        }
      }

      console.log('✅ Post migration complete:', results);
      return results;
    } catch (error) {
      console.error('❌ Error during post migration:', error);
      throw error;
    }
  },

  // Comprehensive migration for all images
  migrateAllImages: async (onProgress) => {
    try {
      console.log('🔄 Starting comprehensive image migration...');

      const plantResults = await this.migrateAllPlantImages((progress) => {
        if (onProgress) {
          onProgress({
            type: 'plants',
            ...progress
          });
        }
      });

      const postResults = await this.migrateAllPostImages((progress) => {
        if (onProgress) {
          onProgress({
            type: 'posts',
            ...progress
          });
        }
      });

      const totalResults = {
        plants: plantResults,
        posts: postResults,
        total: {
          success: (plantResults.success || 0) + (postResults.success || 0),
          failed: (plantResults.failed || 0) + (postResults.failed || 0),
        }
      };

      console.log('✅ All migrations complete:', totalResults);
      return totalResults;
    } catch (error) {
      console.error('❌ Error during comprehensive migration:', error);
      throw error;
    }
  }
};

export default imageMigrationService;
