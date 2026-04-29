'use client';

import { AuthGuard } from '@/components/auth-guard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/discover') return pathname === '/discover';
    if (path === '/matches') return pathname === '/matches';
    if (path === '/profile/edit') return pathname?.startsWith('/profile') || pathname?.startsWith('/settings');
    return false;
  };

  return (
    <AuthGuard>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* ナビゲーションバー */}
        <nav style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <Link
            href="/discover"
            prefetch={true}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              backgroundColor: isActive('/discover') ? '#3b82f6' : '#f1f5f9',
              color: isActive('/discover') ? 'white' : '#475569',
              fontWeight: 500,
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🔍</span>
            <span>Discover</span>
          </Link>
          <Link
            href="/matches"
            prefetch={true}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              backgroundColor: isActive('/matches') ? '#3b82f6' : '#f1f5f9',
              color: isActive('/matches') ? 'white' : '#475569',
              fontWeight: 500,
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>💕</span>
            <span>Likes</span>
          </Link>
          <Link
            href="/profile/edit"
            prefetch={true}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              backgroundColor: isActive('/profile/edit') ? '#3b82f6' : '#f1f5f9',
              color: isActive('/profile/edit') ? 'white' : '#475569',
              fontWeight: 500,
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>⚙️</span>
            <span>Profile</span>
          </Link>
        </nav>

        {/* メインコンテンツ */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
