import Link from 'next/link';
import { appConfig, isMockAuthEnabled } from '@/lib/config';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel" style={{ width: 'min(100%, 720px)' }}>
        <div className="stack">
          <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>
            Phase 1 scaffold
          </span>
          <h1 style={{ fontSize: 36, margin: 0 }}>{appConfig.appName}</h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            認証、保護ルート、AppSync / Go Lambda / CDK の土台をまとめた初期セットです。
            現在は {isMockAuthEnabled ? 'mock auth' : 'Cognito'} モードです。
          </p>
          <div className="auth-links">
            <Link href="/auth/signup">新規登録</Link>
            <Link href="/auth/login">ログイン</Link>
            <Link href="/profile/edit">ログイン後の遷移先</Link>
            <Link href="/discover">保護ページを確認</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
