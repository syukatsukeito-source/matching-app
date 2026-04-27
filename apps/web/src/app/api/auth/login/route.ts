import { NextResponse } from 'next/server';
import { createClient, ensureUserProfile, mapAuthUser } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'ログインに失敗しました');
    }

    const profile = await ensureUserProfile(data.user.id, data.user.email || email);
    return NextResponse.json({ user: mapAuthUser(profile) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ログインに失敗しました' },
      { status: 400 },
    );
  }
}
