-- ============================================================
-- 03: UNIQUE 制約の追加 (スキーマ変更)
-- ============================================================
-- 01/02 で重複が 0 件になったことを確認してから実行する。
-- 「同一ユーザーが同じ AniList 作品を二重登録する」バグを
-- アプリのコードに関わらず DB レベルで防ぐ最後の砦。
--
-- これは正式なスキーマ変更なので、CLI 運用では以下でマイグレーション化する:
--   supabase migration new add_unique_constraints
--   # 生成された supabase/migrations/<ts>_add_unique_constraints.sql に本文を貼る
--   supabase db push
-- Dashboard 手動運用なら SQL Editor に貼って実行してもよい。
--
-- 注: CREATE INDEX は既定でテーブルを短時間ロックする。個人アプリ規模なら問題ないが、
--     大規模テーブルでロックを避けたい場合は CONCURRENTLY を使う
--     (ただし CONCURRENTLY はトランザクション内で実行できないため db push では不可、
--      Dashboard で単独実行すること)。
-- ============================================================

-- animes: (user_id, anilist_id) の部分ユニークインデックス。
-- anilist_id が NULL の手動追加作品は一意性の対象外 (複数許可)。
CREATE UNIQUE INDEX IF NOT EXISTS uq_animes_user_anilist
  ON animes (user_id, anilist_id)
  WHERE anilist_id IS NOT NULL;

-- watchlist: (user_id, anilist_id) の部分ユニークインデックス。
-- 手動追加センチネル anilist_id = -1 は一意性の対象外 (複数許可)。
CREATE UNIQUE INDEX IF NOT EXISTS uq_watchlist_user_anilist
  ON watchlist (user_id, anilist_id)
  WHERE anilist_id <> -1;
