import { supabase } from './supabase';
import type { AuthUser, SignUpInput, ConfirmSignUpInput, SignInInput } from '@/types/auth';

export async function signUp(input: SignUpInput): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('ユーザー作成に失敗しました');

  // メール確認が無効の場合、セッションが存在する
  console.log('Signup result:', { user: data.user, session: data.session });

  // usersテーブルにレコードを作成
  await ensureUserRecord(data.user.id, data.user.email || '');

  return {
    userId: data.user.id,
    email: data.user.email || '',
    status: 'PENDING_PROFILE',
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  };
}

export async function confirmSignUp(input: ConfirmSignUpInput): Promise<AuthUser> {
  // Supabaseの場合、メール内のリンクをクリックするか、OTPを使用
  const { data, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.code,
    type: 'email',
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('確認に失敗しました');

  // usersテーブルにレコードを作成
  await ensureUserRecord(data.user.id, data.user.email || '');

  return {
    userId: data.user.id,
    email: data.user.email || '',
    status: 'PENDING_PROFILE',
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  };
}

export async function signIn(input: SignInInput): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('ログインに失敗しました');

  // usersテーブルにレコードが存在することを確認
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    // レコードがなければ作成
    await ensureUserRecord(data.user.id, data.user.email || '');
    return {
      userId: data.user.id,
      email: data.user.email || '',
      status: 'PENDING_PROFILE',
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    userId: userData.id,
    email: userData.email || '',
    status: userData.status,
    profileCompleted: userData.profile_completed,
    createdAt: userData.created_at,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  // usersテーブルから情報取得
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !userData) {
    // レコードがなければ作成
    await ensureUserRecord(session.user.id, session.user.email || '');
    return {
      userId: session.user.id,
      email: session.user.email || '',
      status: 'PENDING_PROFILE',
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    userId: userData.id,
    email: userData.email || '',
    status: userData.status,
    profileCompleted: userData.profile_completed,
    createdAt: userData.created_at,
  };
}

async function ensureUserRecord(userId: string, email: string): Promise<void> {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      status: 'PENDING_PROFILE',
      profile_completed: false,
    }, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Failed to ensure user record:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    // 既存レコードのエラー以外はスロー
    if (error.code !== '23505') {
      throw new Error(`ユーザーレコードの作成に失敗: ${error.message || JSON.stringify(error)}`);
    }
  }
  console.log('User record ensured:', { userId, data });
}
