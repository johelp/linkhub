// Why a sign-in link can fail, as short codes carried in /auth?error=<code>.
export type AuthFailure = 'expired' | 'verifier' | 'denied' | 'config' | 'callback'

/** Maps what Supabase / the code exchange tell us onto one of our codes. */
export function classifyAuthFailure(input: { error?: string | null; errorCode?: string | null; description?: string | null; message?: string | null }): AuthFailure {
  const text = `${input.errorCode ?? ''} ${input.error ?? ''} ${input.description ?? ''} ${input.message ?? ''}`.toLowerCase()
  if (/otp_expired|expired|invalid or has expired|already.*used/.test(text)) return 'expired'
  if (/code verifier|code_verifier|pkce|flow state/.test(text)) return 'verifier'
  if (/access_denied/.test(text)) return 'denied'
  return 'callback'
}

export const AUTH_FAILURE_MESSAGES: Record<AuthFailure, string> = {
  expired: 'El enlace ha caducado o ya se usó. Pide uno nuevo: solo funciona una vez y durante poco tiempo.',
  verifier: 'Abriste el enlace en un navegador distinto del que lo pidió (por ejemplo, desde la app del correo). Pide uno nuevo y ábrelo en el mismo navegador, o copia el enlace y pégalo allí.',
  denied: 'No se ha podido completar el acceso con ese enlace. Pide uno nuevo.',
  config: 'El acceso no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.',
  callback: 'El enlace no ha funcionado. Pide uno nuevo y ábrelo en el mismo navegador desde el que lo solicitas.',
}

export const isAuthFailure = (v: unknown): v is AuthFailure => typeof v === 'string' && v in AUTH_FAILURE_MESSAGES
