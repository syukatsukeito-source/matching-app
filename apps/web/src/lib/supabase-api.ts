import { isSupabaseEnabled } from './config';
import { appConfig } from './config';

export type MyProfile = {
  userId: string;
  email?: string;
  status: 'PENDING_PROFILE' | 'ACTIVE' | 'BLOCKED';
  profileCompleted: boolean;
  displayName?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  locationUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  photoUrl?: string;
  distanceKm?: number; // 自分からの距離
};

export type UpdateProfileInput = {
  displayName?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
};

export type UpdateLocationInput = {
  latitude: number;
  longitude: number;
  maxDistanceKm?: number;
};

export type ReactionResult = {
  success: boolean;
  matched: boolean;
  targetUserId: string;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? 'API request failed');
  }

  return payload as T;
}

export async function getMyProfile(): Promise<MyProfile> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const result = await apiRequest<{ profile: MyProfile }>('/profile/me');
  return result.profile;
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<MyProfile> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const result = await apiRequest<{ profile: MyProfile }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.profile;
}

export async function updateLocation(input: UpdateLocationInput): Promise<void> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  await apiRequest('/profile/location', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listPotentialMatches(limit: number): Promise<UserProfile[]> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const result = await apiRequest<{ users: UserProfile[] }>(`/matches/potential?limit=${limit}`);
  return result.users;
}

export async function reactToUser(
  targetUserId: string,
  action: 'LIKE' | 'PASS'
): Promise<ReactionResult> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const result = await apiRequest<{ result: ReactionResult }>('/matches/reactions', {
    method: 'POST',
    body: JSON.stringify({ targetUserId, action }),
  });
  return result.result;
}
