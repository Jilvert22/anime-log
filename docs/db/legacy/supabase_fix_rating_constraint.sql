-- animesテーブルのratingカラムのCHECK制約を修正
-- ratingが0（未評価）の場合も許可するようにする

-- 既存のCHECK制約を削除（存在する場合）
ALTER TABLE animes 
DROP CONSTRAINT IF EXISTS animes_rating_check;

-- 新しいCHECK制約を追加（1-5の範囲、またはNULLを許可）
ALTER TABLE animes 
ADD CONSTRAINT animes_rating_check 
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- 確認用クエリ
-- SELECT 
--   constraint_name, 
--   check_clause 
-- FROM information_schema.check_constraints 
-- WHERE table_name = 'animes' 
-- AND constraint_name LIKE '%rating%';

