'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { confirmSignUp } = useAuth();
  const [code, setCode] = useState('123456');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await confirmSignUp({ email, code });
      router.push('/discover');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '確認に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card stack">
        <div className="stack">
          <h1 style={{ margin: 0 }}>確認コード入力</h1>
          <p style={{ margin: 0, color: '#475569' }}>{email || '登録メールアドレス'} へ送ったコードを入力します。</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="確認コード" value={code} onChange={(event) => setCode(event.target.value)} required />
          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '確認中...' : '確認して続行'}</Button>
        </form>
        <div className="auth-links">
          <Link href="/auth/signup">登録に戻る</Link>
          <Link href="/auth/login">ログインへ</Link>
        </div>
      </section>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<main className="page-shell">読み込み中...</main>}>
      <ConfirmContent />
    </Suspense>
  );
}
