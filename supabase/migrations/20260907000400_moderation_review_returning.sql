-- INSERT ... RETURNINGではSTABLE関数内のSELECTから新規行がまだ見えない。
-- 本人の判定は現在行のuser_idで行い、既存クライアントの投稿・更新と互換性を保つ。
BEGIN;
ALTER POLICY moderation_reviews_read ON public.reviews
USING (user_id = auth.uid() OR public.moderation_review_visible(id));
COMMIT;
