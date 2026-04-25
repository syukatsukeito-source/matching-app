import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
  ISignUpResult,
} from 'amazon-cognito-identity-js';
import { appConfig, isSupabaseEnabled } from './config';

// Supabaseモードの場合は適切な形式のダミー値を使う
const userPool = new CognitoUserPool({
  UserPoolId: isSupabaseEnabled ? 'ap-northeast-1_dummypool' : (appConfig.cognito.userPoolId || 'ap-northeast-1_dummypool'),
  ClientId: isSupabaseEnabled ? '1234567890abcdefghijklmnop' : (appConfig.cognito.userPoolClientId || '1234567890abcdefghijklmnop'),
});

// ユーザー登録
export function signUp(email: string, password: string): Promise<ISignUpResult> {
  return new Promise((resolve, reject) => {
    const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })];
    userPool.signUp(email, password, attributes, [], (err, result) => {
      if (err || !result) return reject(err ?? new Error('signUp failed'));
      resolve(result);
    });
  });
}

//確認コード入力
export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
//ログイン
export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut(): void {
  const user = userPool.getCurrentUser();
  user?.signOut();
}
//セッション取得
export function getCurrentSession(): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error('ログインしていません'));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) return reject(err ?? new Error('セッションなし'));
      resolve(session);
    });
  });
}

export function getCurrentEmail(): string | null {
  return userPool.getCurrentUser()?.getUsername() ?? null;
}
//IDトークン取得
export function getIdToken(session: CognitoUserSession): string {
  return session.getIdToken().getJwtToken();
}

export async function getCurrentIdToken(): Promise<string> {
  const session = await getCurrentSession();
  return getIdToken(session);
}

// パスワード再設定: 確認コード送信
export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

// パスワード再設定: 新しいパスワード設定
export function confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}
