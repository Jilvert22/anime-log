# 認証メールの再送方法（詳細手順）

## 方法1: Supabaseダッシュボードから再送

### ステップ1: ユーザーを選択

1. Supabaseダッシュボード → **Authentication** → **Users**
2. ユーザー一覧から、メールを再送したいユーザーを**クリック**
3. 右側のパネルが開きます

### ステップ2: 確認メールを再送

右側のパネルで、以下のいずれかの方法を試してください：

#### 方法A: Send Magic Link を使用（推奨）

1. 右側のパネルの **"Send Magic Link"** セクションを確認
2. **"Send magic link"** ボタンをクリック
3. これで確認メールが送信されます

**注意**: Magic Linkはパスワードなしでログインできるリンクですが、メール確認にも使用できます。

#### 方法B: タブを切り替えて確認

1. 右側のパネルの上部にあるタブを確認：
   - **Overview**（現在選択中）
   - **Logs**
   - **Raw JSON**
2. **Overview**タブに「Resend confirmation email」ボタンがない場合
3. **Logs**タブを確認（過去のログから再送できる場合があります）

#### 方法C: ユーザーを手動で確認済みにする

1. 右側のパネルの **"Danger zone"** セクションの上を確認
2. 「Confirm email」や「Email confirmed」のトグルスイッチがあるか確認
3. または、**Raw JSON**タブで直接編集

### ステップ3: 手動でメール確認を完了させる（最も確実）

ユーザーのメールアドレスが確認できない場合、手動で確認済みにできます：

1. 右側のパネルで **"Raw JSON"** タブをクリック
2. JSONデータを確認
3. `email_confirmed_at` フィールドを確認
4. 値が `null` の場合、以下のいずれかで対応：
   - **方法1**: コードから直接更新（後述）
   - **方法2**: Supabase SQL Editorから更新（後述）

## 方法2: コードから再送（ブラウザのコンソール）

### ステップ1: ブラウザの開発者ツールを開く

1. アプリのページ（https://animelog.jp）を開く
2. **F12** キーを押す（または右クリック → 「検証」）
3. **Console** タブを開く

### ステップ2: 以下のコードを実行

```javascript
// 1. Supabaseクライアントを取得
const supabaseUrl = 'YOUR_SUPABASE_URL'; // 実際のURLに置き換える
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // 実際のキーに置き換える

// 2. 環境変数から取得する場合（Next.jsアプリ内で実行する場合）
// ブラウザのコンソールでは直接取得できないため、以下の方法を使用

// 方法A: アプリのコードから実行
// app/components/modals/AuthModal.tsx などに追加
async function resendConfirmationEmail(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: window.location.origin + '/auth/callback'
    }
  });

  if (error) {
    console.error('Error:', error);
    alert('エラー: ' + error.message);
  } else {
    console.log('Success:', data);
    alert('確認メールを再送しました');
  }
}

// 使用例
resendConfirmationEmail('rikunagayasu34+test@gmail.com');
```

### ステップ3: アプリ内に再送ボタンを追加（推奨）

ユーザーが自分で再送できるように、アプリ内にボタンを追加：

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
      alert('確認メールを再送しました');
    }
  } catch (error) {
    console.error('Failed to resend confirmation email:', error);
    setAuthError('メールの再送に失敗しました');
  }
};
```

## 方法3: Supabase SQL Editorから手動で確認済みにする

### ステップ1: SQL Editorを開く

1. Supabaseダッシュボード → **SQL Editor**
2. **New query** をクリック

### ステップ2: 以下のSQLを実行

```sql
-- 特定のユーザーのメールを確認済みにする
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'rikunagayasu34+test@gmail.com';

-- または、ユーザーIDで指定
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = 'ユーザーID';
```

**注意**: この方法は、ユーザーのメールアドレスが正しいことが確認できている場合のみ使用してください。

## 方法4: Supabase CLIを使用（開発環境）

### ステップ1: Supabase CLIをインストール

```bash
npm install -g supabase
```

### ステップ2: ログイン

```bash
supabase login
```

### ステップ3: プロジェクトをリンク

```bash
supabase link --project-ref your-project-ref
```

### ステップ4: ユーザーのメールを確認済みにする

```bash
# ユーザーのメールを確認済みにする
supabase db execute "
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'rikunagayasu34+test@gmail.com';
"
```

## 最も簡単な方法（推奨）

### 手順

1. **Supabaseダッシュボード** → **Authentication** → **Users**
2. 該当ユーザー（`rikunagayasu34+test@gmail.com`）を**クリック**
3. 右側のパネルで **"Send Magic Link"** セクションの **"Send magic link"** ボタンをクリック
4. これで確認メールが送信されます

### それでも見つからない場合

1. 右側のパネルの **"Raw JSON"** タブをクリック
2. JSONデータを確認
3. `email_confirmed_at` が `null` の場合、以下のSQLを実行：

```sql
-- SQL Editorで実行
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'rikunagayasu34+test@gmail.com';
```

これで、ユーザーはメール確認なしでログインできるようになります。

## スクリーンショットの確認

スクリーンショットを見ると、右側のパネルに以下のセクションがあります：

1. **"Reset password"** - パスワードリセットメールを送信
2. **"Send Magic Link"** - パスワードなしログイン用のリンクを送信（これが確認メールの代わりになります）
3. **"Danger zone"** - 危険な操作

**"Send Magic Link"** ボタンをクリックすると、確認メールが送信されます。

## トラブルシューティング

### 問題: "Send Magic Link"ボタンが見つからない

**解決方法**:
1. ユーザーを一度クリックして選択
2. 右側のパネルが開くことを確認
3. パネルをスクロールして、すべてのセクションを確認

### 問題: ボタンをクリックしてもメールが届かない

**解決方法**:
1. Supabaseダッシュボード → **Settings** → **Usage** でメール送信の制限を確認
2. 制限に達している場合は、時間を置いて再試行
3. または、カスタムSMTPを設定

### 問題: 複数のユーザーに一括で対応したい

**解決方法**:
SQL Editorで一括処理：

```sql
-- メール未確認のすべてのユーザーを確認済みにする
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- または、特定のメールアドレスのリスト
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN (
  'rikunagayasu34+test@gmail.com',
  'friend1@example.com',
  'friend2@example.com'
);
```

## まとめ

**最も簡単な方法**:
1. Supabaseダッシュボード → **Authentication** → **Users**
2. ユーザーをクリック
3. 右側のパネルの **"Send Magic Link"** → **"Send magic link"** をクリック

**即座に解決したい場合**:
1. Supabaseダッシュボード → **SQL Editor**
2. 以下のSQLを実行：
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'rikunagayasu34+test@gmail.com';
```

