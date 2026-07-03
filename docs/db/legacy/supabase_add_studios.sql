-- animesテーブルにstudiosカラムを追加
ALTER TABLE animes
ADD COLUMN IF NOT EXISTS studios TEXT[];

-- 既存データのstudiosカラムがNULLの場合は空配列に設定（オプション）
-- UPDATE animes SET studios = '{}' WHERE studios IS NULL;

