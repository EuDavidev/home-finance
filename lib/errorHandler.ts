/**
 * Error handling padronizado para o Home Finance.
 * - Mensagens amigáveis em PT-BR
 * - Logging seguro (apenas em __DEV__)
 * - Detecção de erros de rede
 */

import type { AppError } from "@/types";

interface PostgrestError {
  message: string;
  code: string;
  details?: string;
  hint?: string;
}

interface AuthError {
  message: string;
  status?: number;
}

/** Mapeia códigos de erro do Supabase para mensagens amigáveis */
const ERROR_MESSAGES: Record<string, string> = {
  "23505": "Este registro já existe.",
  "23503": "Registro referenciado não encontrado.",
  "42501": "Você não tem permissão para esta ação.",
  PGRST116: "Registro não encontrado.",
  PGRST301: "Tempo limite excedido. Tente novamente.",
  "23514": "Dados inválidos. Verifique os campos.",
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Confirme seu email antes de entrar.",
  "User already registered": "Este email já está registrado.",
  "Password should be at least 6 characters":
    "A senha deve ter pelo menos 6 caracteres.",
  "Email rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos.",
};

/**
 * Converte erro do Supabase (Postgrest) em mensagem amigável
 */
export function handleSupabaseError(error: PostgrestError): AppError {
  devLog("Supabase error:", error);

  const friendlyMessage =
    ERROR_MESSAGES[error.code] ??
    error.message ??
    "Ocorreu um erro inesperado.";

  return {
    message: friendlyMessage,
    code: error.code,
    isNetwork: false,
  };
}

/**
 * Converte erro de autenticação em mensagem amigável
 */
export function handleAuthError(error: AuthError): AppError {
  devLog("Auth error:", error);

  const friendlyMessage =
    AUTH_ERROR_MESSAGES[error.message] ??
    "Erro de autenticação. Tente novamente.";

  return {
    message: friendlyMessage,
    isNetwork: false,
  };
}

/**
 * Verifica se um erro é de rede (sem conexão)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("aborted")
    );
  }
  return false;
}

/**
 * Converte qualquer erro em AppError
 */
export function toAppError(error: unknown): AppError {
  if (isNetworkError(error)) {
    return {
      message: "Sem conexão com a internet. Verifique sua rede.",
      isNetwork: true,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  ) {
    return handleSupabaseError(error as PostgrestError);
  }

  return { message: "Ocorreu um erro inesperado." };
}

/**
 * Log seguro — só executa em desenvolvimento
 */
export function devLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log("[HomeFinance]", ...args);
  }
}

/**
 * Error log seguro — só executa em desenvolvimento
 */
export function devError(...args: unknown[]): void {
  if (__DEV__) {
    console.error("[HomeFinance]", ...args);
  }
}
