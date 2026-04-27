import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AuthUser } from '@/types/auth';

type ProfileRow = {
  user_id: string;
  email: string | null;
  status: 'PENDING_PROFILE' | 'ACTIVE' | 'BLOCKED';
  profile_completed: boolean;
  display_name: string | null;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  bio: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  max_distance_km: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Componentからは書き込めない場合がある
          }
        },
      },
    }
  );
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return { supabase, user };
}

export function mapProfileRow(row: ProfileRow) {
  return {
    userId: row.user_id,
    email: row.email || undefined,
    status: row.status,
    profileCompleted: row.profile_completed,
    displayName: row.display_name || undefined,
    age: row.age || undefined,
    gender: row.gender || undefined,
    bio: row.bio || undefined,
    photoUrl: row.photo_url || undefined,
    latitude: row.latitude || undefined,
    longitude: row.longitude || undefined,
    maxDistanceKm: row.max_distance_km || undefined,
    locationUpdatedAt: row.location_updated_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAuthUser(row: ProfileRow): AuthUser {
  return {
    userId: row.user_id,
    email: row.email || '',
    status: row.status,
    profileCompleted: row.profile_completed,
    createdAt: row.created_at,
  };
}

export async function ensureUserProfile(userId: string, email: string): Promise<ProfileRow> {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing && !existingError) {
    return existing as ProfileRow;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      email,
      status: 'PENDING_PROFILE',
      profile_completed: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProfileRow;
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    const ensured = await ensureUserProfile(user.id, user.email || '');
    return mapAuthUser(ensured);
  }

  return mapAuthUser(data as ProfileRow);
}
