'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, ConfirmSignUpInput, SignInInput, SignUpInput } from '@/types/auth';
import { isMockAuthEnabled, isSupabaseEnabled } from '@/lib/config';
import * as cognito from '@/lib/cognito';
import * as appsync from '@/lib/appsync';
import * as supabaseAuth from '@/lib/auth';

type AuthContextValue = {
  isLoading: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signUp: (input: SignUpInput) => Promise<AuthUser>;
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<AuthUser>;
  signIn: (input: SignInInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PENDING_SIGNUP_KEY = 'matching-app.pending-signup';

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clearKey(key: string) {
  window.localStorage.removeItem(key);
}

// mock モード用ヘルパー
function buildMockUser(email: string): AuthUser {
  return {
    userId: `mock-${email}`,
    email,
    status: 'PENDING_PROFILE',
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  };
}

function toAuthUser(viewer: appsync.Viewer): AuthUser {
  return {
    userId: viewer.userId,
    email: viewer.email ?? '',
    status: viewer.status,
    profileCompleted: viewer.profileCompleted,
    createdAt: viewer.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  // 起動時: セッションを復元
  useEffect(() => {
    if (isMockAuthEnabled) {
      setIsLoading(false);
      return;
    }
    
    if (isSupabaseEnabled) {
      supabaseAuth.getCurrentUser()
        .then((user) => setUser(user))
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
      return;
    }

    cognito.getCurrentSession()
      .then(async (session) => {
        const idToken = cognito.getIdToken(session);
        const viewer = await appsync.ensureMe(idToken);
        setUser(toAuthUser(viewer));
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      isAuthenticated: Boolean(user),

      async signUp(input: SignUpInput) {
        if (isMockAuthEnabled) {
          const nextUser = buildMockUser(input.email);
          setUser(nextUser);
          return nextUser;
        }
        if (isSupabaseEnabled) {
          const user = await supabaseAuth.signUp(input);
          setUser(user);
          return user;
        }
        await cognito.signUp(input.email, input.password);
        writeJson(PENDING_SIGNUP_KEY, { email: input.email });
        const nextUser = buildMockUser(input.email);
        setUser(nextUser);
        return nextUser;
      },

      async confirmSignUp(input: ConfirmSignUpInput) {
        if (isMockAuthEnabled) {
          if (!input.code.trim()) throw new Error('確認コードを入力してください。');
          const pending = readJson<SignUpInput>(PENDING_SIGNUP_KEY);
          const email = pending?.email ?? input.email;
          const nextUser = buildMockUser(email);
          clearKey(PENDING_SIGNUP_KEY);
          setUser(nextUser);
          return nextUser;
        }
        if (isSupabaseEnabled) {
          const user = await supabaseAuth.confirmSignUp(input);
          setUser(user);
          return user;
        }
        await cognito.confirmSignUp(input.email, input.code);
        clearKey(PENDING_SIGNUP_KEY);
        // 確認後はログインページへ誘導するためユーザーは未セット
        return { userId: '', email: input.email, status: 'PENDING_PROFILE', profileCompleted: false, createdAt: '' };
      },

      async signIn(input: SignInInput) {
        if (isMockAuthEnabled) {
          const nextUser = buildMockUser(input.email);
          setUser(nextUser);
          return nextUser;
        }
        if (isSupabaseEnabled) {
          const user = await supabaseAuth.signIn(input);
          setUser(user);
          return user;
        }
        const session = await cognito.signIn(input.email, input.password);
        const idToken = cognito.getIdToken(session);
        const viewer = await appsync.ensureMe(idToken);
        const nextUser: AuthUser = toAuthUser(viewer);
        setUser(nextUser);
        return nextUser;
      },

      async signOut() {
        if (isMockAuthEnabled) {
          setUser(null);
          return;
        }
        if (isSupabaseEnabled) {
          await supabaseAuth.signOut();
          setUser(null);
          return;
        }
        cognito.signOut();
        setUser(null);
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
