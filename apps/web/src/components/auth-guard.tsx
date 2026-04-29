'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import * as appsync from '@/lib/appsync';
import * as supabaseApi from '@/lib/supabase-api';
import * as cognito from '@/lib/cognito';
import { isSupabaseEnabled } from '@/lib/config';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (isLoading || !isAuthenticated) {
        return;
      }

      // 既にチェック済みの場合はスキップ（ページ遷移のたびに再チェックしない）
      if (hasCheckedProfile) {
        setIsCheckingProfile(false);
        return;
      }

      // プロフィール設定画面にいる場合はチェックしない
      if (pathname?.startsWith('/settings/profile') || pathname?.startsWith('/profile/edit')) {
        setIsCheckingProfile(false);
        setHasCheckedProfile(true);
        return;
      }

      try {
        if (isSupabaseEnabled) {
          // Supabaseモード: プロフィール完了状態を確認
          const profile = await supabaseApi.getMyProfile();
          
          if (!profile.profileCompleted) {
            // プロフィール未完了の場合は設定画面へリダイレクト
            router.replace('/profile/edit');
            return;
          }
        } else {
          // AWSモード: プロフィール完了状態を確認
          const idToken = await cognito.getCurrentIdToken();
          const viewer = await appsync.me(idToken);

          if (!viewer.profileCompleted) {
            // プロフィール未完了の場合は設定画面へリダイレクト
            router.replace('/profile/edit');
            return;
          }
        }

        setHasCheckedProfile(true);
        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Failed to check profile:', error);
        setHasCheckedProfile(true);
        setIsCheckingProfile(false);
      }
    };

    checkProfileAndRedirect();
  }, [isAuthenticated, isLoading, router, pathname, hasCheckedProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/discover')}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="page-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <div>認証状態を確認しています...</div>
        </div>
      </div>
    );
  }

  if (isCheckingProfile) {
    return (
      <div className="page-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>プロフィールを確認しています...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
