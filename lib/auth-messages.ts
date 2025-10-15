export const loginCodeToMessage: Record<string, string> = {
  unauthenticated: 'Tu sesión expiró o no has iniciado sesión.',
  refresh_failed: 'No se pudo renovar tu sesión. Por favor, inicia sesión nuevamente.',
  csrf: 'CSRF inválido. Intenta nuevamente o recarga la página.',
  oauth_error: 'Ocurrió un error al iniciar sesión con el proveedor.',
};

export const accessReasonToMessage: Record<string, string> = {
  forbidden: 'No tienes permisos para acceder a este recurso.',
  admin_only: 'Esta sección está limitada a administradores.',
  rbac_denied: 'Acceso denegado por las reglas de roles.',
};

export const errorCodeToMessage: Record<string, string> = {
  csrf: 'Solicitud bloqueada por CSRF.',
  token_invalid: 'Tu token no es válido.',
  session_invalid: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  unknown: 'Ocurrió un error inesperado.',
};
