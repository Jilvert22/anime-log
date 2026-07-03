-- 感想テーブル
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('overall', 'episode')),
  episode_number INTEGER,
  content TEXT NOT NULL,
  contains_spoiler BOOLEAN DEFAULT false,
  spoiler_hidden BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいね管理テーブル
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 役に立った管理テーブル
CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_reviews_anime_id ON reviews(anime_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

-- 感想テーブルのRLSポリシー
-- すべてのユーザーが感想を閲覧可能
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT
  USING (true);

-- ログインユーザーのみ感想を投稿可能
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分の感想のみ更新可能
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分の感想のみ削除可能
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- いいねテーブルのRLSポリシー
-- すべてのユーザーがいいねを閲覧可能
CREATE POLICY "Anyone can view review likes" ON review_likes
  FOR SELECT
  USING (true);

-- ログインユーザーのみいいねを追加可能
CREATE POLICY "Users can insert their own likes" ON review_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のいいねのみ削除可能
CREATE POLICY "Users can delete their own likes" ON review_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 役に立ったテーブルのRLSポリシー
-- すべてのユーザーが役に立ったを閲覧可能
CREATE POLICY "Anyone can view review helpful" ON review_helpful
  FOR SELECT
  USING (true);

-- ログインユーザーのみ役に立ったを追加可能
CREATE POLICY "Users can insert their own helpful" ON review_helpful
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分の役に立ったのみ削除可能
CREATE POLICY "Users can delete their own helpful" ON review_helpful
  FOR DELETE
  USING (auth.uid() = user_id);

-- トリガー: いいね数と役に立った数を自動更新
CREATE OR REPLACE FUNCTION update_review_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'review_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE reviews SET likes = likes + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE reviews SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.review_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'review_helpful' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- いいねテーブルのトリガー
DROP TRIGGER IF EXISTS trigger_update_review_likes ON review_likes;
CREATE TRIGGER trigger_update_review_likes
  AFTER INSERT OR DELETE ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_counts();

-- 役に立ったテーブルのトリガー
DROP TRIGGER IF EXISTS trigger_update_review_helpful ON review_helpful;
CREATE TRIGGER trigger_update_review_helpful
  AFTER INSERT OR DELETE ON review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_review_counts();

