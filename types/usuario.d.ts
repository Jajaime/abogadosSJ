// UsuarioDTO: lo que devuelves al frontend
export interface UsuarioDTO {
  id: string;
  email: string;
  name?: string;
  createdAt: string; // ISO string (ej: 2025-08-17T03:15:22.000Z)
}

// Para crear (request)
export interface CreateUsuarioDTO {
  email: string;
  name?: string;
}

// Para actualizar (request parcial)
export interface UpdateUsuarioDTO {
  email?: string;
  name?: string | null; // permite null si quieres “borrar” el nombre
}
