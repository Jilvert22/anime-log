-- 公開プロフィール用の「公開視聴記録」ビュー。
--
-- 背景: animes は RLS で本人のみ SELECT 可のため、他人(や未ログインのクローラ)が
-- 公開プロフィールを開いても視聴記録が読めない。公開プロフィール(is_public=true)の
-- 「視聴済み(watched=true)」の作品だけ、しかも公開してよい列だけを露出するビューを作る。
--
-- 公開する列: title / image / rating / season_name / anilist_id（+ 並び用 created_at, 結合用 user_id）。
-- 公開しない: memo/quotes/songs/tags/studios 等（個人的メモは出さない）。
--
-- セキュリティ: ビューはデフォルトで定義者(postgres)権限で動くため animes の RLS を
-- バイパスするが、WHERE で is_public=true に限定しているので公開対象だけが見える。
-- security_invoker は付けない（付けると anon が animes を読めずビューが空になる）。
--
-- 適用方法: Supabase Dashboard → SQL Editor に貼って実行。

CREATE OR REPLACE VIEW public_animes AS
SELECT
  a.id,
  a.user_id,
  a.season_name,
  a.title,
  a.image,
  a.rating,
  a.anilist_id,
  a.created_at
FROM animes a
JOIN user_profiles p ON p.id = a.user_id
WHERE p.is_public = true
  AND a.watched = true;

-- 公開読み取りを許可（PostgREST 経由で anon / authenticated が SELECT 可能に）
GRANT SELECT ON public_animes TO anon, authenticated;
