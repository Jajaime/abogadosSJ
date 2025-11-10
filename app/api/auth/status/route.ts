import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth.server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await requireSession(); // lanza si no hay sesión
    return NextResponse.json({ ok: true, session }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}