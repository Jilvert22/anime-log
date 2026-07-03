# エラー原因特定ガイド

## 1. ブラウザのコンソールで確認

### 手順
1. ブラウザで `F12` を押して開発者ツールを開く
2. 「Console」タブを選択
3. クール検索でアニメを登録しようとする
4. コンソールに表示されるログを確認

### 確認すべき情報
- `🔍 Supabase Insert Debug` グループ内のログ
- `📊 送信データ`: 送信しようとしているデータ
- `❌ Supabase Error`: エラーオブジェクト
- `📋 Error Properties`: エラーの詳細（message, details, hint, code）

## 2. ネットワークタブで確認

### 手順
1. 開発者ツールの「Network」タブを開く
2. クール検索でアニメを登録しようとする
3. `animes` という名前のリクエストを探す
4. リクエストをクリックして詳細を確認

### 確認すべき情報
- **Request Payload**: 送信されたデータ
- **Response**: サーバーからのレスポンス
- **Status Code**: HTTPステータスコード（200以外はエラー）
- **Response Body**: エラーメッセージが含まれている可能性

## 3. Supabaseダッシュボードで確認

### 3-1. テーブル構造の確認
1. Supabaseダッシュボードにログイン
2. 左サイドバーから「Table Editor」を選択
3. `animes` テーブルを選択
4. テーブル構造を確認

### 確認すべき項目
- `id`: UUID型、PRIMARY KEY、DEFAULT: `uuid_generate_v4()`
- `user_id`: UUID型、NOT NULL
- `title`: TEXT型、NOT NULL
- `rating`: INTEGER型（NULL許可可能）
- `watched`: BOOLEAN型
- `rewatch_count`: INTEGER型
- `tags`: ARRAY型またはJSONB型
- `songs`: JSONB型
- `quotes`: JSONB型
- `series_name`: TEXT型（NULL許可可能）
- `season_name`: TEXT型（NULL許可可能）

### 3-2. RLSポリシーの確認
1. Supabaseダッシュボードで「Authentication」→「Policies」を選択
2. `animes` テーブルのポリシーを確認

### 確認すべきポリシー
- **INSERT**: ログインユーザーが自分のデータを挿入できる
- **SELECT**: ログインユーザーが自分のデータを読み取れる
- **UPDATE**: ログインユーザーが自分のデータを更新できる
- **DELETE**: ログインユーザーが自分のデータを削除できる

### 3-3. ログの確認
1. Supabaseダッシュボードで「Logs」を選択
2. 「API Logs」または「Database Logs」を確認
3. エラーが発生した時刻のログを確認

## 4. よくある原因と対処法

### 原因1: RLSポリシーが設定されていない
**症状**: `new row violates row-level security policy` というエラー

**対処法**:
```sql
-- animesテーブルのRLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'animes';

-- ポリシーがない場合は作成
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own animes" ON animes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 原因2: データ型の不一致
**症状**: `column "xxx" is of type xxx but expression is of type xxx` というエラー

**対処法**: テーブル定義と送信データの型を確認

### 原因3: 必須カラムの欠落
**症状**: `null value in column "xxx" violates not-null constraint` というエラー

**対処法**: 必須カラムに値が入っているか確認

### 原因4: 外部キー制約違反
**症状**: `insert or update on table "animes" violates foreign key constraint` というエラー

**対処法**: 参照先のテーブル（例: `auth.users`）にデータが存在するか確認

## 5. デバッグ用SQLクエリ

SupabaseのSQL Editorで以下を実行して、テーブル構造を確認：

```sql
-- テーブル構造を確認
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'animes'
ORDER BY ordinal_position;

-- RLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'animes';

-- 最近のエラーを確認（PostgreSQLログから）
-- 注意: これはSupabaseのログ機能で確認する必要があります
```

## 6. 一時的な回避策（デバッグ用）

RLSを一時的に無効化してテスト（本番環境では使用しない）：

```sql
-- 注意: これはデバッグ用のみ。本番では使用しない
ALTER TABLE animes DISABLE ROW LEVEL SECURITY;
```

テスト後は必ず有効化：
```sql
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
```

