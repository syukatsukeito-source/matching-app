export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'matching-app',
  authMode: process.env.NEXT_PUBLIC_AUTH_MODE ?? 'mock',
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '',
    userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? '',
    region: process.env.NEXT_PUBLIC_COGNITO_REGION ?? 'ap-northeast-1',
  },
  appSync: {
    url: process.env.NEXT_PUBLIC_APPSYNC_URL ?? '',
    region: process.env.NEXT_PUBLIC_APPSYNC_REGION ?? 'ap-northeast-1',
    authType: process.env.NEXT_PUBLIC_APPSYNC_AUTH_TYPE ?? 'AMAZON_COGNITO_USER_POOLS',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
} as const;

export const isMockAuthEnabled = appConfig.authMode === 'mock';
export const isSupabaseEnabled = appConfig.authMode === 'supabase';
