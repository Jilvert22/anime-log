# Vercel環境変数設定ガイド

## 必要な環境変数

以下の環境変数をVercelのプロジェクト設定に追加してください：

### 1. VAPID Keys（プッシュ通知用）

- **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`**
  - 値: `BFlE9HJsMGg2IPtiIdBqobT7PpDmui0QM5jh9ZjOlXLz4SWUhaxptIUz__aXA5MTrWWxwyfjg4snBKunNyOKXTM`
  - 環境: Production, Preview, Development すべて

- **`VAPID_PRIVATE_KEY`**
  - 値: `.env.local`ファイルを参照してください（秘密情報のため、このファイルには記載しません）
  - 環境: Production, Preview, Development すべて
  - ⚠️ **注意**: このキーは秘密情報です。GitHubなどに公開しないでください。

### 2. 設定手順

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」に移動
4. 上記の環境変数を追加
5. 各環境変数に対して、適用する環境（Production, Preview, Development）を選択
6. 「Save」をクリック

### 3. デプロイ後の確認

デプロイ後、以下のコマンドで環境変数が正しく設定されているか確認できます：

```bash
# Vercel CLIを使用
vercel env ls
```

または、アプリケーション内で以下を確認：

```javascript
console.log('VAPID Public Key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
```

### 4. 既存の環境変数

以下の環境変数も設定されていることを確認してください：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## 注意事項

- VAPIDキーは再生成されています。以前のキーは無効です。
- 本番環境にデプロイする前に、必ずVercelの環境変数を更新してください。
- 環境変数を変更した後は、再デプロイが必要です。

