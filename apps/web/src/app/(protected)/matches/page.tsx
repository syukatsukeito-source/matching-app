'use client';

export default function MatchesPage() {
  return (
    <main className="page-shell">
      <section className="panel" style={{ width: 'min(100%, 720px)' }}>
        <div className="stack">
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 48 }}>💕</h1>
            <h2 style={{ margin: 0, marginTop: 16 }}>いいね一覧</h2>
            <p style={{ margin: 0, marginTop: 8, color: '#475569' }}>
              あなたにいいねを送った人、マッチした人が表示されます。
            </p>
            <p style={{ margin: 0, marginTop: 16, color: '#94a3b8', fontSize: 14 }}>
              ※ Phase 6 で実装予定の機能です
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
