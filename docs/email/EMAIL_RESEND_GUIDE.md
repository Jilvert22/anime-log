# 認証メールの再送と既存ユーザーへの対応ガイド

## 1. 無料プランのメール送信制限について

### Supabase無料プランの制限

**メール送信制限**:
- **1時間あたり最大4通**のメール送信
- **1日あたり数通**のメール送信（正確な数はSupabaseのドキュメントを確認）

**影響**:
- 複数のユーザーが同時に登録すると、すぐに制限に達する可能性がある
- メールが届かない、または遅延する可能性がある

**解決方法**:
1. **カスタムSMTPの設定**（推奨）
   - SendGrid、Mailgun、AWS SESなどのSMTPサービスを使用
   - 無料プランでも1日100通以上送信可能（サービスによる）

2. **有料プランへのアップグレード**
   - Supabase Proプランでは制限が緩和される

## 2. 認証メールの再送方法

### 方法1: Supabaseダッシュボードから再送（推奨）

1. Supabaseダッシュボードにログイン
2. **Authentication** → **Users** を開く
3. 該当ユーザー（`rikunagayasu34+test@gmail.com`）を検索
4. ユーザーをクリックして詳細を開く
5. **Actions** または **Send magic link** ボタンをクリック
6. **Resend confirmation email** を選択

### 方法2: コードから再送

以下のコードをブラウザの開発者ツール（F12）のコンソールで実行：

```javascript
// Supabaseクライアントを取得
const { createClient } = require('@supabase/supabase-js');

// 環境変数から取得（実際の値に置き換える）
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 認証メールを再送
async function resendConfirmationEmail(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: 'https://anime-log-rho.vercel.app/auth/callback'
    }
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Confirmation email sent:', data);
  }
}

// 使用例
resendConfirmationEmail('rikunagayasu34+test@gmail.com');
```

### 方法3: アプリ内に再送機能を追加

ユーザーが自分で再送できるように、アプリ内に再送機能を追加することもできます。

## 3. 既存ユーザー（メール未確認）への対応

### 状況の確認

1. Supabaseダッシュボード → **Authentication** → **Users**
2. 該当ユーザーを検索
3. ユーザーの詳細を確認：
   - **Email confirmed**: `false` → メール未確認
   - **Last sign in**: 未記録 → ログイン未完了

### 対応方法

#### 方法1: 手動でメール確認を完了させる（即座に解決）

1. Supabaseダッシュボード → **Authentication** → **Users**
2. 該当ユーザーを選択
3. **Actions** メニューを開く
4. **Confirm email** をクリック
5. これで、ユーザーはメール確認なしでログイン可能になります

**注意**: セキュリティ上の理由から、この方法は信頼できるユーザーにのみ使用してください。

#### 方法2: 認証メールを再送

上記の「認証メールの再送方法」を参照してください。

#### 方法3: パスワードリセット機能を使用

メール確認ができない場合、パスワードリセット機能を使用してメールを送信することもできます：

1. ログイン画面で「パスワードを忘れた方」をクリック
2. メールアドレスを入力
3. パスワードリセットメールが届く（通常、認証メールより届きやすい）
4. パスワードをリセット後、ログイン可能

#### 方法4: 一括でメール再送（複数ユーザー）

複数のユーザーに一括でメールを再送する場合：

1. Supabaseダッシュボード → **Authentication** → **Users**
2. メール未確認のユーザーをフィルタリング
3. 各ユーザーに対して手動で再送、または
4. Supabase APIを使用して一括処理

## 4. 今後の対策

### 4.1 カスタムSMTPの設定（推奨）

メール送信の制限を回避するため、カスタムSMTPを設定することを強く推奨します。

**SendGridの設定例**:

1. **SendGridアカウントを作成**
   - https://sendgrid.com/ にアクセス
   - 無料プランでアカウント作成（1日100通まで無料）

2. **APIキーを生成**
   - SendGridダッシュボード → **Settings** → **API Keys**
   - **Create API Key** をクリック
   - 権限: **Full Access** または **Mail Send** のみ
   - APIキーをコピー

3. **SupabaseでSMTPを設定**
   - Supabaseダッシュボード → **Settings** → **Auth**
   - **SMTP Settings** セクションを開く
   - 以下を入力：
     ```
     SMTP Host: smtp.sendgrid.net
     SMTP Port: 587
     SMTP User: apikey
     SMTP Password: [SendGridのAPIキー]
     Sender email: noreply@yourdomain.com
     Sender name: アニメログ
     ```

4. **メールアドレスの認証**
   - SendGridダッシュボード → **Settings** → **Sender Authentication**
   - **Single Sender Verification** を設定
   - メールアドレスを認証

### 4.2 アプリ内に再送機能を追加

ユーザーが自分で認証メールを再送できる機能を追加：

```typescript
// app/components/modals/AuthModal.tsx に追加
const handleResendConfirmationEmail = async () => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: authEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setEmailSent(true);
      setAuthError('');
    }
  } catch (error) {
    console.error('Failed to resend confirmation email:', error);
    setAuthError('メールの再送に失敗しました');
  }
};
```

### 4.3 メール確認を無効化（開発環境のみ）

開発環境やテスト環境では、メール確認を無効化することもできます：

1. Supabaseダッシュボード → **Authentication** → **Providers** → **Email**
2. **Confirm email** を無効化
3. ⚠️ **本番環境では推奨しません**（セキュリティ上の理由）

## 5. チェックリスト

### 現在の問題への対応
- [ ] `rikunagayasu34+test@gmail.com` に認証メールを再送
- [ ] 以前メールが届いていない友人に認証メールを再送
- [ ] または、手動でメール確認を完了させる

### 今後の対策
- [ ] カスタムSMTP（SendGridなど）を設定
- [ ] アプリ内に再送機能を追加
- [ ] メール送信の制限を監視

## 6. よくある質問

### Q: 無料プランでもメールは届くの？
A: はい、届きますが、1時間あたり4通という制限があります。複数のユーザーが同時に登録すると、すぐに制限に達する可能性があります。

### Q: メールが届かない場合、どうすればいい？
A: まず、Supabaseダッシュボードから認証メールを再送してください。それでも届かない場合は、カスタムSMTPの設定を検討してください。

### Q: 既存ユーザーがメール確認できない場合、どうすればいい？
A: Supabaseダッシュボードから手動でメール確認を完了させるか、認証メールを再送してください。

### Q: カスタムSMTPは必須？
A: 必須ではありませんが、メール送信の制限を回避し、より確実にメールを送信するために推奨されます。

## 参考リンク

- [Supabase Email Auth Documentation](https://supabase.com/docs/guides/auth/auth-email)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)

