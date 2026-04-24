'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as appsync from '@/lib/appsync';
import * as cognito from '@/lib/cognito';
import { useAuth } from '@/providers/auth-provider';

export default function DiscoverPage() {
  const { user, signOut } = useAuth();
  const [viewer, setViewer] = useState<appsync.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMe = async () => {
      try {
        setError('');
        setIsLoading(true);
        const idToken = await cognito.getCurrentIdToken();
        const me = await appsync.me(idToken);
        if (!cancelled) {
          setViewer(me);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'プロフィール取得に失敗しました。');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="panel" style={{ width: 'min(100%, 720px)' }}>
        <div className="stack">
          <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>
            Protected route
          </span>
          <h1 style={{ margin: 0 }}>Discover</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            認証済みユーザーのみ入れる確認ページです。`ensureMe` 実行後に `me` で DynamoDB の状態を表示しています。
          </p>
          {isLoading ? <p style={{ margin: 0, color: '#475569' }}>読み込み中...</p> : null}
          {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
          <div className="panel" style={{ background: '#f8fafc' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify({ sessionUser: user, me: viewer }, null, 2)}</pre>
          </div>
          <div className="auth-links">
            <Link href="/profile/edit">プロフィール編集へ</Link>
            <Link href="/matches">マッチ一覧へ</Link>
            <Link href="/settings/safety">安全設定へ</Link>
          </div>
          <div>
            <Button onClick={() => signOut()}>ログアウト</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
