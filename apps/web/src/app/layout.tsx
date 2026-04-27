import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { appConfig } from '@/lib/config';
import { getCurrentAuthUser } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: appConfig.appName,
  description: 'AWS matching app MVP',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialUser = appConfig.authMode === 'supabase' ? await getCurrentAuthUser() : null;

  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </body>
    </html>
  );
}
