-- ============================================================
-- 02: 重複修復 (破壊的・冪等)
-- ============================================================
-- 01 で重複が見つかった場合のみ実行する。
-- 各 (user_id, anilist_id) について created_at が最も古い1件を残し、
-- 残りを削除する (タイトルベースの既存 remove-duplicate ではなく anilist_id ベース)。
--
-- ⚠️ 注意:
--   - animes を削除すると reviews が ON DELETE CASCADE で連動削除される。
--     残す1件に感想が付いていない場合、感想が消える可能性がある。
--     重要なデータがある場合は事前にバックアップを取ること。
--   - watchlist を削除する際、notification_settings.watchlist_id が
--     その行を参照していると FK 違反になる (現状 ON DELETE 未設定)。
--     その場合は 02b を先に実行するか、該当 notification を先に消すこと。
--   - トランザクションで囲んで実行し、削除件数を確認してから COMMIT すると安全。
-- ============================================================

BEGIN;

-- animes: (user_id, anilist_id) ごとに最古を残して削除
DELETE FROM animes a
USING (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, anilist_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM animes
  WHERE anilist_id IS NOT NULL
) dup
WHERE a.id = dup.id
  AND dup.rn > 1;

-- watchlist: 同様 (-1 センチネル除外)
DELETE FROM watchlist w
USING (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, anilist_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM watchlist
  WHERE anilist_id <> -1
) dup
WHERE w.id = dup.id
  AND dup.rn > 1;

-- 削除結果を確認してから COMMIT に変更する (確認用に一旦 ROLLBACK 推奨)
ROLLBACK;
-- COMMIT;
