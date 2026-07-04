-- ============================================================
-- (user_id, anilist_id) の UNIQUE 制約 + 基本的な CHECK 制約
-- ============================================================
-- 適用前提: docs/db/legacy/01_check_duplicates.sql で重複を確認済み
--   (2026-07-04: animes の anilist_id=16498 重複 55 件を 02_repair のロジックで削除して 0 件化)。
-- 空タイトル / 負の周回数の事前確認クエリも全て 0 件を確認済み。
--
-- animes_rating_check は既に legacy/supabase_fix_rating_constraint.sql で適用済みのため
-- ここには含めない。
-- ============================================================

-- --- UNIQUE 制約 (03) ---
-- animes: anilist_id が NULL の手動追加は対象外 (複数許可)。
CREATE UNIQUE INDEX IF NOT EXISTS uq_animes_user_anilist
  ON animes (user_id, anilist_id)
  WHERE anilist_id IS NOT NULL;

-- watchlist: 手動追加センチネル anilist_id = -1 は対象外 (複数許可)。
CREATE UNIQUE INDEX IF NOT EXISTS uq_watchlist_user_anilist
  ON watchlist (user_id, anilist_id)
  WHERE anilist_id <> -1;

-- --- CHECK 制約 (04) ---
ALTER TABLE animes
  ADD CONSTRAINT animes_title_nonempty CHECK (title <> '');
ALTER TABLE animes
  ADD CONSTRAINT animes_rewatch_count_nonneg CHECK (rewatch_count >= 0);
ALTER TABLE watchlist
  ADD CONSTRAINT watchlist_title_nonempty CHECK (title <> '');
