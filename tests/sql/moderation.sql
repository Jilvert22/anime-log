\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database() <> 'moderation_test' THEN RAISE EXCEPTION 'Use moderation_test only'; END IF; END $$;
CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
CREATE TABLE user_profiles(id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, username text, bio text, is_public boolean DEFAULT true);
CREATE TABLE animes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users ON DELETE CASCADE, season_name text, title text, image text, rating int, anilist_id int, created_at timestamptz DEFAULT now(), watched boolean DEFAULT true, is_public boolean DEFAULT true);
CREATE TABLE reviews(id uuid PRIMARY KEY, user_id uuid REFERENCES auth.users ON DELETE CASCADE, user_name text, content text, anime_title text);
CREATE TABLE follows(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), follower_id uuid REFERENCES auth.users ON DELETE CASCADE, following_id uuid REFERENCES auth.users ON DELETE CASCADE, UNIQUE(follower_id,following_id));
CREATE TABLE review_likes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users ON DELETE CASCADE, review_id uuid REFERENCES reviews ON DELETE CASCADE);
CREATE TABLE review_helpful(LIKE review_likes INCLUDING ALL);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE animes ENABLE ROW LEVEL SECURITY; ALTER TABLE reviews ENABLE ROW LEVEL SECURITY; ALTER TABLE follows ENABLE ROW LEVEL SECURITY; ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY; ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_read ON user_profiles FOR SELECT USING(is_public OR id=auth.uid());
CREATE POLICY anime_read ON animes FOR SELECT USING(is_public OR user_id=auth.uid());
CREATE POLICY review_read ON reviews FOR SELECT USING(true);
CREATE POLICY review_update ON reviews FOR UPDATE USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY follow_read ON follows FOR SELECT USING(true);
CREATE POLICY follow_insert ON follows FOR INSERT WITH CHECK(follower_id=auth.uid());
CREATE POLICY follow_delete ON follows FOR DELETE USING(follower_id=auth.uid());
CREATE POLICY likes_read ON review_likes FOR SELECT USING(true);
CREATE POLICY likes_insert ON review_likes FOR INSERT WITH CHECK(user_id=auth.uid());
CREATE POLICY helpful_read ON review_helpful FOR SELECT USING(true);
CREATE POLICY helpful_insert ON review_helpful FOR INSERT WITH CHECK(user_id=auth.uid());
GRANT SELECT ON user_profiles,animes,reviews,follows,review_likes,review_helpful TO anon,authenticated;
GRANT INSERT,DELETE ON follows,review_likes,review_helpful TO authenticated;
GRANT UPDATE ON reviews TO authenticated;
CREATE VIEW public_animes AS SELECT a.id,a.user_id,a.season_name,a.title,a.image,a.rating,a.anilist_id,a.created_at FROM animes a JOIN user_profiles p ON p.id=a.user_id WHERE p.is_public=true AND a.watched=true;
GRANT SELECT ON public_animes TO anon,authenticated;
\ir ../../supabase/migrations/20260907000200_moderation.sql
-- Three synthetic users; A/B public, C private but has public review.
INSERT INTO auth.users SELECT (repeat(n::text,8)||'-1111-4111-8111-111111111111')::uuid FROM generate_series(1,3)n;
INSERT INTO user_profiles SELECT id,'User '||left(id::text,1),'Bio',left(id::text,1)<>'3' FROM auth.users;
INSERT INTO animes(user_id,title) SELECT id,'Anime '||left(id::text,1) FROM auth.users;
INSERT INTO reviews SELECT id,id,'Writer '||left(id::text,1),'Review '||left(id::text,1),'Anime' FROM auth.users;
INSERT INTO follows(follower_id,following_id) VALUES ('11111111-1111-4111-8111-111111111111','22222222-1111-4111-8111-111111111111'),('22222222-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$ DECLARE a uuid:=auth.uid(); b uuid:='22222222-1111-4111-8111-111111111111'; report uuid; BEGIN
  report:=submit_content_report(a,'review',b,'spam','補足');
  IF report<>submit_content_report(a,'review',b,'other','retry') THEN RAISE EXCEPTION 'duplicate report'; END IF;
  PERFORM submit_content_report(a,'user',b,'harassment','');
  PERFORM submit_content_report(a,'review','33333333-1111-4111-8111-111111111111','other','private profile public review');
  BEGIN PERFORM submit_content_report(b,'user',b,'spam',''); RAISE EXCEPTION 'spoofed reporter'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM submit_content_report(a,'user',a,'spam',''); RAISE EXCEPTION 'self report'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM submit_content_report(a,'review',b,'bad',''); RAISE EXCEPTION 'invalid reason'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM * FROM content_reports; RAISE EXCEPTION 'reports exposed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM resolve_content_report(report,'hide','unauthorized'); RAISE EXCEPTION 'admin RPC exposed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO moderation_hidden_targets(target_type,target_id,user_id) VALUES('user',b,b); RAISE EXCEPTION 'admin table writable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM block_user(b,a); RAISE EXCEPTION 'spoofed blocker'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM block_user(a,b); PERFORM block_user(a,b);
  IF (SELECT count(*) FROM user_blocks)<>1 THEN RAISE EXCEPTION 'block duplicate'; END IF;
  IF EXISTS(SELECT 1 FROM follows) THEN RAISE EXCEPTION 'follow survived'; END IF;
  IF EXISTS(SELECT 1 FROM user_profiles WHERE id=b) OR EXISTS(SELECT 1 FROM reviews WHERE user_id=b) OR EXISTS(SELECT 1 FROM animes WHERE user_id=b) OR EXISTS(SELECT 1 FROM public_animes WHERE user_id=b) THEN RAISE EXCEPTION 'blocked content visible'; END IF;
  IF NOT EXISTS(SELECT 1 FROM reviews WHERE user_id=a) THEN RAISE EXCEPTION 'own review hidden'; END IF;
  BEGIN INSERT INTO follows(follower_id,following_id) VALUES(a,b); RAISE EXCEPTION 'follow allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO review_likes(user_id,review_id) VALUES(a,b); RAISE EXCEPTION 'like allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO review_helpful(user_id,review_id) VALUES(a,b); RAISE EXCEPTION 'helpful allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-1111-4111-8111-111111111111',false);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM user_blocks) THEN RAISE EXCEPTION 'other block list exposed'; END IF;
  IF EXISTS(SELECT 1 FROM user_profiles WHERE id='11111111-1111-4111-8111-111111111111') OR EXISTS(SELECT 1 FROM reviews WHERE user_id='11111111-1111-4111-8111-111111111111') OR EXISTS(SELECT 1 FROM public_animes WHERE user_id='11111111-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'reverse block failed'; END IF;
  DELETE FROM user_blocks;
END $$;
RESET ROLE;
DO $$ BEGIN IF (SELECT count(*) FROM user_blocks)<>1 THEN RAISE EXCEPTION 'other user removed block'; END IF; END $$;
SET ROLE anon; SELECT set_config('request.jwt.claim.sub','',false);
DO $$ BEGIN
  IF (SELECT count(*) FROM public_animes)<>2 OR (SELECT count(*) FROM reviews)<>3 THEN RAISE EXCEPTION 'anonymous public access altered'; END IF;
  BEGIN PERFORM block_user('11111111-1111-4111-8111-111111111111','22222222-1111-4111-8111-111111111111'); RAISE EXCEPTION 'anon block allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM submit_content_report(NULL,'user','22222222-1111-4111-8111-111111111111','spam',''); RAISE EXCEPTION 'anon report allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
-- Administrative action is reversible, auditable, hides content even anonymously.
SET ROLE service_role;
SELECT resolve_content_report(id,'hide','review violation') FROM content_reports WHERE target_type='review' AND target_user_id='22222222-1111-4111-8111-111111111111';
RESET ROLE; SET ROLE anon;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reviews WHERE user_id='22222222-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'moderated review public'; END IF; END $$;
RESET ROLE; SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-1111-4111-8111-111111111111',false);
DO $$ BEGIN UPDATE reviews SET content='author edited' WHERE user_id=auth.uid(); IF NOT FOUND THEN RAISE EXCEPTION 'author cannot edit hidden review'; END IF; END $$;
RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false);
SET ROLE service_role;
SELECT resolve_content_report(id,'restore','review restored') FROM content_reports WHERE target_type='review' AND target_user_id='22222222-1111-4111-8111-111111111111';
SELECT resolve_content_report(id,'hide','profile violation') FROM content_reports WHERE target_type='user';
RESET ROLE; SET ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM user_profiles WHERE id='22222222-1111-4111-8111-111111111111') OR EXISTS(SELECT 1 FROM public_animes WHERE user_id='22222222-1111-4111-8111-111111111111') OR EXISTS(SELECT 1 FROM reviews WHERE user_id='22222222-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'hidden account content public'; END IF;
END $$;
RESET ROLE;
SELECT resolve_content_report(id,'restore','profile restored') FROM content_reports WHERE target_type='user';
DO $$ BEGIN
 IF (SELECT count(*) FROM moderation_actions)<>4 THEN RAISE EXCEPTION 'missing audit'; END IF;
 IF (SELECT snapshot->>'content' FROM content_reports WHERE target_type='review' AND target_user_id='22222222-1111-4111-8111-111111111111')<>'Review 2' THEN RAISE EXCEPTION 'snapshot changed with review'; END IF;
END $$;
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DELETE FROM user_blocks WHERE blocked_id='22222222-1111-4111-8111-111111111111';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public_animes WHERE user_id='22222222-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'unblock failed'; END IF;
 IF EXISTS(SELECT 1 FROM follows) THEN RAISE EXCEPTION 'unblock refollowed'; END IF;
 PERFORM block_user(auth.uid(),'33333333-1111-4111-8111-111111111111');
END $$;
RESET ROLE;
-- Daily limit, duplicate before quota, and account cleanup.
INSERT INTO content_reports(reporter_id,target_user_id,target_type,target_id,reason,snapshot,status)
SELECT '11111111-1111-4111-8111-111111111111','22222222-1111-4111-8111-111111111111','review',gen_random_uuid(),'spam','{}','dismissed' FROM generate_series(1,17);
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM submit_content_report(auth.uid(),'review','22222222-1111-4111-8111-111111111111','spam',''); RAISE EXCEPTION 'quota bypass' USING ERRCODE='22023'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Report limit reached' THEN RAISE; END IF; END;
 PERFORM submit_content_report(auth.uid(),'review','33333333-1111-4111-8111-111111111111','other','retry after block');
END $$;
RESET ROLE;
DELETE FROM auth.users WHERE id='11111111-1111-4111-8111-111111111111';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM user_blocks) OR EXISTS(SELECT 1 FROM content_reports) OR EXISTS(SELECT 1 FROM moderation_actions) THEN RAISE EXCEPTION 'account cleanup failed'; END IF; END $$;
SELECT 'moderation SQL assertions passed' AS result;
