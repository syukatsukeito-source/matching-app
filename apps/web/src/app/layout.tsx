import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { appConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: appConfig.appName,
  description: 'AWS matching app MVP',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
