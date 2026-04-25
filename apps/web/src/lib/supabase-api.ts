import { supabase } from './supabase';
import { isSupabaseEnabled } from './config';

export type UserProfile = {
  userId: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  photoUrl?: string;
};

export type UpdateProfileInput = {
  displayName?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
};

export type ReactionResult = {
  success: boolean;
  matched: boolean;
  targetUserId: string;
};

// Supabase版: マッチング候補取得
export async function listPotentialMatches(limit: number): Promise<UserProfile[]> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 自分が既にリアクションしたユーザーIDを取得
  const { data: reactions } = await supabase
    .from('reactions')
    .select('to_user_id')
    .eq('from_user_id', user.id);

  const excludedIds = reactions?.map(r => r.to_user_id) || [];

  // 自分以外で、まだリアクションしていないユーザーを取得
  let query = supabase
    .from('users')
    .select('id, display_name, age, gender, bio, photo_url')
    .eq('status', 'ACTIVE')
    .eq('profile_completed', true)
    .neq('id', user.id)
    .limit(limit);

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data || []).map(u => ({
    userId: u.id,
    displayName: u.display_name || '',
    age: u.age || undefined,
    gender: u.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
    bio: u.bio || undefined,
    photoUrl: u.photo_url || undefined,
  }));
}

// Supabase版: いいね/パス
export async function reactToUser(
  targetUserId: string,
  action: 'LIKE' | 'PASS'
): Promise<ReactionResult> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // リアクションを保存
  const { error: reactionError } = await supabase
    .from('reactions')
    .insert({
      from_user_id: user.id,
      to_user_id: targetUserId,
      action,
    });

  if (reactionError) throw new Error(reactionError.message);

  // LIKEの場合、相手も自分にLIKEしているかチェック
  let matched = false;
  if (action === 'LIKE') {
    const { data: reciprocalLike } = await supabase
      .from('reactions')
      .select('*')
      .eq('from_user_id', targetUserId)
      .eq('to_user_id', user.id)
      .eq('action', 'LIKE')
      .single();

    if (reciprocalLike) {
      matched = true;
      // マッチングテーブルに登録
      const [userId1, userId2] = [user.id, targetUserId].sort();
      await supabase
        .from('matches')
        .insert({
          user1_id: userId1,
          user2_id: userId2,
        });
    }
  }

  return {
    success: true,
    matched,
    targetUserId,
  };
}

// Supabase版: プロフィール更新
export async function updateMyProfile(input: UpdateProfileInput): Promise<void> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({
      display_name: input.displayName,
      age: input.age,
      gender: input.gender,
      bio: input.bio,
      profile_completed: true,
      status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}
