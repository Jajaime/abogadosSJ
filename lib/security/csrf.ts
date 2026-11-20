import 'server-only';
import { NextResponse } from 'next/server';
import { getCsrfTokenFromCookies } from '@/lib/auth.server';
import { CSRF_HEADER_NAME } from '@/lib/jwt-public';
import { csrfTokensMatch } from './csrf-check';

export async function exigirCsrf(
  request: Request
): Promise<NextResponse | null> {
  const cookieToken = await getCsrfTokenFromCookies();
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!csrfTokensMatch(cookieToken, headerToken)) {
    return NextResponse.json(
      { error: 'Token CSRF inválido' },
      { status: 403 }
    );
  }

  return null;
}
