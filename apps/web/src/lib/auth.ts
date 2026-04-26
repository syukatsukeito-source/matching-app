import type { AuthUser, SignUpInput, ConfirmSignUpInput, SignInInput } from '@/types/auth';
import { appConfig } from './config';

type AuthResponse = {
  user: AuthUser;
  requiresEmailConfirmation?: boolean;
};

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? '認証リクエストに失敗しました');
  }

  return payload as T;
}

export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function confirmSignUp(input: ConfirmSignUpInput): Promise<AuthUser> {
  const result = await authRequest<{ user: AuthUser }>('/auth/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.user;
}

export async function signIn(input: SignInInput): Promise<AuthUser> {
  const result = await authRequest<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.user;
}

export async function signOut(): Promise<void> {
  await authRequest('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const result = await authRequest<{ user: AuthUser | null }>('/auth/session', {
    method: 'GET',
  });
  return result.user;
}
