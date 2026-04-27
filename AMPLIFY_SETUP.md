# AWS Amplify Hosting セットアップ手順

## 1️⃣ AWS Amplify Console でアプリ作成

### ブラウザで以下にアクセス：
https://ap-northeast-1.console.aws.amazon.com/amplify/home?region=ap-northeast-1#/create

---

## 2️⃣ リポジトリ接続

1. **「GitHub」を選択**
2. **「Authorize AWS Amplify」** をクリック（初回のみ）
3. リポジトリを選択：
   ```
   syukatsukeito-source/matching-app
   ```
4. ブランチを選択：
   ```
   demo-matching1
   ```

---

## 3️⃣ ビルド設定

### amplify.yml の確認
自動検出されます（apps/web/amplify.yml）

### App root directory:
```
apps/web
```

### 環境変数を追加（Environment variables）:

| キー | 値 |
|------|-----|
| `NEXT_PUBLIC_APP_NAME` | `matching-app` |
| `NEXT_PUBLIC_AUTH_MODE` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wdcxanuehxuqxcwasoow.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3hhbnVlaHh1cXhjd2Fzb293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTExOTIsImV4cCI6MjA5MjY2NzE5Mn0.r21yyNILd-q6Erj_7oJjkMjSXtrhrHDarBX0OiIE_9o` |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` |

---

## 4️⃣ 詳細設定

### Platform を確認：
- ✅ **WEB_COMPUTE** が選択されていることを確認

### Monorepo detection:
- ✅ **Enable** にチェック
- **Root directory**: `apps/web`

---

## 5️⃣ 確認して保存

「Save and deploy」をクリック

---

## 6️⃣ ビルド完了を待つ

初回ビルドには5〜10分かかります。

ステータスが「Deployed」になったら、URLにアクセス：
```
https://demo-matching1.xxxxx.amplifyapp.com
```

---

## 7️⃣ WAF関連付け（次のステップ）

デプロイ完了後、以下のコマンドでWAFを関連付けます：

```bash
# Amplify App IDを取得
aws amplify list-apps --region ap-northeast-1

# WAF ARNを取得
cd /home/keitofujimoto/projects/matching-app/infra
cdk deploy --outputs-file outputs.json

# WAFを関連付け
aws amplify update-app \
  --app-id <AMPLIFY_APP_ID> \
  --enable-auto-branch-creation \
  --region ap-northeast-1
```

---

## 📝 トラブルシューティング

### ビルドエラーの場合：
1. Amplify Console → Build logs を確認
2. 環境変数が正しく設定されているか確認
3. Node.js バージョンを確認（18以上必要）

### middleware.ts エラーの場合：
- Platform が **WEB_COMPUTE** になっているか確認
- Static site (SSG) モードだと middleware は動作しません
