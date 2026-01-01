# Supabaseメールテンプレートのカスタマイズガイド

Supabaseから送信される認証メール（確認メール、パスワードリセットメールなど）のテンプレートを独自のものに変更する手順です。

## 前提条件

- Supabaseプロジェクトのダッシュボードにアクセスできること
- 管理者権限があること

## 手順

### 1. Supabaseダッシュボードにアクセス

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. 対象のプロジェクトを選択

### 2. メールテンプレートの編集

1. 左側のメニューから **「Authentication」** を選択
2. **「Email Templates」** をクリック
3. カスタマイズしたいメールテンプレートを選択：
   - **Confirm signup** - 新規登録時の確認メール
   - **Magic Link** - マジックリンク認証メール
   - **Change Email Address** - メールアドレス変更時の確認メール
   - **Reset Password** - パスワードリセットメール
   - **Invite user** - ユーザー招待メール

### 3. テンプレートのカスタマイズ

各テンプレートには以下の要素をカスタマイズできます：

#### 3.1 件名（Subject）

メールの件名を設定します。

**例**:
```
{{ .SiteName }} - アカウント登録の確認
```

#### 3.2 本文（Body）

メール本文をHTML形式で記述します。以下の変数が使用できます：

- `{{ .SiteName }}` - サイト名（Supabaseの設定から取得）
- `{{ .ConfirmationURL }}` - 確認リンクのURL
- `{{ .Email }}` - ユーザーのメールアドレス
- `{{ .Token }}` - 認証トークン
- `{{ .TokenHash }}` - トークンのハッシュ値
- `{{ .RedirectTo }}` - リダイレクト先URL

**例（Confirm signupテンプレート）**:
```html
<h2>アカウント登録の確認</h2>
<p>こんにちは、</p>
<p>{{ .SiteName }}へのご登録ありがとうございます。</p>
<p>以下のリンクをクリックして、アカウント登録を完了してください：</p>
<p><a href="{{ .ConfirmationURL }}">アカウントを確認する</a></p>
<p>このリンクは24時間有効です。</p>
<p>もしこのメールに心当たりがない場合は、無視してください。</p>
<hr>
<p>{{ .SiteName }} チーム</p>
```

**例（Reset Passwordテンプレート）**:
```html
<h2>パスワードリセット</h2>
<p>こんにちは、</p>
<p>パスワードリセットのリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセットする</a></p>
<p>このリンクは1時間有効です。</p>
<p>もしこのリクエストをしていない場合は、無視してください。パスワードは変更されません。</p>
<hr>
<p>{{ .SiteName }} チーム</p>
```

### 4. カスタムSMTPサーバーの設定（推奨）

デフォルトのSupabase SMTPサーバーには送信制限があります。本番環境では、カスタムSMTPサーバーを設定することを推奨します。

#### 4.1 カスタムSMTPサーバーの有効化

1. **「Authentication」** → **「Emails」** を選択
2. **「Enable Custom SMTP」** を有効にする
3. 以下の情報を入力：
   - **Host** - SMTPサーバーのホスト名（例: `smtp.gmail.com`）
   - **Port** - SMTPポート（通常は587または465）
   - **Username** - SMTP認証用のユーザー名
   - **Password** - SMTP認証用のパスワード
   - **Sender email** - 送信元メールアドレス
   - **Sender name** - 送信者名（例: `アニメログ`）

#### 4.2 よく使われるSMTPサービス

- **Gmail** - `smtp.gmail.com:587`
- **SendGrid** - `smtp.sendgrid.net:587`
- **Mailgun** - `smtp.mailgun.org:587`
- **AWS SES** - リージョンごとに異なる
- **Resend** - `smtp.resend.com:587`

### 5. サイト名の設定

メールテンプレートで使用するサイト名を設定します。

1. **「Authentication」** → **「URL Configuration」** を選択
2. **「Site URL」** を設定（例: `https://anime-log-rho.vercel.app`）
3. サイト名は自動的にドメインから取得されますが、カスタマイズしたい場合はメールテンプレート内で直接記述することもできます

### 6. プレビューとテスト

1. テンプレート編集画面で **「Preview」** ボタンをクリックしてプレビューを確認
2. テストメールを送信して実際の表示を確認
3. 必要に応じて調整

### 7. テンプレートの保存

1. 編集が完了したら **「Save」** ボタンをクリック
2. 変更は即座に反映されます

## テンプレート例

### Confirm signup（新規登録確認メール）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #f09fe3 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #e879d4;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 アニメログ</h1>
  </div>
  <div class="content">
    <h2>アカウント登録の確認</h2>
    <p>こんにちは、</p>
    <p>アニメログへのご登録ありがとうございます！</p>
    <p>以下のボタンをクリックして、アカウント登録を完了してください：</p>
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">アカウントを確認する</a>
    </p>
    <p>このリンクは24時間有効です。</p>
    <p>もしこのメールに心当たりがない場合は、無視してください。</p>
  </div>
  <div class="footer">
    <p>© 2024 アニメログ. All rights reserved.</p>
  </div>
</body>
</html>
```

### Reset Password（パスワードリセットメール）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #f09fe3 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #e879d4;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔑 パスワードリセット</h1>
  </div>
  <div class="content">
    <h2>パスワードリセットのリクエスト</h2>
    <p>こんにちは、</p>
    <p>パスワードリセットのリクエストを受け付けました。</p>
    <p>以下のボタンをクリックして、新しいパスワードを設定してください：</p>
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">パスワードをリセットする</a>
    </p>
    <div class="warning">
      <strong>⚠️ 注意</strong>
      <ul>
        <li>このリンクは1時間有効です</li>
        <li>もしこのリクエストをしていない場合は、無視してください</li>
        <li>パスワードは変更されません</li>
      </ul>
    </div>
  </div>
  <div class="footer">
    <p>© 2024 アニメログ. All rights reserved.</p>
  </div>
</body>
</html>
```

## 注意事項

1. **変数の使用**: `{{ .ConfirmationURL }}` などの変数は必ず使用してください。これらがないとメールが正しく機能しません。

2. **HTMLのエスケープ**: HTMLタグを使用する場合は、適切にエスケープしてください。

3. **モバイル対応**: メールはモバイルデバイスでも表示されるため、レスポンシブデザインを考慮してください。

4. **リンクの有効期限**: 確認リンクには有効期限があります。ユーザーに期限を伝えることを推奨します。

5. **セキュリティ**: メールテンプレートに機密情報を含めないでください。

## トラブルシューティング

### メールが送信されない

- カスタムSMTPサーバーの設定を確認
- SMTP認証情報が正しいか確認
- 送信元メールアドレスが正しいか確認

### メールがスパムフォルダに入る

- SPFレコードとDKIMレコードを設定（カスタムSMTP使用時）
- 送信元メールアドレスを信頼できるドメインに設定

### リンクが機能しない

- `{{ .ConfirmationURL }}` が正しく使用されているか確認
- SupabaseダッシュボードのリダイレクトURL設定を確認

## 参考リンク

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Custom SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/auth-redirect-urls)

