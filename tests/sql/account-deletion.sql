\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database()<>'account_deletion_test' THEN RAISE EXCEPTION 'Local empty test DB only'; END IF; END $$;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE animes(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id));
CREATE TABLE follows(follower_id uuid REFERENCES auth.users(id),following_id uuid REFERENCES auth.users(id));
CREATE TABLE watchlist(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE notification_settings(user_id uuid REFERENCES auth.users(id),watchlist_id uuid REFERENCES watchlist(id));
CREATE TABLE profiles(id uuid REFERENCES auth.users(id));
CREATE TABLE push_subscriptions(user_id uuid REFERENCES auth.users(id));
CREATE TABLE user_profiles(id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE reviews(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,anime_id uuid REFERENCES animes(id) ON DELETE CASCADE);
CREATE TABLE review_likes(user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,review_id uuid REFERENCES reviews(id) ON DELETE CASCADE);
CREATE TABLE review_helpful(LIKE review_likes);
ALTER TABLE review_helpful ADD FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,ADD FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE;
CREATE TABLE favorite_animes(user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE user_blocks(blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE content_reports(id uuid PRIMARY KEY,reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,review_id uuid REFERENCES reviews(id) ON DELETE SET NULL);
CREATE TABLE moderation_actions(report_id uuid REFERENCES content_reports(id) ON DELETE CASCADE);
CREATE TABLE moderation_hidden_targets(user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,review_id uuid REFERENCES reviews(id) ON DELETE CASCADE);
\ir ../../supabase/migrations/20260907000300_account_deletion_cascade.sql
INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111'),('22222222-1111-4111-8111-111111111111');
INSERT INTO animes SELECT id,id FROM auth.users;
INSERT INTO watchlist SELECT id,id FROM auth.users;
INSERT INTO notification_settings SELECT id,id FROM auth.users;
INSERT INTO profiles SELECT id FROM auth.users;
INSERT INTO push_subscriptions SELECT id FROM auth.users;
INSERT INTO user_profiles SELECT id FROM auth.users;
INSERT INTO reviews SELECT id,id,id FROM auth.users;
INSERT INTO review_likes SELECT a.id,b.id FROM auth.users a CROSS JOIN auth.users b;
INSERT INTO review_helpful SELECT * FROM review_likes;
INSERT INTO favorite_animes SELECT id FROM auth.users;
INSERT INTO follows SELECT a.id,b.id FROM auth.users a CROSS JOIN auth.users b WHERE a.id<>b.id;
INSERT INTO user_blocks SELECT * FROM follows;
INSERT INTO content_reports SELECT a.id,a.id,b.id,b.id FROM auth.users a CROSS JOIN auth.users b WHERE a.id<>b.id;
INSERT INTO moderation_actions SELECT id FROM content_reports;
INSERT INTO moderation_hidden_targets SELECT id,id FROM auth.users;
-- Rollback must also restore all related rows.
BEGIN;
DELETE FROM auth.users WHERE id='11111111-1111-4111-8111-111111111111';
ROLLBACK;
DO $$ BEGIN IF (SELECT count(*) FROM animes)<>2 OR (SELECT count(*) FROM notification_settings)<>2 OR (SELECT count(*) FROM content_reports)<>2 THEN RAISE EXCEPTION 'partial data loss after rollback'; END IF; END $$;
DELETE FROM auth.users WHERE id='11111111-1111-4111-8111-111111111111';
DO $$ DECLARE tab text; n int; BEGIN
 FOREACH tab IN ARRAY ARRAY['animes','watchlist','notification_settings','profiles','push_subscriptions','user_profiles','reviews','review_likes','review_helpful','favorite_animes','moderation_hidden_targets'] LOOP
  EXECUTE format('SELECT count(*) FROM %I',tab) INTO n;
  IF n<>1 THEN RAISE EXCEPTION 'incorrect deletion in %',tab; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM follows) OR EXISTS(SELECT 1 FROM user_blocks) OR EXISTS(SELECT 1 FROM content_reports) OR EXISTS(SELECT 1 FROM moderation_actions) THEN RAISE EXCEPTION 'relationship data survived'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id='22222222-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'another account deleted'; END IF;
END $$;
SELECT 'account deletion SQL assertions passed' AS result;
