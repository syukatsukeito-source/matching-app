'use client';

import Link from 'next/link';

export default function MatchesPage() {
  return (
    <main className="page-shell">
      <section className="panel" style={{ width: 'min(100%, 720px)' }}>
        <div className="stack">
          <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>
            Protected route
          </span>
          <h1 style={{ margin: 0 }}>マッチ一覧（準備中）</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            Phase 6 で `myMatches` をつないで一覧表示するページです。
          </p>
          <div className="auth-links">
            <Link href="/discover">Discover</Link>
            <Link href="/profile/edit">Profile Edit</Link>
            <Link href="/settings/safety">Safety</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
