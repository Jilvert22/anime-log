-- ============================================================
-- 01: 重複チェック (SELECT のみ・破壊的操作なし)
-- ============================================================
-- UNIQUE 制約を追加する前に、既存データに (user_id, anilist_id) の
-- 重複が無いかを確認する。1件でも返ってきたら 02_repair を実行する。
--
-- 実行: Supabase Dashboard → SQL Editor に貼り付けて実行、
--       または `supabase db execute --file docs/db/migrations-pending/01_check_duplicates.sql`
-- ============================================================

-- animes: 同一ユーザーが同じ AniList 作品を重複登録していないか
-- (anilist_id が NULL の手動追加は対象外)
SELECT 'animes' AS table_name, user_id, anilist_id, count(*) AS cnt
FROM animes
WHERE anilist_id IS NOT NULL
GROUP BY user_id, anilist_id
HAVING count(*) > 1
ORDER BY cnt DESC;

-- watchlist: 同様。手動追加センチネル anilist_id = -1 は対象外
SELECT 'watchlist' AS table_name, user_id, anilist_id, count(*) AS cnt
FROM watchlist
WHERE anilist_id <> -1
GROUP BY user_id, anilist_id
HAVING count(*) > 1
ORDER BY cnt DESC;
