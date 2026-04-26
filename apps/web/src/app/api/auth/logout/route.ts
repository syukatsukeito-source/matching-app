import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ログアウトに失敗しました' },
      { status: 400 },
    );
  }
}
