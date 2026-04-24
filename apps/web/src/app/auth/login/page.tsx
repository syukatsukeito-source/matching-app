'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const next = searchParams.get('next') ?? '/profile/edit';
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      router.push(next);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'ログインに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card stack">
        <div className="stack">
          <h1 style={{ margin: 0 }}>ログイン</h1>
          <p style={{ margin: 0, color: '#475569' }}>保護ページ遷移とセッション保持の確認用です。</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="メールアドレス" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="パスワード" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'ログイン中...' : 'ログイン'}</Button>
        </form>
        <div className="auth-links">
          <Link href="/auth/signup">新規登録へ</Link>
          <Link href="/auth/forgot-password">パスワード再設定</Link>
          <Link href="/">トップへ</Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page-shell">読み込み中...</main>}>
      <LoginContent />
    </Suspense>
  );
}
