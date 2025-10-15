/**
 * Construye la URL pública de un asset bajo /public
 * Ej: asset('/demo/images/error/asset-error.svg')
 */
export function asset(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}
