-- ユーザーハンドル（@で始まるID）機能の追加
-- Instagramのような@ハンドルを設定できるようにする

-- user_profilesテーブルにhandleカラムを追加
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;

-- handleカラムにインデックスを追加（検索を高速化）
CREATE INDEX IF NOT EXISTS idx_user_profiles_handle 
ON public.user_profiles(handle) 
WHERE handle IS NOT NULL;

-- 公開ユーザーのhandle検索用インデックス
CREATE INDEX IF NOT EXISTS idx_user_profiles_handle_public 
ON public.user_profiles(handle) 
WHERE is_public = true AND handle IS NOT NULL;

-- 既存のユーザーに対して、usernameをベースにhandleを自動生成（オプション）
-- 注意: このUPDATE文は既存データがある場合のみ実行してください
-- UPDATE public.user_profiles 
-- SET handle = LOWER(REPLACE(username, ' ', '_'))
-- WHERE handle IS NULL;

-- 制約: handleは英数字、アンダースコア、ハイフンのみ許可（小文字に変換）
-- 注意: この制約はアプリケーション側でバリデーションすることを推奨
-- データベース側で制約を追加する場合は以下のようにできます：
-- ALTER TABLE public.user_profiles 
-- ADD CONSTRAINT handle_format_check 
-- CHECK (handle ~ '^[a-z0-9_]+$');

-- 使用方法:
-- 1. Supabase Dashboardにログイン
-- 2. SQL Editorを開く
-- 3. このファイルの内容をコピー＆ペースト
-- 4. 実行ボタンをクリック
--
-- 注意事項:
-- - handleはユニーク（重複不可）です
-- - handleはNULLを許可します（設定されていない場合）
-- - handleは@なしで保存し、表示時に@を付けます

