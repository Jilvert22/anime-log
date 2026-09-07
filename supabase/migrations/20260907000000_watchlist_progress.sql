-- 2026-09-07: 所有者の依頼によりCLIで適用するマイグレーション。
-- 既存RLS・権限を維持。既存行は0話・総話数未設定になる。
BEGIN;
ALTER TABLE public.watchlist
  ADD COLUMN watched_episodes integer NOT NULL DEFAULT 0,
  ADD COLUMN total_episodes integer;
ALTER TABLE public.watchlist
  ADD CONSTRAINT watchlist_progress_bounds CHECK (
    watched_episodes BETWEEN 0 AND 100000
    AND (total_episodes IS NULL OR (
      total_episodes BETWEEN 1 AND 100000 AND watched_episodes <= total_episodes
    ))
  );
COMMIT;
