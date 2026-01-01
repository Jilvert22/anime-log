# メール認証トラブルシューティングガイド

## 確認すべき項目

### 1. Supabaseダッシュボードの認証設定

#### 1.1 メール認証の有効化
- [ ] Supabaseダッシュボード → Authentication → Providers → Email
- [ ] 「Enable Email provider」が有効になっているか確認
- [ ] 「Confirm email」が有効になっているか確認（新規登録時にメール確認が必要な場合）

#### 1.2 リダイレクトURLの設定
Supabaseダッシュボード → Authentication → URL Configuration で以下を確認：

**Site URL（必須）**
- ローカル: `http://localhost:3000`
- 本番: `https://anime-log-rho.vercel.app`（または実際の本番URL）

**Redirect URLs（許可リスト）**
以下のURLを追加：
```
http://localhost:3000/**
http://localhost:3000/auth/callback
https://anime-log-rho.vercel.app/**
https://anime-log-rho.vercel.app/auth/callback
```

**注意**: `**` はワイルドカードで、すべてのパスを許可します。

#### 1.3 メールテンプレートの設定
- [ ] Supabaseダッシュボード → Authentication → Email Templates
- [ ] 「Confirm signup」テンプレートを確認
- [ ] リダイレクトURLが正しく設定されているか確認

### 2. 環境変数の設定

#### 2.1 ローカル環境（`.env.local`）
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 2.2 本番環境（Vercel）
Vercelダッシュボード → Settings → Environment Variables で以下を設定：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://anime-log-rho.vercel.app
```

**確認方法**:
```bash
# ローカルで確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $NEXT_PUBLIC_SITE_URL

# Vercelで確認（Vercel CLI使用時）
vercel env ls
```

### 3. コード内のリダイレクトURL設定

#### 3.1 新規登録時のメール確認
✅ **修正済み**: `app/lib/api/auth.ts`の`signUp`関数に`redirectTo`が追加されました。

**現在のコード**:
```typescript
// メール確認後のリダイレクトURLを設定
const redirectTo = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/callback`
  : undefined;

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectTo,
  },
});
```

これにより、メール確認リンクをクリックした後、`/auth/callback`にリダイレクトされます。

#### 3.2 パスワードリセット
現在のコード（`app/lib/api/auth.ts` 165-167行目）では、`resetPasswordForEmail`に`redirectTo`が設定されています。

**現在のコード**:
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectTo || `${window.location.origin}/reset-password`,
});
```

これは正しく設定されています。

### 4. 認証コールバックページの確認

#### 4.1 コールバックページの存在確認
✅ **実装済み**: `/auth/callback`ページが作成されました。

**ファイルの場所**:
- `app/auth/callback/route.ts`

**確認方法**:
```bash
# ファイルの存在確認
ls -la app/auth/callback/
```

#### 4.2 コールバックページの実装
コールバックページは既に実装されており、以下の機能を提供します：
- メール確認コードの検証
- セッションの確立
- エラーハンドリング
- ホームページへのリダイレクト

**実装内容**:
- メール確認リンクから受け取った`code`パラメータを検証
- Supabaseの`exchangeCodeForSession`を使用してセッションを確立
- エラーが発生した場合は、エラーメッセージと共にホームページにリダイレクト
- 成功した場合は、ホームページにリダイレクト

### 5. よくある問題と解決方法

#### 問題1: メールが届かない
**原因**:
- Supabaseのメール送信制限に達している
- メールプロバイダーがスパムとして扱っている
- メールアドレスが無効

**解決方法**:
1. Supabaseダッシュボード → Authentication → Logs でエラーを確認
2. スパムフォルダを確認
3. メールアドレスの形式を確認

#### 問題2: メールのリンクが無効
**原因**:
- リダイレクトURLがSupabaseの許可リストに含まれていない
- リダイレクトURLの形式が間違っている

**解決方法**:
1. Supabaseダッシュボード → Authentication → URL Configuration でリダイレクトURLを確認
2. コード内の`redirectTo`設定を確認
3. メール内のリンクを確認（ブラウザの開発者ツールで確認）

#### 問題3: リダイレクト後にエラーが発生
**原因**:
- コールバックページが存在しない
- コールバックページの実装が間違っている

**解決方法**:
1. `/auth/callback`ページが存在するか確認
2. コールバックページの実装を確認
3. ブラウザのコンソールでエラーを確認

### 6. デバッグ方法

#### 6.1 ブラウザの開発者ツール
1. ブラウザの開発者ツール（F12）を開く
2. Networkタブでリクエストを確認
3. Consoleタブでエラーメッセージを確認

#### 6.2 Supabaseダッシュボード
1. Authentication → Logs で認証ログを確認
2. エラーメッセージを確認
3. リクエストの詳細を確認

#### 6.3 ローカルでのテスト
```bash
# ローカルサーバーを起動
npm run dev

# 別のターミナルでログを確認
# ブラウザで http://localhost:3000 にアクセス
```

### 7. チェックリスト

#### ローカル環境
- [ ] `.env.local`に`NEXT_PUBLIC_SUPABASE_URL`が設定されている
- [ ] `.env.local`に`NEXT_PUBLIC_SUPABASE_ANON_KEY`が設定されている
- [ ] `.env.local`に`NEXT_PUBLIC_SITE_URL=http://localhost:3000`が設定されている
- [ ] Supabaseダッシュボードで`http://localhost:3000`がSite URLまたはRedirect URLsに含まれている
- [ ] `/auth/callback`ページが存在する

#### 本番環境
- [ ] Vercelの環境変数に`NEXT_PUBLIC_SUPABASE_URL`が設定されている
- [ ] Vercelの環境変数に`NEXT_PUBLIC_SUPABASE_ANON_KEY`が設定されている
- [ ] Vercelの環境変数に`NEXT_PUBLIC_SITE_URL`が本番URLに設定されている
- [ ] Supabaseダッシュボードで本番URLがSite URLまたはRedirect URLsに含まれている
- [ ] `/auth/callback`ページがデプロイされている

### 8. 次のステップ

問題が解決しない場合：
1. Supabaseのサポートに問い合わせる
2. エラーログを確認する
3. コードの実装を再確認する

## 参考リンク

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Next.js with Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

