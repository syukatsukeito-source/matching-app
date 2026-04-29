'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as appsync from '@/lib/appsync';
import * as supabaseApi from '@/lib/supabase-api';
import * as cognito from '@/lib/cognito';
import { isSupabaseEnabled } from '@/lib/config';

export default function ProfileEditPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const input = {
        displayName: displayName.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
        bio: bio.trim() || undefined,
      };

      if (isSupabaseEnabled) {
        await supabaseApi.updateMyProfile(input);
      } else {
        const idToken = await cognito.getCurrentIdToken();
        await appsync.updateMyProfile(input, idToken);
      }

      router.push('/discover');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'プロフィール更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel" style={{ width: 'min(100%, 720px)' }}>
        <div className="stack">
          <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>
            Phase 1
          </span>
          <h1 style={{ margin: 0 }}>プロフィール編集</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            プロフィール情報を入力してください。
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="表示名"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: 太郎"
            required
          />
          <Input
            label="年齢"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例: 25"
            min="18"
            max="100"
          />
          <div className="stack">
            <label htmlFor="gender" style={{ fontSize: 14, fontWeight: 500 }}>
              性別 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: 14,
                fontFamily: 'inherit',
                backgroundColor: 'white',
              }}
            >
              <option value="">選択してください</option>
              <option value="MALE">男性</option>
              <option value="FEMALE">女性</option>
              <option value="OTHER">その他</option>
            </select>
          </div>
          <div className="stack">
            <label htmlFor="bio" style={{ fontSize: 14, fontWeight: 500 }}>
              自己紹介
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="趣味や好きなことを書いてください"
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : 'プロフィールを保存'}
          </Button>
        </form>
      </section>
    </main>
  );
}
