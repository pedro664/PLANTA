/**
 * Supabase Client Configuration
 * Handles database connection and authentication
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database table names
export const TABLES = {
  USERS: 'users',
  PLANTS: 'plants',
  CARE_LOGS: 'care_logs',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error, context = '') => {
  console.error(`Supabase Error ${context}:`, error);
  
  if (error?.message) {
    // Common error messages
    if (error.message.includes('JWT expired')) {
      return 'Sessão expirada. Faça login novamente.';
    }
    if (error.message.includes('Invalid login credentials')) {
      return 'Credenciais inválidas.';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada.';
    }
    if (error.message.includes('User already registered')) {
      return 'Este email já está cadastrado.';
    }
    if (error.message.includes('Network request failed')) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    
    return error.message;
  }
  
  return 'Erro desconhecido. Tente novamente.';
};

// Auth helper functions
export const authHelpers = {
  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Sign up with email
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined, // Disable email redirect
        },
      });
      
      if (error) throw error;
      
      // If user is created but session is null, it means email confirmation is required
      // We'll handle this by auto-signing in after signup
      if (data.user && !data.session) {
        // Try to sign in immediately after signup (works if email confirmation is disabled in Supabase)
        try {
          const signInResult = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInResult.data.session) {
            return { user: signInResult.data.user, session: signInResult.data.session };
          }
        } catch (signInError) {
          console.log('Auto sign-in after signup failed, email confirmation may be required');
        }
      }
      
      return { user: data.user, session: data.session };
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Sign Up'));
    }
  },

  // Sign in with email
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Sign In'));
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Sign Out'));
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Reset Password'));
    }
  },
};

export default supabase;