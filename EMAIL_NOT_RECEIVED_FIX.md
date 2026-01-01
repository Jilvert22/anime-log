# 認証メールが届かない問題の解決方法

## 即座に確認すべき項目

### 1. Supabaseダッシュボードで認証ログを確認

1. Supabaseダッシュボードにログイン
2. **Authentication** → **Logs** を開く
3. 最近のログを確認し、以下をチェック：
   - `rikunagayasu34+test@gmail.com` での登録試行があるか
   - エラーメッセージがないか
   - メール送信のステータス

**確認ポイント**:
- ✅ ログに登録試行が記録されている → アプリ側は正常
- ❌ エラーメッセージがある → エラーの内容を確認
- ⚠️ メール送信が失敗している → SMTP設定を確認

### 2. Supabaseのメール送信制限を確認

**無料プラン（Free Tier）の制限**:
- 1時間あたり最大 **4通** のメール送信
- 1日あたり最大 **数通** のメール送信

**確認方法**:
1. Supabaseダッシュボード → **Settings** → **Usage**
2. メール送信の使用量を確認
3. 制限に達していないか確認

**解決方法**:
- 制限に達している場合、時間を置いて再試行
- または、カスタムSMTPを設定（後述）

### 3. メールプロバイダーのスパムフィルターを確認

**Gmailの場合**:
1. Gmailを開く
2. **迷惑メールフォルダ** を確認
3. **すべてのメール** タブを確認
4. 検索: `from:supabase` または `from:noreply@supabase.co`

**その他のメールプロバイダー**:
- Outlook/Hotmail: 迷惑メールフォルダを確認
- Yahoo Mail: スパムフォルダを確認

### 4. Supabaseのメール設定を確認

#### 4.1 メール認証の有効化
1. Supabaseダッシュボード → **Authentication** → **Providers**
2. **Email** を選択
3. 以下を確認：
   - ✅ **Enable Email provider** が有効
   - ✅ **Confirm email** の設定を確認

#### 4.2 メールテンプレートの確認
1. Supabaseダッシュボード → **Authentication** → **Email Templates**
2. **Confirm signup** テンプレートを確認
3. リダイレクトURLが正しく設定されているか確認

**確認すべきURL**:
```
{{ .ConfirmationURL }}
```

このURLが正しく生成されているか確認。

### 5. カスタムSMTPの設定（推奨）

Supabaseのデフォルトメール送信には制限があるため、カスタムSMTPを設定することを推奨します。

#### 5.1 SMTPプロバイダーの選択
以下のサービスが利用可能：
- **SendGrid**（推奨）
- **Mailgun**
- **AWS SES**
- **Postmark**

#### 5.2 SendGridの設定例

1. **SendGridアカウントを作成**
   - https://sendgrid.com/ にアクセス
   - 無料プランでアカウント作成（1日100通まで無料）

2. **APIキーを生成**
   - SendGridダッシュボード → **Settings** → **API Keys**
   - **Create API Key** をクリック
   - 権限: **Full Access** または **Mail Send** のみ
   - APIキーをコピー（一度しか表示されないので注意）

3. **SupabaseでSMTPを設定**
   - Supabaseダッシュボード → **Settings** → **Auth**
   - **SMTP Settings** セクションを開く
   - 以下を入力：
     ```
     SMTP Host: smtp.sendgrid.net
     SMTP Port: 587
     SMTP User: apikey
     SMTP Password: [SendGridのAPIキー]
     Sender email: noreply@yourdomain.com（または認証済みのメールアドレス）
     Sender name: アニメログ（任意）
     ```

4. **メールアドレスの認証**
   - SendGridダッシュボード → **Settings** → **Sender Authentication**
   - **Single Sender Verification** または **Domain Authentication** を設定
   - メールアドレスまたはドメインを認証

#### 5.3 その他のSMTPプロバイダー

**Mailgun**:
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: postmaster@yourdomain.mailgun.org
SMTP Password: [Mailgunのパスワード]
```

**AWS SES**:
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP User: [AWS SESのSMTPユーザー名]
SMTP Password: [AWS SESのSMTPパスワード]
```

### 6. リダイレクトURLの再確認

本番環境のリダイレクトURLが正しく設定されているか確認：

1. Supabaseダッシュボード → **Authentication** → **URL Configuration**
2. **Site URL** が本番URLに設定されているか確認：
   ```
   https://anime-log-rho.vercel.app
   ```
3. **Redirect URLs** に以下が含まれているか確認：
   ```
   https://anime-log-rho.vercel.app/**
   https://anime-log-rho.vercel.app/auth/callback
   ```

### 7. テスト方法

#### 7.1 メール送信のテスト
1. Supabaseダッシュボード → **Authentication** → **Users**
2. テスト用のユーザーを作成
3. **Send magic link** または **Resend confirmation email** をクリック
4. メールが届くか確認

#### 7.2 コードでのテスト
```typescript
// 開発者ツールのコンソールで実行
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'rikunagayasu34+test@gmail.com',
  options: {
    emailRedirectTo: 'https://anime-log-rho.vercel.app/auth/callback'
  }
});

console.log('Resend result:', { data, error });
```

### 8. よくある問題と解決方法

#### 問題1: メールが全く届かない
**原因**:
- Supabaseのメール送信制限に達している
- SMTP設定が間違っている
- メールアドレスが無効

**解決方法**:
1. Supabaseダッシュボードのログを確認
2. カスタムSMTPを設定
3. 別のメールアドレスで試す

#### 問題2: メールは届くがリンクが無効
**原因**:
- リダイレクトURLがSupabaseの許可リストに含まれていない
- リダイレクトURLの形式が間違っている

**解決方法**:
1. SupabaseダッシュボードでリダイレクトURLを確認
2. コード内の`emailRedirectTo`を確認
3. メール内のリンクを確認（ブラウザの開発者ツールで確認）

#### 問題3: メールがスパムフォルダに入る
**原因**:
- メールプロバイダーがスパムとして判定
- SPF/DKIM設定が不十分

**解決方法**:
1. カスタムSMTPを使用
2. ドメイン認証を設定
3. SPF/DKIMレコードを設定

### 9. 緊急時の対処法

メールが届かない場合の一時的な対処：

1. **Supabaseダッシュボードから直接確認メールを再送**
   - Authentication → Users → 該当ユーザーを選択
   - **Resend confirmation email** をクリック

2. **メール確認を無効化（開発環境のみ）**
   - Supabaseダッシュボード → Authentication → Providers → Email
   - **Confirm email** を無効化
   - ⚠️ **本番環境では推奨しません**

3. **手動でユーザーを確認済みにする**
   - Supabaseダッシュボード → Authentication → Users
   - 該当ユーザーを選択
   - **Confirm email** をクリック

### 10. チェックリスト

- [ ] Supabaseダッシュボードの認証ログを確認
- [ ] メール送信の制限に達していないか確認
- [ ] スパムフォルダを確認
- [ ] メール認証が有効になっているか確認
- [ ] リダイレクトURLが正しく設定されているか確認
- [ ] カスタムSMTPを設定（推奨）
- [ ] 別のメールアドレスでテスト
- [ ] Supabaseダッシュボードから確認メールを再送

## 次のステップ

1. **まずはSupabaseダッシュボードのログを確認**して、エラーがないか確認してください
2. **スパムフォルダを確認**してください
3. それでも解決しない場合は、**カスタムSMTPの設定**を検討してください

問題が続く場合は、以下の情報を共有してください：
- Supabaseダッシュボードの認証ログの内容
- エラーメッセージ（あれば）
- メール送信の使用量

