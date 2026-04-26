import { NextResponse } from 'next/server';
import { createClient, ensureUserProfile } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? '確認に失敗しました');
    }

    const profile = await ensureUserProfile(data.user.id, data.user.email || email);

    return NextResponse.json({
      user: {
        userId: profile.user_id,
        email: profile.email || '',
        status: profile.status,
        profileCompleted: profile.profile_completed,
        createdAt: profile.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '確認に失敗しました' },
      { status: 400 },
    );
  }
}
