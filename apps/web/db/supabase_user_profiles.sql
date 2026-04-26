-- ユーザープロフィールテーブル作成
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_PROFILE' CHECK (status IN ('PENDING_PROFILE', 'ACTIVE', 'BLOCKED')),
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  display_name TEXT,
  age INTEGER CHECK (age IS NULL OR (age >= 18 AND age <= 100)),
  gender TEXT CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')),
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 自動更新されるupdated_atトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除してから作成
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) を有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- RLSポリシー1: 自分のプロフィールは常に閲覧可能
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー2: 他のユーザーの公開プロフィールを閲覧可能（マッチング用）
CREATE POLICY "Users can view public profiles"
  ON user_profiles
  FOR SELECT
  USING (
    auth.uid() != user_id 
    AND profile_completed = TRUE 
    AND status = 'ACTIVE'
  );

-- RLSポリシー3: トリガーまたはユーザー自身がプロフィール挿入可能
CREATE POLICY "Allow profile insert"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- RLSポリシー4: 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー5: 自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_completed ON user_profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- サインアップ時に自動的にuser_profilesレコードを作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, status, profile_completed)
  VALUES (NEW.id, NEW.email, 'PENDING_PROFILE', FALSE);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 既にレコードが存在する場合は無視
    RETURN NEW;
  WHEN OTHERS THEN
    -- その他のエラーをログに記録（サインアップは成功させる）
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 既存のトリガーを削除してから作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- コメント追加
COMMENT ON TABLE user_profiles IS 'ユーザープロフィール情報を管理するテーブル';
COMMENT ON COLUMN user_profiles.user_id IS 'Supabase Auth のユーザーID';
COMMENT ON COLUMN user_profiles.status IS 'ユーザーステータス: PENDING_PROFILE（未設定）, ACTIVE（アクティブ）, BLOCKED（ブロック済み）';
COMMENT ON COLUMN user_profiles.profile_completed IS 'プロフィール設定完了フラグ';
