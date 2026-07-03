-- ============================================================
-- 04: 追加の CHECK 制約 (任意)
-- ============================================================
-- データ整合性をさらに固めるための CHECK 制約。既存データに違反行が
-- あると ALTER が失敗するため、下の確認クエリで 0 件を確かめてから追加する。
-- (animes_rating_check は既に legacy/supabase_fix_rating_constraint.sql で適用済み)
-- ============================================================

-- --- 事前確認 (それぞれ 0 件であること) ---
-- 空タイトル
SELECT 'animes.empty_title' AS check, count(*) FROM animes WHERE title = '';
SELECT 'watchlist.empty_title' AS check, count(*) FROM watchlist WHERE title = '';
-- 負の周回数
SELECT 'animes.negative_rewatch' AS check, count(*) FROM animes WHERE rewatch_count < 0;

-- --- 制約追加 (上が全て 0 件のときのみ) ---
ALTER TABLE animes
  ADD CONSTRAINT animes_title_nonempty CHECK (title <> '');
ALTER TABLE animes
  ADD CONSTRAINT animes_rewatch_count_nonneg CHECK (rewatch_count >= 0);
ALTER TABLE watchlist
  ADD CONSTRAINT watchlist_title_nonempty CHECK (title <> '');
