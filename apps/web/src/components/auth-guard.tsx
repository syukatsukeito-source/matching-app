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

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (isLoading || !isAuthenticated) {
        return;
      }

      // プロフィール設定画面にいる場合はチェックしない
      if (pathname.startsWith('/settings/profile')) {
        setIsCheckingProfile(false);
        return;
      }

      try {
        if (isSupabaseEnabled) {
          // Supabaseモード: プロフィール完了状態を確認
          const profile = await supabaseApi.getMyProfile();
          
          if (!profile.profileCompleted) {
            // プロフィール未完了の場合は設定画面へリダイレクト
            router.replace('/settings/profile');
            return;
          }
        } else {
          // AWSモード: プロフィール完了状態を確認
          const idToken = await cognito.getCurrentIdToken();
          const viewer = await appsync.me(idToken);

          if (!viewer.profileCompleted) {
            // プロフィール未完了の場合は設定画面へリダイレクト
            router.replace('/settings/profile');
            return;
          }
        }

        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Failed to check profile:', error);
        setIsCheckingProfile(false);
      }
    };

    checkProfileAndRedirect();
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || isCheckingProfile) {
    return <div className="page-shell">認証状態を確認しています...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
