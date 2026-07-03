-- 配信情報更新日時カラムの追加

-- animesテーブルに配信情報更新日時を追加
ALTER TABLE animes ADD COLUMN IF NOT EXISTS streaming_updated_at TIMESTAMP WITH TIME ZONE;

-- watchlistテーブルに配信情報更新日時を追加
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS streaming_updated_at TIMESTAMP WITH TIME ZONE;

