\set ON_ERROR_STOP on
-- 空のローカル検証DB専用。本番スキーマの完全な再現ではない。
DO $$ BEGIN IF current_database() <> 'record_import_test' THEN RAISE EXCEPTION 'Use record_import_test only'; END IF; END $$;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO authenticated, anon;
CREATE TABLE public.animes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, anilist_id integer,
  season_name text NOT NULL, title text NOT NULL, image text, rating integer CHECK (rating BETWEEN 1 AND 5),
  is_public boolean DEFAULT true, watched boolean NOT NULL DEFAULT false, rewatch_count integer NOT NULL DEFAULT 0,
  tags text[], songs jsonb, quotes jsonb, series_name text, studios text[], streaming_sites jsonb, streaming_updated_at timestamptz
);
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, anilist_id integer NOT NULL,
  title text NOT NULL, image text, memo text, status text, season_year integer, season text,
  broadcast_day integer, broadcast_time text, streaming_sites text[], streaming_updated_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX anime_identity ON public.animes(user_id, anilist_id) WHERE anilist_id IS NOT NULL;
CREATE UNIQUE INDEX watchlist_identity ON public.watchlist(user_id, anilist_id) WHERE anilist_id <> -1;
ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_animes ON public.animes TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY public_animes_select ON public.animes FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY own_watchlist ON public.watchlist TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animes, public.watchlist TO authenticated;
\ir ../../supabase/migrations/20260907000000_watchlist_progress.sql
\ir ../../supabase/migrations/20260907000100_record_import.sql

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
DO $$
DECLARE
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  anime jsonb := jsonb_build_object('import_key', repeat('a',64), 'user_id', b, 'anilist_id',123,'season_name','2026年夏','title','星の旅人','rating',5,'watched',true,'rewatch_count',0,'streaming_sites',jsonb_build_array('配信サービス'));
  watch jsonb := jsonb_build_object('import_key', repeat('b',64),'anilist_id',-1,'title','手動1','watched_episodes',7,'total_episodes',12,'broadcast_time','25:30');
  result jsonb;
BEGIN
  result := public.import_record_bundle(a, jsonb_build_array(anime), jsonb_build_array(watch));
  IF result <> '{"animes_added":1,"watchlist_added":1}'::jsonb THEN RAISE EXCEPTION 'wrong inserted counts'; END IF;
  IF EXISTS (SELECT 1 FROM animes WHERE is_public IS DISTINCT FROM false) THEN RAISE EXCEPTION 'imported records became public'; END IF;
  IF EXISTS (SELECT 1 FROM animes WHERE user_id <> a) THEN RAISE EXCEPTION 'accepted supplied owner'; END IF;
  IF (SELECT streaming_sites FROM animes WHERE anilist_id=123) <> '["配信サービス"]'::jsonb THEN RAISE EXCEPTION 'lost anime streaming sites'; END IF;
  IF (SELECT broadcast_time FROM watchlist) <> '25:30' THEN RAISE EXCEPTION 'lost broadcast time'; END IF;
  result := public.import_record_bundle(a, jsonb_build_array(anime), jsonb_build_array(watch));
  IF result <> '{"animes_added":0,"watchlist_added":0}'::jsonb THEN RAISE EXCEPTION 'retry duplicated records'; END IF;
  result := public.import_record_bundle(a, jsonb_build_array(anime || '{"rating":1}'::jsonb), '[]');
  IF (SELECT rating FROM animes WHERE anilist_id=123) <> 5 THEN RAISE EXCEPTION 'overwrote existing rating'; END IF;
  result := public.import_record_bundle(a, '[]', jsonb_build_array(watch || jsonb_build_object('import_key',repeat('c',64),'title','手動2')));
  IF result->>'watchlist_added' <> '1' OR (SELECT count(*) FROM watchlist) <> 2 THEN RAISE EXCEPTION 'merged manual records'; END IF;

  BEGIN
    PERFORM public.import_record_bundle(a, jsonb_build_array(anime || jsonb_build_object('import_key', repeat('d',64),'anilist_id',456)), jsonb_build_array(watch || jsonb_build_object('import_key',repeat('e',64),'watched_episodes',-1)));
    RAISE EXCEPTION 'should reject invalid progress';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM animes WHERE anilist_id=456) THEN RAISE EXCEPTION 'partial import survived'; END IF;

  BEGIN
    PERFORM public.import_record_bundle(b, '[]', '[]');
    RAISE EXCEPTION 'should reject another owner';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.import_record_bundle(a, jsonb_build_array(anime || '{"import_key":null}'::jsonb), '[]');
    RAISE EXCEPTION 'should reject missing key';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM animes) OR EXISTS (SELECT 1 FROM watchlist) THEN RAISE EXCEPTION 'RLS leaked another owner'; END IF; END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM public.import_record_bundle('11111111-1111-4111-8111-111111111111','[]','[]');
    RAISE EXCEPTION 'anon could call import';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'record import SQL assertions passed' AS result;
