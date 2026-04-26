'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as appsync from '@/lib/appsync';
import * as supabaseApi from '@/lib/supabase-api';
import * as cognito from '@/lib/cognito';
import { useAuth } from '@/providers/auth-provider';
import { isSupabaseEnabled } from '@/lib/config';

type UserProfile = {
  userId: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  photoUrl?: string;
};

export default function DiscoverPage() {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 初期ロード時にAPIからユーザーリストを取得
  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setError('');
        setIsLoading(true);
        
        let potentialMatches: UserProfile[];
        
        if (isSupabaseEnabled) {
          potentialMatches = await supabaseApi.listPotentialMatches(20);
        } else {
          const idToken = await cognito.getCurrentIdToken();
          potentialMatches = await appsync.listPotentialMatches(20, idToken);
        }
        
        if (!cancelled) {
          setUsers(potentialMatches);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'ユーザーの取得に失敗しました');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentUser = users[currentIndex];

  const handleSwipe = async (action: 'LIKE' | 'PASS') => {
    if (isAnimating || !currentUser) return;

    setIsAnimating(true);
    setSwipeDirection(action === 'LIKE' ? 'right' : 'left');

    // アニメーション後に次のユーザーへ
    setTimeout(async () => {
      try {
        let result;
        
        if (isSupabaseEnabled) {
          result = await supabaseApi.reactToUser(currentUser.userId, action);
        } else {
          const idToken = await cognito.getCurrentIdToken();
          result = await appsync.reactToUser(currentUser.userId, action, idToken);
        }
        
        console.log(`${action}: ${currentUser.displayName}`, result);
        
        if (result.matched) {
          alert(`🎉 ${currentUser.displayName}さんとマッチしました！`);
        }
        
        setCurrentIndex((prev) => prev + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        setIsAnimating(false);
        setSwipeDirection(null);
      }
    }, 300);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handleSwipe('PASS');
    } else if (e.key === 'ArrowRight') {
      handleSwipe('LIKE');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isAnimating]);

  // ローディング中
  if (isLoading) {
    return (
      <main className="page-shell" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <section style={{ width: 'min(100%, 480px)', padding: '20px', textAlign: 'center' }}>
          <div className="panel" style={{ padding: 40 }}>
            <h2 style={{ margin: 0, marginBottom: 16 }}>読み込み中...</h2>
            <p style={{ color: '#475569' }}>マッチング候補を取得しています</p>
          </div>
        </section>
      </main>
    );
  }

  // エラー表示
  if (error && users.length === 0) {
    return (
      <main className="page-shell" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <section style={{ width: 'min(100%, 480px)', padding: '20px' }}>
          <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
            <h2 style={{ margin: 0, marginBottom: 16, color: '#dc2626' }}>エラー</h2>
            <p style={{ color: '#475569', marginBottom: 24 }}>{error}</p>
            <Button onClick={() => window.location.reload()}>再読み込み</Button>
          </div>
        </section>
      </main>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <main className="page-shell">
        <section className="panel" style={{ width: 'min(100%, 480px)', textAlign: 'center' }}>
          <div className="stack">
            <h1 style={{ margin: 0, fontSize: 48 }}>🎉</h1>
            <h2 style={{ margin: 0 }}>全員チェックしました！</h2>
            <p style={{ color: '#475569' }}>新しいユーザーをまた後でチェックしてください。</p>
            <div className="auth-links" style={{ marginTop: 24 }}>
              <Link href="/matches">マッチ一覧へ</Link>
              <Link href="/profile/edit">プロフィール編集へ</Link>
            </div>
            <Button onClick={() => setCurrentIndex(0)} variant="secondary">
              もう一度見る
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <section style={{ width: 'min(100%, 480px)', padding: '20px' }}>
        <div className="stack">
          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ margin: 0, color: 'white', fontSize: 28 }}>Discover</h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/matches" style={{ color: 'white', fontSize: 14 }}>マッチ</Link>
              <Link href="/profile/edit" style={{ color: 'white', fontSize: 14 }}>設定</Link>
            </div>
          </div>

          {error && <p style={{ color: '#fecaca', background: '#7f1d1d', padding: 12, borderRadius: 8 }}>{error}</p>}

          {/* カードスタック */}
          <div style={{ position: 'relative', height: '600px' }}>
            {currentUser && (
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transition: swipeDirection ? 'all 0.3s ease-out' : 'none',
                  transform: swipeDirection === 'left' 
                    ? 'translateX(-150%) rotate(-30deg)' 
                    : swipeDirection === 'right'
                    ? 'translateX(150%) rotate(30deg)'
                    : 'translateX(0) rotate(0)',
                  opacity: swipeDirection ? 0 : 1,
                }}
              >
                <div
                  className="panel"
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* プロフィール写真 */}
                  <div
                    style={{
                      flex: 1,
                      backgroundImage: `url(${currentUser.photoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        padding: '40px 20px 20px',
                        color: 'white',
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
                        {currentUser.displayName}, {currentUser.age}
                      </h2>
                    </div>
                  </div>

                  {/* プロフィール情報 */}
                  <div style={{ padding: 20 }}>
                    <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                      {currentUser.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 次のカード（プレビュー） */}
            {users[currentIndex + 1] && (
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: 'scale(0.95)',
                  filter: 'brightness(0.7)',
                  zIndex: -1,
                }}
              >
                <div className="panel" style={{ height: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundImage: `url(${users[currentIndex + 1].photoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
            <button
              onClick={() => handleSwipe('PASS')}
              disabled={isAnimating}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '3px solid white',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: 32,
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isAnimating) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ✕
            </button>

            <button
              onClick={() => handleSwipe('LIKE')}
              disabled={isAnimating}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '3px solid white',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: 32,
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isAnimating) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ♡
            </button>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 12 }}>
            キーボードの←→でも操作できます
          </p>

          <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Link href="/settings">
              <button
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                ⚙️ 設定
              </button>
            </Link>
            <button
              onClick={() => signOut()}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
