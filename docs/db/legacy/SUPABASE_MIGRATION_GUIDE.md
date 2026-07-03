# Supabaseマイグレーションガイド

## 実装済み機能のSupabase対応

### 1. 積みアニメに配信情報追加

#### 必要なマイグレーション

**ファイル**: `supabase_watchlist_streaming_sites_fix.sql`

```sql
-- watchlistテーブルにstreaming_sitesカラムを追加（TEXT[]型）
-- 既存のJSONBカラムがある場合は削除して再作成
```

**実行方法**:
1. Supabase DashboardのSQL Editorを開く
2. `supabase_watchlist_streaming_sites_fix.sql`の内容を実行

**確認方法**:
```sql
-- カラムが正しく追加されているか確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlist' 
AND column_name = 'streaming_sites';
-- 結果: streaming_sites | text[]
```

#### 既存のSQLファイル

- `supabase_add_streaming_sites.sql` - 既存（JSONB型）
- `supabase_watchlist_streaming_sites_fix.sql` - 新規（TEXT[]型に統一）

**注意**: 既存のJSONBカラムがある場合は、`supabase_watchlist_streaming_sites_fix.sql`を実行してTEXT[]型に統一してください。

### 2. animesテーブルの配信情報

**ファイル**: `supabase_add_streaming_sites_to_animes.sql`（既存）

このファイルは既に`streaming_sites TEXT[]`として定義されているため、追加の作業は不要です。

### 3. 詳細モーダルの情報品質向上（任意）

Annictから取得した日本語あらすじや放送情報をDBに保存する場合は、以下のマイグレーションを実行してください。

#### オプション1: watchlistテーブルに追加情報を保存

```sql
-- watchlistテーブルに日本語あらすじと放送情報を追加（任意）
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS synopsis_ja TEXT,
ADD COLUMN IF NOT EXISTS broadcast_info TEXT;

COMMENT ON COLUMN watchlist.synopsis_ja IS 'Annictから取得した日本語あらすじ';
COMMENT ON COLUMN watchlist.broadcast_info IS 'Annictから取得した放送情報';
```

#### オプション2: animesテーブルに追加情報を保存

```sql
-- animesテーブルに日本語あらすじと放送情報を追加（任意）
ALTER TABLE animes 
ADD COLUMN IF NOT EXISTS synopsis_ja TEXT,
ADD COLUMN IF NOT EXISTS broadcast_info TEXT;

COMMENT ON COLUMN animes.synopsis_ja IS 'Annictから取得した日本語あらすじ';
COMMENT ON COLUMN animes.broadcast_info IS 'Annictから取得した放送情報';
```

**注意**: 現在の実装では、これらの情報は検索時に取得して表示するだけで、DBには保存していません。DBに保存する場合は、実装コードも更新する必要があります。

## マイグレーション実行順序

1. **必須**: `supabase_watchlist_streaming_sites_fix.sql` を実行
2. **確認**: `supabase_add_streaming_sites_to_animes.sql` が既に実行されているか確認
3. **任意**: 日本語あらすじ・放送情報をDBに保存する場合は、上記のオプションSQLを実行

## トラブルシューティング

### エラー: "column already exists"

既にカラムが存在する場合は、以下のSQLで確認してください：

```sql
-- watchlistテーブルのカラム一覧を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'watchlist'
ORDER BY ordinal_position;
```

### 型の不一致エラー

`streaming_sites`がJSONB型の場合は、`supabase_watchlist_streaming_sites_fix.sql`を実行してTEXT[]型に変更してください。

## 確認クエリ

マイグレーション後、以下のクエリで確認できます：

```sql
-- watchlistテーブルの構造確認
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'watchlist'
AND column_name IN ('streaming_sites', 'synopsis_ja', 'broadcast_info')
ORDER BY column_name;

-- animesテーブルの構造確認
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'animes'
AND column_name IN ('streaming_sites', 'synopsis_ja', 'broadcast_info')
ORDER BY column_name;
```

