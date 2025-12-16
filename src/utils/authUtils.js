/**
 * Utilitários de autenticação para garantir sessões válidas
 */

import { supabase } from '../services/supabase';

/**
 * Verifica se há uma sessão válida e retorna o usuário autenticado
 * @returns {Promise<{user: Object, session: Object}>}
 * @throws {Error} Se não houver usuário autenticado
 */
export const ensureAuthenticated = async () => {
  try {
    console.log('🔐 Verificando autenticação...');
    
    // Obter sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('❌ Nenhuma sessão ativa encontrada');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    // Verificar se o token não expirou
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.error('❌ Token expirado');
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    // Obter dados do usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError.message);
      throw new Error(`Erro de usuário: ${userError.message}`);
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado');
      throw new Error('Usuário não encontrado. Faça login novamente.');
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    
    return { user, session };
  } catch (error) {
    console.error('💥 Erro na verificação de autenticação:', error.message);
    throw error;
  }
};

/**
 * Força refresh do token se necessário
 * @returns {Promise<{user: Object, session: Object}>}
 */
export const refreshAuthIfNeeded = async () => {
  try {
    console.log('🔄 Verificando se refresh é necessário...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('Sessão inválida');
    }
    
    // Verificar se o token expira em menos de 5 minutos
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = session.expires_at - now;
    
    if (expiresIn < 300) { // 5 minutos
      console.log('🔄 Token expirando em breve, fazendo refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        throw new Error(`Erro no refresh: ${refreshError.message}`);
      }
      
      console.log('✅ Token refreshed com sucesso');
      return { user: refreshData.user, session: refreshData.session };
    }
    
    return await ensureAuthenticated();
  } catch (error) {
    console.error('💥 Erro no refresh de autenticação:', error.message);
    throw error;
  }
};

/**
 * Utilitário para executar operações que requerem autenticação
 * @param {Function} operation - Função a ser executada
 * @param {Object} options - Opções adicionais
 * @returns {Promise<any>}
 */
export const withAuth = async (operation, options = {}) => {
  const { retries = 1, refreshToken = true } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Verificar/refresh autenticação se necessário
      const { user, session } = refreshToken 
        ? await refreshAuthIfNeeded() 
        : await ensureAuthenticated();
      
      // Executar operação
      return await operation(user, session);
    } catch (error) {
      console.error(`❌ Tentativa ${attempt + 1} falhou:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};