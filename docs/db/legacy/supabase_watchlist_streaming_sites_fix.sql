-- watchlistテーブルにstreaming_sitesカラムを追加（型をTEXT[]に統一）
-- 既存のJSONBカラムがある場合は削除して再作成

DO $$ 
BEGIN
  -- 既存のJSONBカラムがある場合は削除
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' 
    AND column_name = 'streaming_sites'
    AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE watchlist DROP COLUMN streaming_sites;
  END IF;
  
  -- TEXT[]カラムを追加（存在しない場合のみ）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' 
    AND column_name = 'streaming_sites'
  ) THEN
    ALTER TABLE watchlist 
    ADD COLUMN streaming_sites TEXT[] DEFAULT NULL;
  END IF;
END $$;

-- コメント追加
COMMENT ON COLUMN watchlist.streaming_sites IS '配信サイト情報（配列形式）';

