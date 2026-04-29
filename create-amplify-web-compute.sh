#!/bin/bash

# GitHub Personal Access Token を環境変数に設定してください
# export GITHUB_TOKEN="your_github_personal_access_token"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set"
  echo "Create a GitHub Personal Access Token here:"
  echo "https://github.com/settings/tokens/new"
  echo "Required scopes: repo, admin:repo_hook"
  echo ""
  echo "Then run: export GITHUB_TOKEN='your_token_here'"
  exit 1
fi

echo "Creating Amplify app with WEB_COMPUTE platform..."

aws amplify create-app \
  --name matching-app \
  --platform WEB_COMPUTE \
  --repository https://github.com/syukatsukeito-source/matching-app \
  --access-token "$GITHUB_TOKEN" \
  --enable-branch-auto-build \
  --region ap-northeast-1 \
  --output json > /tmp/amplify-app.json

APP_ID=$(cat /tmp/amplify-app.json | grep -o '"appId": "[^"]*' | cut -d'"' -f4)

echo "App created with ID: $APP_ID"
echo "Creating branch..."

aws amplify create-branch \
  --app-id "$APP_ID" \
  --branch-name demo-matching1 \
  --region ap-northeast-1 \
  --enable-auto-build

echo "Setting environment variables..."

aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name demo-matching1 \
  --framework 'Next.js - SSR' \
  --stage PRODUCTION \
  --region ap-northeast-1

# 環境変数を設定
aws amplify update-app \
  --app-id "$APP_ID" \
  --environment-variables \
    AMPLIFY_MONOREPO_APP_ROOT=apps/web,NEXT_PUBLIC_APP_NAME=matching-app,NEXT_PUBLIC_AUTH_MODE=supabase,NEXT_PUBLIC_SUPABASE_URL=https://wdcxanuehxuqxcwasoow.supabase.co,NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3hhbnVlaHh1cXhjd2Fzb293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTExOTIsImV4cCI6MjA5MjY2NzE5Mn0.r21yyNILd-q6Erj_7oJjkMjSXtrhrHDarBX0OiIE_9o,NEXT_PUBLIC_API_BASE_URL=/api \
  --region ap-northeast-1

# App root directoryを設定
aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name demo-matching1 \
  --display-name demo-matching1 \
  --description "Demo branch for matching app" \
  --region ap-northeast-1 \
  --build-spec "$(cat apps/web/amplify.yml)" \
  --enable-auto-build

echo ""
echo "✅ Amplify app created successfully!"
echo "App ID: $APP_ID"
echo "Console URL: https://ap-northeast-1.console.aws.amazon.com/amplify/home?region=ap-northeast-1#/$APP_ID"
echo ""
echo "⚠️  Important: Go to Amplify Console and set 'App root directory' to: apps/web"
echo ""
echo "Starting deployment..."
aws amplify start-job \
  --app-id "$APP_ID" \
  --branch-name demo-matching1 \
  --job-type RELEASE \
  --region ap-northeast-1
