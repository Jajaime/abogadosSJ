// lib/api-authz.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth.server';
import { can, type PermKey, hasAnyRole, type Role } from '@/lib/authz';

export type RequirePermResult =
  | { session: { userId: string; roles: string[] }; error?: undefined }
  | { error: NextResponse; session?: undefined };

export async function requirePerm(perm: PermKey): Promise<RequirePermResult> {
  const session = await requireSession().catch(() => null);
  if (!session) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (!can(session.roles, perm)) {
    return { error: NextResponse.json({ error: 'Prohibido' }, { status: 403 }) };
  }
  return { session };
}

// utilidad pequeña para saber si es rol "elevado"
const ELEVATED: readonly Role[] = ['admin', 'jefe_estudio'] as const;
export function isElevated(roles: string[] | undefined | null) {
  return hasAnyRole(roles, ELEVATED);
}
