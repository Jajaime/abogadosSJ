// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth.server';

export async function GET() {
  try {
    const session = await getSessionFromCookies(); // devuelve SessionInfo | null
    if (!session) {
      return NextResponse.json({ roles: [] }, { status: 200 });
    }
    return NextResponse.json({ roles: session.roles ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ roles: [] }, { status: 200 });
  }
}
