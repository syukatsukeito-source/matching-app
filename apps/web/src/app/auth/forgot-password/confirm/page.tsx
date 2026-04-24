'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as cognito from '@/lib/cognito';

function ConfirmPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (newPassword.length < 8) {
      setError('パスワードは8文字以上で設定してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      await cognito.confirmPassword(email, code, newPassword);
      alert('パスワードを再設定しました。ログインページへ移動します。');
      router.push('/auth/login');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'パスワード再設定に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card stack">
        <div className="stack">
          <h1 style={{ margin: 0 }}>新しいパスワードを設定</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            メールに送信された確認コードと、新しいパスワードを入力してください。
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
          <Input
            label="確認コード"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="6桁のコード"
            required
          />
          <Input
            label="新しいパスワード"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="8文字以上"
            required
          />
          <Input
            label="パスワード（確認）"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="もう一度入力"
            required
          />
          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '設定中...' : 'パスワードを再設定'}
          </Button>
        </form>
        <div className="auth-links">
          <Link href="/auth/forgot-password">コードを再送信</Link>
          <Link href="/auth/login">ログインへ戻る</Link>
        </div>
      </section>
    </main>
  );
}

export default function ConfirmPasswordPage() {
  return (
    <Suspense fallback={<main className="page-shell">読み込み中...</main>}>
      <ConfirmPasswordContent />
    </Suspense>
  );
}
