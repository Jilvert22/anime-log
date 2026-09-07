-- 2026-09-07: 所有者の依頼によりCLIで適用するマイグレーション。
-- 前提: 20260907000000_watchlist_progress.sql および既存の UNIQUE 制約。
-- 既存行の変更・削除なし。通常の追加では import_key は NULL のまま。
BEGIN;
ALTER TABLE public.animes ADD COLUMN import_key text;
ALTER TABLE public.watchlist ADD COLUMN import_key text;
CREATE UNIQUE INDEX animes_user_import_key ON public.animes(user_id, import_key) WHERE import_key IS NOT NULL;
CREATE UNIQUE INDEX watchlist_user_import_key ON public.watchlist(user_id, import_key) WHERE import_key IS NOT NULL;

CREATE FUNCTION public.import_record_bundle(expected_user_id uuid, anime_records jsonb, watchlist_records jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  anime_count integer;
  watchlist_count integer;
BEGIN
  IF owner_id IS NULL OR expected_user_id IS DISTINCT FROM owner_id THEN
    RAISE EXCEPTION 'Authentication changed' USING ERRCODE = '42501';
  END IF;
  IF anime_records IS NULL OR watchlist_records IS NULL
     OR jsonb_typeof(anime_records) <> 'array' OR jsonb_typeof(watchlist_records) <> 'array' THEN
    RAISE EXCEPTION 'Invalid record arrays' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(anime_records) + jsonb_array_length(watchlist_records) > 5000
     OR octet_length(anime_records::text) + octet_length(watchlist_records::text) > 5242880 THEN
    RAISE EXCEPTION 'Import limit exceeded' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(anime_records || watchlist_records) AS source(row)
    WHERE jsonb_typeof(row) <> 'object' OR row->>'import_key' IS NULL
      OR row->>'import_key' !~ '^[a-f0-9]{64}$'
      OR coalesce(btrim(row->>'title'), '') = ''
  ) THEN
    RAISE EXCEPTION 'Invalid import key or title' USING ERRCODE = '22023';
  END IF;

  -- 提供された id / user_id は採用しない。既存のRLSとDB制約をそのまま使う。
  INSERT INTO public.animes (user_id, anilist_id, season_name, title, image, rating, watched,
    rewatch_count, tags, songs, quotes, series_name, studios, streaming_sites, streaming_updated_at, import_key, is_public)
  SELECT owner_id, r.anilist_id, r.season_name, r.title, r.image, r.rating, r.watched,
    r.rewatch_count, r.tags, r.songs, r.quotes, r.series_name, r.studios, r.streaming_sites, r.streaming_updated_at, r.import_key, false
  FROM jsonb_to_recordset(anime_records) AS r(anilist_id integer, season_name text, title text, image text,
    rating integer, watched boolean, rewatch_count integer, tags text[], songs jsonb, quotes jsonb,
    series_name text, studios text[], streaming_sites jsonb, streaming_updated_at timestamptz, import_key text)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS anime_count = ROW_COUNT;

  INSERT INTO public.watchlist (user_id, anilist_id, title, image, memo, status, season_year, season,
    broadcast_day, broadcast_time, streaming_sites, streaming_updated_at, watched_episodes, total_episodes, created_at, import_key)
  SELECT owner_id, r.anilist_id, r.title, r.image, r.memo, r.status, r.season_year, r.season,
    r.broadcast_day, r.broadcast_time, r.streaming_sites, r.streaming_updated_at, r.watched_episodes, r.total_episodes, r.created_at, r.import_key
  FROM jsonb_to_recordset(watchlist_records) AS r(anilist_id integer, title text, image text, memo text,
    status text, season_year integer, season text, broadcast_day integer, broadcast_time text,
    streaming_sites text[], streaming_updated_at timestamptz, watched_episodes integer, total_episodes integer, created_at timestamptz, import_key text)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS watchlist_count = ROW_COUNT;
  -- 2回目のINSERTを含む任意の例外で、この関数内の変更全体がロールバックされる。
  RETURN jsonb_build_object('animes_added', anime_count, 'watchlist_added', watchlist_count);
END;
$$;
REVOKE ALL ON FUNCTION public.import_record_bundle(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_record_bundle(uuid, jsonb, jsonb) TO authenticated;
COMMIT;
