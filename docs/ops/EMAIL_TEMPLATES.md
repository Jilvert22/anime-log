# アニメログ メールテンプレート

Supabaseのメールテンプレートにコピー&ペーストして使用できるテンプレート集です。

## 1. Confirm signup（新規登録確認メール）

### 件名（Subject）
```
アニメログ - アカウント登録の確認
```

### 本文（Body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(232, 121, 212, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #e879d4;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #666666;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #999999;
    }
    .link {
      color: #e879d4;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>アニメログ</h1>
    </div>
    <div class="content">
      <h2>アカウント登録の確認</h2>
      <p>こんにちは、</p>
      <p>アニメログへのご登録ありがとうございます！</p>
      <p>あなたのアニメ視聴履歴を記録・管理できる準備が整いました。</p>
      <p>以下のボタンをクリックして、アカウント登録を完了してください。</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">アカウントを確認する</a>
      </div>
      
      <div class="info-box">
        <p><strong>ご注意</strong></p>
        <p>このリンクは24時間有効です。期限が過ぎた場合は、再度登録手続きを行ってください。</p>
      </div>
      
      <p>もしこのメールに心当たりがない場合は、このメールを無視してください。アカウントは作成されません。</p>
      
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    <div class="footer">
      <p>© 2025 アニメログ. All rights reserved.</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password（パスワードリセットメール）

### 件名（Subject）
```
アニメログ - パスワードリセット
```

### 本文（Body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(232, 121, 212, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 8px 0;
      font-size: 14px;
      color: #856404;
    }
    .warning-box strong {
      color: #856404;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #999999;
    }
    .link {
      color: #e879d4;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>パスワードリセット</h1>
    </div>
    <div class="content">
      <h2>パスワードリセットのリクエスト</h2>
      <p>こんにちは、</p>
      <p>パスワードリセットのリクエストを受け付けました。</p>
      <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">パスワードをリセットする</a>
      </div>
      
      <div class="warning-box">
        <p><strong>重要な注意事項</strong></p>
        <p>• このリンクは1時間有効です</p>
        <p>• もしこのリクエストをしていない場合は、このメールを無視してください</p>
        <p>• パスワードは変更されません</p>
        <p>• セキュリティのため、定期的にパスワードを変更することをお勧めします</p>
      </div>
      
      <p>もしこのメールに心当たりがない場合は、アカウントのセキュリティを確認することをお勧めします。</p>
    </div>
    <div class="footer">
      <p>© 2025 アニメログ. All rights reserved.</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Magic Link（マジックリンク認証メール）

### 件名（Subject）
```
アニメログ - ログインリンク
```

### 本文（Body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(232, 121, 212, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #e879d4;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #666666;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ログインリンク</h1>
    </div>
    <div class="content">
      <h2>ログインリクエスト</h2>
      <p>こんにちは、</p>
      <p>アニメログへのログインリクエストを受け付けました。</p>
      <p>以下のボタンをクリックして、ログインしてください。</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">ログインする</a>
      </div>
      
      <div class="info-box">
        <p><strong>ご注意</strong></p>
        <p>このリンクは1回のみ使用でき、1時間有効です。期限が過ぎた場合は、再度ログインリクエストを行ってください。</p>
      </div>
      
      <p>もしこのリクエストをしていない場合は、このメールを無視してください。</p>
    </div>
    <div class="footer">
      <p>© 2025 アニメログ. All rights reserved.</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. Change Email Address（メールアドレス変更確認メール）

### 件名（Subject）
```
アニメログ - メールアドレス変更の確認
```

### 本文（Body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(232, 121, 212, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #e879d4;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #666666;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>メールアドレス変更</h1>
    </div>
    <div class="content">
      <h2>メールアドレス変更の確認</h2>
      <p>こんにちは、</p>
      <p>アニメログのメールアドレス変更リクエストを受け付けました。</p>
      <p>新しいメールアドレス <strong>{{ .Email }}</strong></p>
      <p>以下のボタンをクリックして、メールアドレスの変更を完了してください。</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">メールアドレスを変更する</a>
      </div>
      
      <div class="info-box">
        <p><strong>ご注意</strong></p>
        <p>このリンクは24時間有効です。期限が過ぎた場合は、再度メールアドレス変更手続きを行ってください。</p>
        <p>もしこのリクエストをしていない場合は、このメールを無視してください。メールアドレスは変更されません。</p>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 アニメログ. All rights reserved.</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>
```

---

## 5. Invite user（ユーザー招待メール）

### 件名（Subject）
```
アニメログ - 招待メール
```

### 本文（Body）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #e879d4 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(232, 121, 212, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .features {
      background-color: #f8f9fa;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .features h3 {
      color: #333333;
      font-size: 18px;
      margin: 0 0 12px 0;
      font-weight: 600;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
      color: #666666;
    }
    .features li {
      margin: 8px 0;
      font-size: 14px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>アニメログへようこそ！</h1>
    </div>
    <div class="content">
      <h2>招待メール</h2>
      <p>こんにちは、</p>
      <p>あなたはアニメログに招待されました！</p>
      <p>アニメログは、あなたのアニメ視聴履歴を記録・管理できるWebアプリです。</p>
      
      <div class="features">
        <h3>主な機能</h3>
        <ul>
          <li>視聴記録の管理（評価、周回数など）</li>
          <li>クール別・シリーズ別の表示</li>
          <li>視聴傾向の分析とオタクタイプ診断</li>
          <li>ANIME DNAカードの作成とシェア</li>
          <li>SNS機能（フォロー、プロフィール公開）</li>
        </ul>
      </div>
      
      <p>以下のボタンをクリックして、アカウントを作成してください。</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">アカウントを作成する</a>
      </div>
      
      <p>このリンクは期限付きです。期限が過ぎた場合は、再度招待をリクエストしてください。</p>
    </div>
    <div class="footer">
      <p>© 2025 アニメログ. All rights reserved.</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>
```

---

## 使用方法

### Supabaseダッシュボードでのテンプレートの場所

1. Supabaseダッシュボードにログイン
2. 左側のメニューから **「Authentication」** をクリック
3. 上部のタブから **「Emails」** を選択
4. **「Templates」** タブをクリック（「SMTP Settings」タブの隣）

### 各テンプレートの場所

**Templates** タブを開くと、以下のテンプレートが一覧表示されます。各テンプレート名をクリックすると編集画面が開きます。

- **Confirm signup** - 新規登録確認メール（1番目に表示）
- **Reset Password** - パスワードリセットメール（2番目に表示）
- **Magic Link** - マジックリンク認証メール（3番目に表示）
- **Change Email Address** - メールアドレス変更確認メール（4番目に表示）
- **Invite user** - ユーザー招待メール（5番目に表示）

### 編集手順

1. 編集したいテンプレート名をクリック
2. **Subject** フィールドに上記の件名をコピー&ペースト
3. **Body** フィールドに上記の本文（HTML）をコピー&ペースト
4. **Save** ボタンをクリックして保存

すべてのテンプレートで、`{{ .ConfirmationURL }}` などの変数が正しく機能するように設定されています。

