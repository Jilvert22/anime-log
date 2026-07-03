-- 積みアニメテーブル
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anilist_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  image TEXT,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at DESC);

-- RLS (Row Level Security) ポリシー
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- 自分の積みアニメのみ閲覧可能
CREATE POLICY "Users can view their own watchlist" ON watchlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- ログインユーザーのみ積みアニメを追加可能
CREATE POLICY "Users can insert their own watchlist" ON watchlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分の積みアニメのみ更新可能
CREATE POLICY "Users can update their own watchlist" ON watchlist
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分の積みアニメのみ削除可能
CREATE POLICY "Users can delete their own watchlist" ON watchlist
  FOR DELETE
  USING (auth.uid() = user_id);

