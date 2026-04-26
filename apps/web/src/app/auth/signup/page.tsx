'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signUp({ email, password });
      router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '登録に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card stack">
        <div className="stack">
          <h1 style={{ margin: 0 }}>新規登録</h1>
          <p style={{ margin: 0, color: '#475569' }}>Cognito に置き換える前の Phase 1 フローです。</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="メールアドレス" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="パスワード" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '登録中...' : '登録する'}</Button>
        </form>
        <div className="auth-links">
          <Link href="/auth/login">ログインへ</Link>
        </div>
      </section>
    </main>
  );
}
