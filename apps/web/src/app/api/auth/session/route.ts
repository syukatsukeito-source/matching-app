import { NextResponse } from 'next/server';
import { getCurrentAuthUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
