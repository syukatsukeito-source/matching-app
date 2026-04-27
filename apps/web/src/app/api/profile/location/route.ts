import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const { supabase, user } = await getAuthenticatedUser();
    const updateData: Record<string, unknown> = {
      latitude: input.latitude,
      longitude: input.longitude,
      location_updated_at: new Date().toISOString(),
    };

    if (input.maxDistanceKm !== undefined) {
      updateData.max_distance_km = input.maxDistanceKm;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '位置情報更新に失敗しました' },
      { status: 400 },
    );
  }
}
