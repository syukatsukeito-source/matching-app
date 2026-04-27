import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') ?? '20');
    const { supabase, user } = await getAuthenticatedUser();

    const { data: myProfile, error: myProfileError } = await supabase
      .from('user_profiles')
      .select('latitude, longitude, max_distance_km')
      .eq('user_id', user.id)
      .single();

    if (myProfileError) {
      throw new Error(myProfileError.message);
    }

    const { data: reactions } = await supabase
      .from('reactions')
      .select('to_user_id')
      .eq('from_user_id', user.id);

    const excludedIds = reactions?.map((reaction) => reaction.to_user_id) || [];

    let query = supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'ACTIVE')
      .eq('profile_completed', true)
      .neq('user_id', user.id)
      .limit(limit * 3);

    if (excludedIds.length > 0) {
      query = query.not('user_id', 'in', `(${excludedIds.join(',')})`);
    }

    if (
      myProfile?.latitude != null &&
      myProfile?.longitude != null &&
      myProfile?.max_distance_km != null
    ) {
      query = query
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .not('max_distance_km', 'is', null);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const users: Array<{
      userId: string;
      displayName: string;
      age?: number;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      bio?: string;
      photoUrl?: string;
      distanceKm?: number;
    }> = [];

    for (const profile of data || []) {
      let distanceKm: number | undefined;

      if (
        myProfile?.latitude != null &&
        myProfile?.longitude != null &&
        profile.latitude != null &&
        profile.longitude != null
      ) {
        distanceKm = calculateDistanceKm(myProfile.latitude, myProfile.longitude, profile.latitude, profile.longitude);
        if (myProfile.max_distance_km && distanceKm > myProfile.max_distance_km) continue;
        if (profile.max_distance_km && distanceKm > profile.max_distance_km) continue;
      }

      users.push({
        userId: profile.user_id,
        displayName: profile.display_name || '',
        age: profile.age || undefined,
        gender: profile.gender || undefined,
        bio: profile.bio || undefined,
        photoUrl: profile.photo_url || undefined,
        distanceKm,
      });

      if (users.length >= limit) break;
    }

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '候補取得に失敗しました' },
      { status: 400 },
    );
  }
}
