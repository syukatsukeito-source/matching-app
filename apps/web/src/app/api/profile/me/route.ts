import { NextResponse } from 'next/server';
import { getAuthenticatedUser, mapProfileRow } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Profile not found');
    }

    return NextResponse.json({ profile: mapProfileRow(data) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'プロフィール取得に失敗しました' },
      { status: 401 },
    );
  }
}
