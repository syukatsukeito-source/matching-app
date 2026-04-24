# matching-app

AWS 前提のマッチングアプリ MVP を段階実装するためのモノレポです。

## 構成

- `apps/web`: Next.js フロントエンド
- `backend`: Go Lambda 実装
- `infra`: AWS CDK (TypeScript) インフラ
- `api`: AppSync GraphQL スキーマ

## まずやること

1. `cp .env.example .env.local`
2. ルートで `npm install`
3. フロントを起動: `npm run dev:web`
4. Go を入れて `backend/dist/ensure-me/bootstrap` をビルド
5. インフラ依存を入れて `npm run synth:infra`

```bash
cd backend
go mod tidy
GOOS=linux GOARCH=arm64 go build -o ../backend/dist/ensure-me/bootstrap ./cmd/ensure-me
```

## 現在の実装範囲

- Phase 1 開始用の認証画面雛形
- 認証ガード付きの protected ルート
- `ensureMe` GraphQL スキーマと Go Lambda 雛形
- Cognito / AppSync / Users テーブル / S3 バケットの CDK 雛形
- Go 未導入環境でも `cdk synth` できるように仮 `bootstrap` を同梱

## 次の実装候補

- Cognito 実クライアントの接続
- `ensureMe` を AppSync Lambda Resolver に接続
- `me` Query と `Users` 読み出し追加
