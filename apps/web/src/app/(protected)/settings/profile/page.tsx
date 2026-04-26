'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as appsync from '@/lib/appsync';
import * as cognito from '@/lib/cognito';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ProfileData = {
  displayName: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  bio: string;
};

export default function ProfileEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    age: '',
    gender: '',
    bio: '',
  });

  // 初期ロード時にプロフィール取得
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const idToken = await cognito.getCurrentIdToken();
        const data = await appsync.myProfile(idToken);
        
        setProfile({
          displayName: data.displayName || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          bio: data.bio || '',
        });
        
        // プロフィールが未設定なら自動的に編集モードに
        if (!data.displayName) {
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('プロフィールの読み込みに失敗しました');
        // プロフィールが存在しない場合は編集モードに
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      // バリデーション
      if (!profile.displayName.trim()) {
        setError('名前を入力してください');
        return;
      }

      const age = parseInt(profile.age);
      if (profile.age && (isNaN(age) || age < 18 || age > 100)) {
        setError('年齢は18〜100の範囲で入力してください');
        return;
      }

      const idToken = await cognito.getCurrentIdToken();
      const input: appsync.UpdateProfileInput = {
        displayName: profile.displayName,
      };

      if (profile.age) {
        input.age = age;
      }
      if (profile.gender) {
        input.gender = profile.gender as 'MALE' | 'FEMALE' | 'OTHER';
      }
      if (profile.bio) {
        input.bio = profile.bio;
      }

      await appsync.updateMyProfile(input, idToken);
      
      setSuccessMessage('プロフィールを保存しました');
      setIsEditing(false);
      
      // 3秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: 18 }}>読み込み中...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingTop: 20 }}>
          <Link href="/settings">
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: 24,
                width: 40,
                height: 40,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ←
            </button>
          </Link>
          <h1 style={{ flex: 1, textAlign: 'center', color: 'white', fontSize: 24, fontWeight: 700, margin: 0 }}>
            プロフィール
          </h1>
          <div style={{ width: 40 }} />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* 成功メッセージ */}
        {successMessage && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            {successMessage}
          </div>
        )}

        {/* プロフィールフォーム */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {/* 名前 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
              名前 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <Input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              disabled={!isEditing}
              placeholder="山田太郎"
              style={{ width: '100%' }}
            />
          </div>

          {/* 年齢 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
              年齢
            </label>
            <Input
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              disabled={!isEditing}
              placeholder="25"
              min="18"
              max="100"
              style={{ width: '100%' }}
            />
          </div>

          {/* 性別 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
              性別
            </label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 16,
                background: isEditing ? 'white' : '#f9fafb',
                cursor: isEditing ? 'pointer' : 'not-allowed',
              }}
            >
              <option value="">選択してください</option>
              <option value="MALE">男性</option>
              <option value="FEMALE">女性</option>
              <option value="OTHER">その他</option>
            </select>
          </div>

          {/* 自己紹介 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
              自己紹介
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!isEditing}
              placeholder="あなたについて教えてください..."
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 16,
                resize: 'vertical',
                background: isEditing ? 'white' : '#f9fafb',
                cursor: isEditing ? 'text' : 'not-allowed',
              }}
            />
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: 12 }}>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                style={{ flex: 1 }}
              >
                編集する
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSave}
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
