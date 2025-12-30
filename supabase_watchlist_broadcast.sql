-- watchlistテーブルに放送情報カラムを追加
-- broadcast_day: 曜日（0-6、0=日曜）
-- broadcast_time: 時間（HH:mm形式）

DO $$ 
BEGIN
  -- broadcast_dayカラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' AND column_name = 'broadcast_day'
  ) THEN
    ALTER TABLE watchlist ADD COLUMN broadcast_day INTEGER CHECK (broadcast_day >= 0 AND broadcast_day <= 6);
  END IF;
END $$;

DO $$ 
BEGIN
  -- broadcast_timeカラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' AND column_name = 'broadcast_time'
  ) THEN
    ALTER TABLE watchlist ADD COLUMN broadcast_time TEXT;
  END IF;
END $$;

-- インデックス追加（並び替え用）
CREATE INDEX IF NOT EXISTS idx_watchlist_broadcast ON watchlist(user_id, broadcast_day, broadcast_time) 
WHERE broadcast_day IS NOT NULL AND broadcast_time IS NOT NULL;

