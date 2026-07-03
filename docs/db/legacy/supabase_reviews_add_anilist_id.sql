-- reviews テーブルに anilist_id と anime_title を追加（将来の「作品単位の感想集約」用）。
--
-- 背景: reviews は公開読み取り可(Anyone can view)だが、anime_id はユーザー固有の animes 行を
-- 指すため作品単位に集約できない。また animes 本体は非公開RLSなので、公開ページで作品名を出すには
-- review 側に作品名を denormalize しておく必要がある。
--   - anilist_id: 作品単位の集約キー（GROUP BY anilist_id）
--   - anime_title: 公開集約ページで作品名表示（animesを読まずに済む）
--
-- 既存行はNULLのまま。新規投稿分に値が入る。既存のRLSポリシーは変更しない。
--
-- 適用方法: Supabase Dashboard → SQL Editor にこの内容を貼って実行。
-- ※このマイグレを適用してから、これらを書き込むアプリ版をデプロイすること（NULL許容なので既存版には無害）。

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS anilist_id integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS anime_title text;

CREATE INDEX IF NOT EXISTS idx_reviews_anilist_id ON reviews(anilist_id);
