'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as cognito from '@/lib/cognito';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await cognito.forgotPassword(email);
      setSuccess(true);
      // 確認コード入力ページへ遷移（emailをクエリで渡す）
      setTimeout(() => router.push(`/auth/forgot-password/confirm?email=${encodeURIComponent(email)}`), 1500);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'パスワード再設定リクエストに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="page-shell">
        <section className="auth-card stack">
          <div className="stack">
            <h1 style={{ margin: 0 }}>確認コードを送信しました</h1>
            <p style={{ margin: 0, color: '#475569' }}>
              {email} に確認コードを送信しました。メールをご確認ください。
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="auth-card stack">
        <div className="stack">
          <h1 style={{ margin: 0 }}>パスワード再設定</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            登録済みのメールアドレスを入力してください。確認コードを送信します。
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '送信中...' : '確認コードを送信'}
          </Button>
        </form>
        <div className="auth-links">
          <Link href="/auth/login">ログインへ戻る</Link>
          <Link href="/auth/signup">新規登録へ</Link>
        </div>
      </section>
    </main>
  );
}
