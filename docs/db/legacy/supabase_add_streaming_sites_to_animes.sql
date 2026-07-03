-- animesテーブルにstreaming_sitesカラムを追加
ALTER TABLE animes 
ADD COLUMN IF NOT EXISTS streaming_sites TEXT[] DEFAULT NULL;

-- コメント追加
COMMENT ON COLUMN animes.streaming_sites IS '配信サイト情報（配列形式）';

