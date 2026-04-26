import { NextResponse } from 'next/server';
import { getAuthenticatedUser, mapProfileRow } from '@/lib/supabase-server';

export async function PATCH(request: Request) {
  try {
    const input = await request.json();
    const { supabase, user } = await getAuthenticatedUser();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.displayName !== undefined) {
      updateData.display_name = input.displayName;
      updateData.profile_completed = true;
      updateData.status = 'ACTIVE';
    }
    if (input.age !== undefined) updateData.age = input.age;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.bio !== undefined) updateData.bio = input.bio;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update profile');
    }

    return NextResponse.json({ profile: mapProfileRow(data) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'プロフィール更新に失敗しました' },
      { status: 400 },
    );
  }
}
