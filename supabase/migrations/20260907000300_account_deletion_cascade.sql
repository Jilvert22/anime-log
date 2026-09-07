-- auth.users削除時に公開DBの関連データを一括削除する。既存データの削除は行わない。
BEGIN;
ALTER TABLE public.animes DROP CONSTRAINT animes_user_id_fkey,
 ADD CONSTRAINT animes_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.follows DROP CONSTRAINT follows_follower_id_fkey, DROP CONSTRAINT follows_following_id_fkey,
 ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY(follower_id) REFERENCES auth.users(id) ON DELETE CASCADE,
 ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY(following_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notification_settings DROP CONSTRAINT notification_settings_user_id_fkey, DROP CONSTRAINT notification_settings_watchlist_id_fkey,
 ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
 ADD CONSTRAINT notification_settings_watchlist_id_fkey FOREIGN KEY(watchlist_id) REFERENCES public.watchlist(id) ON DELETE CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey,
 ADD CONSTRAINT profiles_id_fkey FOREIGN KEY(id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.push_subscriptions DROP CONSTRAINT push_subscriptions_user_id_fkey,
 ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
COMMIT;
