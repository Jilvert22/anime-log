-- watchlistテーブルに今シーズン視聴予定機能用のカラムを追加
-- Phase 1: データベーススキーマ変更

-- statusカラムを追加（enum型）
-- 'planned': 視聴予定
-- 'watching': 視聴中
-- 'completed': 視聴完了
-- NULL: 従来の積みアニメ（後方互換性のため）
DO $$ 
BEGIN
  -- statusカラムが存在しない場合のみ追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' AND column_name = 'status'
  ) THEN
    ALTER TABLE watchlist ADD COLUMN status TEXT CHECK (status IN ('planned', 'watching', 'completed'));
  END IF;
END $$;

-- season_yearカラムを追加（例: 2025）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' AND column_name = 'season_year'
  ) THEN
    ALTER TABLE watchlist ADD COLUMN season_year INTEGER;
  END IF;
END $$;

-- seasonカラムを追加（'WINTER' / 'SPRING' / 'SUMMER' / 'FALL'）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watchlist' AND column_name = 'season'
  ) THEN
    ALTER TABLE watchlist ADD COLUMN season TEXT CHECK (season IN ('WINTER', 'SPRING', 'SUMMER', 'FALL'));
  END IF;
END $$;

-- インデックス追加（今シーズンの視聴予定アニメを高速検索するため）
CREATE INDEX IF NOT EXISTS idx_watchlist_status_season ON watchlist(user_id, status, season_year, season) 
WHERE status IS NOT NULL AND season_year IS NOT NULL AND season IS NOT NULL;

-- 既存データのデフォルト値設定（既存の積みアニメはstatus=NULLのまま）


