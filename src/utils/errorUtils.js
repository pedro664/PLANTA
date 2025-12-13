import { Platform } from 'react-native';
import { showErrorToast } from '../components/Toast';

/**
 * logAndNotifyError
 * - Registra detalhes técnicos no console
 * - Mostra uma mensagem amigável ao usuário via Toast
 * - Aceita um contexto para indicar onde o erro ocorreu
 */
export const logAndNotifyError = (error, { context = '', userMessage = 'Ocorreu um erro', suggestion = null } = {}) => {
  try {
    const msg = error && (error.message || error.msg || String(error)) || String(error);
    const code = error && (error.code || error.status || null);

    // Log técnico detalhado para debug
    console.error(`❗️ [${context}]`, { message: msg, code, error });

    // Mensagem curta e útil para o usuário
    let display = userMessage;
    if (suggestion) display += ` — ${suggestion}`;
    // Incluir um indicador leve do local para diagnóstico de suporte
    display += ` (local: ${context}${code ? ` • code:${code}` : ''})`;

    // Mostrar via Toast em todas as plataformas (Alert poderia ser usado para modal)
    showErrorToast(display);
  } catch (err) {
    console.error('Erro em logAndNotifyError:', err);
    try { showErrorToast('Erro desconhecido. Tente novamente.'); } catch (e) { /* swallow */ }
  }
};

export default { logAndNotifyError };
