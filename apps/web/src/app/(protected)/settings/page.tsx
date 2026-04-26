'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30, paddingTop: 20 }}>
          <Link href="/discover">
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
            設定
          </h1>
          <div style={{ width: 40 }} />
        </div>

        {/* メニュー */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {/* プロフィール編集 */}
          <Link href="/settings/profile">
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>👤</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>プロフィール編集</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>名前、年齢、自己紹介など</div>
                </div>
              </div>
              <span style={{ color: '#9ca3af' }}>→</span>
            </div>
          </Link>

          {/* 安全設定 */}
          <Link href="/settings/safety">
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>安全とプライバシー</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>ブロック、通報など</div>
                </div>
              </div>
              <span style={{ color: '#9ca3af' }}>→</span>
            </div>
          </Link>

          {/* ログアウト */}
          <div
            onClick={handleSignOut}
            style={{
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🚪</span>
              <div>
                <div style={{ fontWeight: 600, color: '#ef4444' }}>ログアウト</div>
              </div>
            </div>
          </div>
        </div>

        {/* バージョン情報 */}
        <div style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
          Version 0.1.0
        </div>
      </div>
    </main>
  );
}
