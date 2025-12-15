/**
 * App Context with Supabase Integration
 * Global state management with real-time database operations
 */

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { supabase, authHelpers, isSupabaseConfigured } from '../services/supabase';
import { userService } from '../services/userService';
import { plantService } from '../services/plantService';
import { careLogService } from '../services/careLogService';
import { postService } from '../services/postService';
import { showSuccessToast, showErrorToast } from '../components/Toast';
import { logAndNotifyError } from '../utils/errorUtils';

// Create the context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Initial state
const initialState = {
  user: null,
  plants: [],
  careLogs: [],
  posts: [],
  isLoading: false,
  isAuthenticated: false,
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_PLANTS: 'SET_PLANTS',
  ADD_PLANT: 'ADD_PLANT',
  UPDATE_PLANT: 'UPDATE_PLANT',
  DELETE_PLANT: 'DELETE_PLANT',
  SET_CARE_LOGS: 'SET_CARE_LOGS',
  ADD_CARE_LOG: 'ADD_CARE_LOG',
  SET_POSTS: 'SET_POSTS',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  RESET_STATE: 'RESET_STATE',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTION_TYPES.SET_USER:
      return { ...state, user: action.payload };

    case ACTION_TYPES.SET_PLANTS:
      return { ...state, plants: action.payload };

    case ACTION_TYPES.ADD_PLANT:
      return { ...state, plants: [action.payload, ...state.plants] };

    case ACTION_TYPES.UPDATE_PLANT:
      return {
        ...state,
        plants: state.plants.map((plant) =>
          plant.id === action.payload.id ? action.payload : plant
        ),
      };

    case ACTION_TYPES.DELETE_PLANT:
      return {
        ...state,
        plants: state.plants.filter((plant) => plant.id !== action.payload),
      };

    case ACTION_TYPES.SET_CARE_LOGS:
      return { ...state, careLogs: action.payload };

    case ACTION_TYPES.ADD_CARE_LOG:
      return { ...state, careLogs: [action.payload, ...state.careLogs] };

    case ACTION_TYPES.SET_POSTS:
      return { ...state, posts: action.payload };

    case ACTION_TYPES.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload };

    case ACTION_TYPES.RESET_STATE:
      return { ...initialState };

    default:
      return state;
  }
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [session, setSession] = useState(null);

  // Initialize auth listener
  useEffect(() => {
    console.log('🔐 Starting auth initialization...');
    console.log('📡 Supabase configured:', isSupabaseConfigured);
    
    // Set authenticated to false immediately to allow app to load
    dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: false });
    
    // Skip Supabase if not configured
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured, running in offline mode');
      return;
    }
    
    const initializeAuth = async () => {
      try {
        console.log('🔗 Testing Supabase connection...');
        
        // Shorter timeout and more aggressive fallback
        const connectionTest = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 1500)
          )
        ]);
        
        const { data: { session }, error } = connectionTest;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          return;
        }

        console.log('📱 Session status:', session ? 'Active' : 'None');
        setSession(session);
        dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: !!session });
        
        console.log('✅ Auth initialization complete');
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        console.log('🔄 Continuing in offline mode');
      }
    };

    // Run in background with delay to not block initial render
    setTimeout(() => {
      initializeAuth();
    }, 100);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session ? 'Active' : 'None');
      setSession(session);
      dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: !!session });
      
      if (!session) {
        dispatch({ type: ACTION_TYPES.RESET_STATE });
      }
      // Let screens load user data when needed
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user data
  const loadUserData = async (userId) => {
    try {
      console.log('📊 Carregando dados do usuário:', userId);
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      // MELHORIA #3: Sincronizar usuário primeiro
      console.log('👤 Sincronizando perfil de usuário...');
      try {
        const syncedUser = await userService.syncUserProfile(userId, {
          name: session?.user?.user_metadata?.name || 'Usuário',
          email: session?.user?.email || '',
        });
        console.log('✅ Perfil sincronizado:', syncedUser?.name);
      } catch (syncError) {
        console.warn('⚠️ Erro ao sincronizar perfil (continuando):', syncError);
      }

      // Load user profile
      console.log('👤 Carregando perfil do usuário...');
      const userProfile = await userService.getUserProfile(userId);
      console.log('✅ Perfil carregado:', userProfile?.name);
      dispatch({ type: ACTION_TYPES.SET_USER, payload: userProfile });

      // Load user plants
      console.log('🌱 Carregando plantas do usuário...');
      const plants = await plantService.getUserPlants(userId);
      console.log('✅ Plantas carregadas:', plants?.length || 0);
      dispatch({ type: ACTION_TYPES.SET_PLANTS, payload: plants || [] });

      // Load recent care logs
      console.log('📝 Carregando histórico de cuidados...');
      const careLogs = await careLogService.getUserCareLogs(userId, 50);
      console.log('✅ Histórico carregado:', careLogs?.length || 0);
      dispatch({ type: ACTION_TYPES.SET_CARE_LOGS, payload: careLogs || [] });

      console.log('🎉 Dados do usuário carregados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      
      // If user profile doesn't exist, create one
      if (error.message.includes('No rows returned') || 
          error.message.includes('null') || 
          error.message.includes('Cannot coerce the result to a single JSON object') ||
          error.message.includes('The result contains 0 rows')) {
        console.log('🔧 Criando novo perfil de usuário...');
        try {
          const newUserProfile = await userService.createUserProfile(userId, {
            name: session?.user?.user_metadata?.name || 'Usuário',
            email: session?.user?.email || '',
          });
          console.log('✅ Perfil criado:', newUserProfile?.name);
          dispatch({ type: ACTION_TYPES.SET_USER, payload: newUserProfile });
          dispatch({ type: ACTION_TYPES.SET_PLANTS, payload: [] });
          dispatch({ type: ACTION_TYPES.SET_CARE_LOGS, payload: [] });
        } catch (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
          // If creation fails, use a basic user object
          const basicUser = {
            id: userId,
            name: session?.user?.user_metadata?.name || 'Usuário',
            email: session?.user?.email || '',
            xp: 0,
            level: 'Iniciante',
            total_plants: 0,
            active_days: 1,
            badges: [],
          };
          dispatch({ type: ACTION_TYPES.SET_USER, payload: basicUser });
          dispatch({ type: ACTION_TYPES.SET_PLANTS, payload: [] });
          dispatch({ type: ACTION_TYPES.SET_CARE_LOGS, payload: [] });
        }
      } else {
        try {
          logAndNotifyError(error, {
            context: 'AppContext.loadUserData',
            userMessage: 'Erro ao carregar dados do usuário',
            suggestion: 'Tente novamente mais tarde',
          });
        } catch (e) {
          console.error('Erro ao notificar loadUserData fallback:', e);
        }
      }
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Auth functions
  const signUp = async (email, password, userData) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      const { user } = await authHelpers.signUp(email, password, userData);
      
      if (user) {
        // Don't create user profile immediately - let the auth state change handle it
        showSuccessToast('Conta criada com sucesso!');
        return user;
      }
    } catch (error) {
      showErrorToast(error.message);
      throw error;
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  const signIn = async (email, password) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      console.log('🔐 Tentando login com:', email);
      const { user } = await authHelpers.signIn(email, password);
      
      if (user) {
        console.log('✅ Login bem sucedido:', user.id);
        showSuccessToast('Login realizado com sucesso!');
        return user;
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      // Mensagem mais amigável baseada no tipo de erro
      let errorMsg = error.message || 'Erro ao fazer login';
      if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
        errorMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (errorMsg.includes('Invalid') || errorMsg.includes('credentials')) {
        errorMsg = 'Email ou senha incorretos.';
      }
      showErrorToast(errorMsg);
      throw error;
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  const signOut = async () => {
    try {
      await authHelpers.signOut();
      setSession(null);
      dispatch({ type: ACTION_TYPES.RESET_STATE });
      dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: false });
      showSuccessToast('Logout realizado com sucesso!');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      try {
        logAndNotifyError(error, {
          context: 'AppContext.signOut',
          userMessage: 'Erro ao encerrar sessão',
          suggestion: 'Você foi desconectado localmente; faça login novamente',
        });
      } catch (e) {
        console.error('Erro ao notificar signOut error:', e);
      }
      // Force logout even if there's an error
      setSession(null);
      dispatch({ type: ACTION_TYPES.RESET_STATE });
      dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: false });
    }
  };

  const updateUser = async (userData) => {
    try {
      if (!state.user?.id) throw new Error('Usuário não autenticado');
      
      // Update user profile in database
      const updatedUser = await userService.updateUserProfile(state.user.id, userData);
      
      // Update local state
      dispatch({ type: ACTION_TYPES.SET_USER, payload: updatedUser });
      
      return updatedUser;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  };

  // Plant functions
  const addPlant = async (plantData) => {
    try {
      if (!state.user?.id) throw new Error('Usuário não autenticado');
      
      // VALIDAÇÃO: Verificar imagem antes de enviar
      if (!plantData.imageFile) {
        throw new Error('Selecione uma imagem para a planta');
      }
      
      // VALIDAÇÃO: Verificar tamanho da imagem (se disponível)
      const MAX_SIZE_MB = 10;
      const fileSize = plantData.imageFile.fileSize || plantData.imageFile.size || 0;
      if (fileSize > 0 && fileSize > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`Imagem muito grande (máximo ${MAX_SIZE_MB}MB)`);
      }
      
      console.log('📱 Criando planta com imagem:', plantData.name);
      const newPlant = await plantService.createPlant(state.user.id, plantData);
      dispatch({ type: ACTION_TYPES.ADD_PLANT, payload: newPlant });
      
      // Add XP for adding a plant
      await userService.addXP(state.user.id, 10);
      
      showSuccessToast('Planta adicionada com sucesso!');
      return newPlant;
    } catch (error) {
      console.error('❌ Erro ao adicionar planta:', error);
      try {
        logAndNotifyError(error, {
          context: 'AppContext.addPlant',
          userMessage: 'Erro ao adicionar planta',
          suggestion: 'Verifique a imagem e tente novamente',
        });
      } catch (e) {
        console.error('Erro ao notificar addPlant error:', e);
      }
      throw error;
    }
  };

  const updatePlant = async (plantId, updates) => {
    try {
      const updatedPlant = await plantService.updatePlant(plantId, updates);
      dispatch({ type: ACTION_TYPES.UPDATE_PLANT, payload: updatedPlant });
      
      showSuccessToast('Planta atualizada com sucesso!');
      return updatedPlant;
    } catch (error) {
      showErrorToast(error.message);
      throw error;
    }
  };

  const deletePlant = async (plantId) => {
    try {
      await plantService.deletePlant(plantId);
      dispatch({ type: ACTION_TYPES.DELETE_PLANT, payload: plantId });
      
      showSuccessToast('Planta removida com sucesso!');
    } catch (error) {
      showErrorToast(error.message);
      throw error;
    }
  };

  const getPlantById = (plantId) => {
    return state.plants.find((plant) => plant.id === plantId);
  };

  // Care log functions
  const addCareLog = async (plantId, careData) => {
    try {
      if (!state.user?.id) throw new Error('Usuário não autenticado');
      
      console.log('📋 Registrando care log para planta:', plantId, 'Tipo:', careData.care_type);
      
      const newCareLog = await careLogService.createCareLog(
        state.user.id,
        plantId,
        careData
      );
      
      if (!newCareLog) {
        throw new Error('Falha ao criar registro de cuidado');
      }
      
      console.log('✅ Care log criado:', newCareLog.id);
      dispatch({ type: ACTION_TYPES.ADD_CARE_LOG, payload: newCareLog });
      
      // BUG FIX #3: Sempre atualizar care_logs da planta no estado, não só para 'water'
      const plant = getPlantById(plantId);
      if (plant) {
        const updatedPlant = {
          ...plant,
          // Adicionar o novo care log ao array de care_logs
          care_logs: [newCareLog, ...(plant.care_logs || plant.careLogs || [])],
          // Atualizar last_watered apenas se for rega
          last_watered: careData.care_type === 'water' 
            ? (careData.care_date || new Date().toISOString())
            : plant.last_watered,
          // Resetar status se for rega
          status: careData.care_type === 'water' ? 'fine' : plant.status,
        };
        
        console.log('🔄 Atualizando planta com care log. Total de logs:', updatedPlant.care_logs?.length);
        dispatch({ type: ACTION_TYPES.UPDATE_PLANT, payload: updatedPlant });
      }
      
      // Add XP for care activity
      try {
        await userService.addXP(state.user.id, 5);
      } catch (xpError) {
        console.warn('⚠️ Erro ao adicionar XP:', xpError);
        // Não falhar o care log por erro de XP
      }
      
      showSuccessToast('Cuidado registrado com sucesso!');
      return newCareLog;
    } catch (error) {
      console.error('❌ Erro ao registrar cuidado:', error);
      try {
        logAndNotifyError(error, {
          context: 'AppContext.addCareLog',
          userMessage: 'Erro ao registrar cuidado',
          suggestion: 'Tente novamente',
        });
      } catch (e) {
        console.error('Erro ao notificar addCareLog error:', e);
      }
      throw error;
    }
  };

  // Post functions
  const loadPosts = async (category = 'all', limit = 20, offset = 0) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      const userId = session?.user?.id || state.user?.id;
      
      let posts;
      if (category === 'all') {
        posts = await postService.getAllPosts(limit, offset, userId);
      } else {
        posts = await postService.getPostsByCategory(category, limit, offset, userId);
      }
      
      dispatch({ type: ACTION_TYPES.SET_POSTS, payload: posts });
      return posts;
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      showErrorToast('Erro ao carregar posts da comunidade');
      return [];
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  const createPost = async (postData) => {
    try {
      // BUG FIX #1: Validação rigorosa de autenticação com session
      const userId = state.user?.id || session?.user?.id;
      if (!userId) {
        console.error('❌ No authenticated user found');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('📝 Creating post with userId:', userId);
      const newPost = await postService.createPost(userId, postData);
      
      // Verificar se post foi criado com sucesso
      if (!newPost) {
        throw new Error('Post não foi criado (retorno vazio do servidor)');
      }
      
      console.log('✅ Post created successfully:', newPost.id);
      
      // Add to local state
      dispatch({ type: ACTION_TYPES.SET_POSTS, payload: [newPost, ...state.posts] });
      
      showSuccessToast('Post criado com sucesso!');
      return newPost;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      try {
        logAndNotifyError(error, {
          context: 'AppContext.createPost',
          userMessage: 'Erro ao criar post',
          suggestion: 'Tente novamente ou verifique sua conexão',
        });
      } catch (e) {
        console.error('Erro ao notificar createPost error:', e);
      }
      throw error;
    }
  };

  const toggleLike = async (postId) => {
    try {
      const userId = session?.user?.id || state.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');
      
      // Find current post to get current state
      const currentPost = state.posts.find(post => post.id === postId);
      if (!currentPost) {
        throw new Error('Post não encontrado');
      }
      
      const result = await postService.toggleLike(userId, postId);
      
      // Update local state with safe counter logic
      const updatedPosts = state.posts.map(post => {
        if (post.id === postId) {
          const currentLikesCount = Math.max(0, post.likes_count || 0);
          const newLikesCount = result.liked 
            ? currentLikesCount + 1 
            : Math.max(0, currentLikesCount - 1);
          
          return {
            ...post,
            likes_count: newLikesCount,
            user_has_liked: result.liked
          };
        }
        return post;
      });
      
      dispatch({ type: ACTION_TYPES.SET_POSTS, payload: updatedPosts });
      return result;
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      showErrorToast('Erro ao curtir post');
      
      // Reload posts to sync with server state on error
      try {
        await loadPosts();
      } catch (reloadError) {
        console.error('❌ Error reloading posts:', reloadError);
      }
      
      throw error;
    }
  };

  const addComment = async (postId, text) => {
    try {
      const userId = session?.user?.id || state.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');
      
      const comment = await postService.addComment(userId, postId, text);
      
      // Update local state
      const updatedPosts = state.posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments_count: Math.max(0, (post.comments_count || 0) + 1)
          };
        }
        return post;
      });
      
      dispatch({ type: ACTION_TYPES.SET_POSTS, payload: updatedPosts });
      showSuccessToast('Comentário adicionado!');
      return comment;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      showErrorToast('Erro ao adicionar comentário');
      throw error;
    }
  };

  const getFilteredPosts = (filter = 'all') => {
    if (filter === 'all') {
      return state.posts;
    }
    return state.posts.filter(post => post.category === filter);
  };

  // Utility functions
  const getPlantsNeedingAttention = () => {
    return state.plants.filter((plant) => 
      plant.status === 'thirsty' || plant.status === 'attention'
    );
  };

  const refreshData = async () => {
    if (state.user?.id) {
      await loadUserData(state.user.id);
      await loadPosts(); // Também recarregar posts
    }
  };

  // Initialize user data if authenticated but no user data loaded
  const initializeUserData = async () => {
    if (session?.user && !state.user && !state.isLoading) {
      console.log('🚀 Initializing user data on demand...');
      await loadUserData(session.user.id);
      await loadPosts(); // Carregar posts também
    }
  };

  // Context value
  const contextValue = {
    // State
    ...state,
    session,

    // Auth functions
    signUp,
    signIn,
    signOut,
    updateUser,

    // Plant functions
    addPlant,
    updatePlant,
    deletePlant,
    getPlantById,

    // Care log functions
    addCareLog,

    // Post functions
    loadPosts,
    createPost,
    toggleLike,
    addComment,
    getFilteredPosts,

    // Utility functions
    getPlantsNeedingAttention,
    refreshData,
    loadUserData,
    initializeUserData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;