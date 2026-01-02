-- watchlistテーブルにstreaming_sitesカラムを追加
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS streaming_sites JSONB DEFAULT '[]';

-- コメント追加
COMMENT ON COLUMN watchlist.streaming_sites IS '配信サイト情報（JSONB形式）';

