/**
 * Supabase Client Configuration
 * Handles database connection and authentication
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration - hardcoded for build compatibility
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vmwuxstyiurspttffykt.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so';

// Log warning instead of throwing error to prevent app crash
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. App will run in offline mode.');
}

// Create Supabase client with AsyncStorage for session persistence
// Use dummy values if env vars are missing to prevent crash
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

console.log('🔗 Supabase URL:', safeUrl);
console.log('🔑 Supabase Key configured:', safeKey ? 'Yes' : 'No');

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('REDACTED'));

// Test connection function for debugging
export const testConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ Connection test successful');
    return { success: true, session: data.session };
  } catch (err) {
    console.error('❌ Connection test error:', err);
    return { success: false, error: err.message };
  }
};

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