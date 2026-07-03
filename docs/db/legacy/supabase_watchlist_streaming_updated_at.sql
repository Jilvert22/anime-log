-- watchlistテーブルにstreaming_updated_atカラムを追加

DO $$ 
BEGIN
  -- streaming_updated_atカラムを追加（存在しない場合のみ）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' 
    AND column_name = 'streaming_updated_at'
  ) THEN
    ALTER TABLE watchlist 
    ADD COLUMN streaming_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;
END $$;

-- コメント追加
COMMENT ON COLUMN watchlist.streaming_updated_at IS '配信情報の最終更新日時';

