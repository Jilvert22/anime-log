-- ユーザー検索機能のためのインデックス設定
-- ID検索とユーザー名検索を効率的に行うためのインデックスを追加

-- 注意事項:
-- 1. user_profilesテーブルのidカラムはauth.users.idを参照しているため、
--    既に主キーインデックスが存在し、ID検索は高速です
-- 2. ユーザー名検索を高速化するために、以下のインデックスを追加します

-- 公開ユーザーのユーザー名検索用インデックス
-- これにより、is_public = trueの条件付きでユーザー名検索が高速化されます
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_public 
ON public.user_profiles(username) 
WHERE is_public = true;

-- より高度な検索（部分一致検索）を高速化する場合:
-- pg_trgm拡張機能を使用すると、ILIKE検索がより高速になります
-- 以下のコマンドで拡張機能を有効化してください：
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pg_trgm拡張機能を有効化した後、以下のインデックスを追加できます：
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_username_gin 
-- ON public.user_profiles USING gin(username gin_trgm_ops) 
-- WHERE is_public = true;

-- 使用方法:
-- 1. Supabase Dashboardにログイン
-- 2. SQL Editorを開く
-- 3. このファイルの内容をコピー＆ペースト
-- 4. 実行ボタンをクリック
--
-- または、pg_trgm拡張機能を使用する場合:
-- 1. まず "CREATE EXTENSION IF NOT EXISTS pg_trgm;" を実行
-- 2. その後、上記のginインデックスを作成

