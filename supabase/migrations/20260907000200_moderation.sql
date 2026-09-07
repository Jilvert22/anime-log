-- 通報・ブロック・運営による非表示。ローカルSQL試験と本番スキーマ照合済み。
BEGIN;
CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id), CHECK (blocker_id <> blocked_id)
);
CREATE INDEX user_blocks_reverse ON public.user_blocks(blocked_id, blocker_id);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_blocks FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.user_blocks TO authenticated;
CREATE POLICY own_blocks_read ON public.user_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY own_blocks_delete ON public.user_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('user','review')),
  target_id uuid NOT NULL,
  review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('harassment','sexual','spam','rights','other')),
  details text NOT NULL DEFAULT '' CHECK (length(details) <= 1000),
  snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
  CHECK (reporter_id <> target_user_id)
);
CREATE UNIQUE INDEX content_reports_pending_unique ON public.content_reports(reporter_id,target_type,target_id) WHERE status = 'pending';
CREATE INDEX content_reports_queue ON public.content_reports(status,created_at);
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.content_reports FROM PUBLIC, anon, authenticated;

CREATE TABLE public.moderation_hidden_targets (
  target_type text NOT NULL CHECK (target_type IN ('user','review')), target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (target_type,target_id)
);
ALTER TABLE public.moderation_hidden_targets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.moderation_hidden_targets FROM PUBLIC, anon, authenticated;
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid NOT NULL REFERENCES public.content_reports(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('hide','dismiss','restore')),
  note text NOT NULL CHECK (length(note) BETWEEN 1 AND 1000), actor text NOT NULL DEFAULT current_user,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.moderation_actions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.content_reports, public.moderation_hidden_targets, public.moderation_actions TO service_role;

-- 呼出者のブロック関係だけを判定する。第三者同士の関係を照会する引数は持たない。
CREATE FUNCTION public.moderation_is_blocked(target_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_blocks b WHERE
      (b.blocker_id = auth.uid() AND b.blocked_id = target_user) OR
      (b.blocked_id = auth.uid() AND b.blocker_id = target_user)
  );
$$;
CREATE FUNCTION public.moderation_is_hidden(kind text, target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.moderation_hidden_targets h WHERE h.target_type = kind AND h.target_id = target);
$$;
CREATE FUNCTION public.moderation_review_visible(target_review uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = target_review AND (
    r.user_id = auth.uid() OR (NOT public.moderation_is_hidden('review',r.id)
      AND NOT public.moderation_is_hidden('user',r.user_id) AND NOT public.moderation_is_blocked(r.user_id))
  ));
$$;
REVOKE ALL ON FUNCTION public.moderation_is_blocked(uuid), public.moderation_is_hidden(text,uuid), public.moderation_review_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderation_is_blocked(uuid), public.moderation_is_hidden(text,uuid), public.moderation_review_visible(uuid) TO anon, authenticated, service_role;

CREATE POLICY moderation_profiles_read ON public.user_profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (id = auth.uid() OR (NOT public.moderation_is_hidden('user',id) AND NOT public.moderation_is_blocked(id)));
CREATE POLICY moderation_reviews_read ON public.reviews AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (public.moderation_review_visible(id));
CREATE POLICY moderation_animes_read ON public.animes AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR (NOT public.moderation_is_hidden('user',user_id) AND NOT public.moderation_is_blocked(user_id)));
CREATE POLICY moderation_follows_read ON public.follows AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (NOT public.moderation_is_blocked(follower_id) AND NOT public.moderation_is_blocked(following_id)
  AND NOT public.moderation_is_hidden('user',follower_id) AND NOT public.moderation_is_hidden('user',following_id));
CREATE POLICY moderation_follows_insert ON public.follows AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (NOT public.moderation_is_blocked(following_id) AND NOT public.moderation_is_hidden('user',following_id)
  AND NOT public.moderation_is_hidden('user',follower_id));
CREATE POLICY moderation_likes_insert ON public.review_likes AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.moderation_review_visible(review_id));
CREATE POLICY moderation_helpful_insert ON public.review_helpful AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.moderation_review_visible(review_id));

-- 既存の公開条件・公開列を維持し、ビュー所有者によるRLS迂回にもブロック/非表示を適用する。
CREATE OR REPLACE VIEW public.public_animes AS
SELECT a.id, a.user_id, a.season_name, a.title, a.image, a.rating, a.anilist_id, a.created_at
FROM public.animes a JOIN public.user_profiles p ON p.id = a.user_id
WHERE p.is_public = true AND a.watched = true
  AND NOT public.moderation_is_hidden('user',a.user_id) AND NOT public.moderation_is_blocked(a.user_id);

CREATE FUNCTION public.block_user(expected_blocker uuid, target_user uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE viewer uuid := auth.uid(); label text; result jsonb;
BEGIN
  IF viewer IS NULL OR viewer IS DISTINCT FROM expected_blocker OR viewer = target_user THEN
    RAISE EXCEPTION 'Invalid blocker' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(least(viewer::text,target_user::text)||greatest(viewer::text,target_user::text),0));
  IF public.moderation_is_hidden('user',target_user) THEN RAISE EXCEPTION 'User is not available' USING ERRCODE='22023'; END IF;
  SELECT p.username INTO label FROM public.user_profiles p WHERE p.id=target_user AND p.is_public=true;
  IF label IS NULL THEN
    SELECT r.user_name INTO label FROM public.reviews r WHERE r.user_id=target_user
      AND NOT public.moderation_is_hidden('review',r.id) LIMIT 1;
  END IF;
  IF label IS NULL THEN RAISE EXCEPTION 'User is not available' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.user_blocks(blocker_id,blocked_id,blocked_label) VALUES(viewer,target_user,left(label,200)) ON CONFLICT DO NOTHING;
  DELETE FROM public.follows WHERE (follower_id=viewer AND following_id=target_user) OR (follower_id=target_user AND following_id=viewer);
  SELECT jsonb_build_object('blocked_id',b.blocked_id,'blocked_label',b.blocked_label,'created_at',b.created_at)
    INTO result FROM public.user_blocks b WHERE b.blocker_id=viewer AND b.blocked_id=target_user;
  RETURN result;
END;
$$;

-- フォローとブロックが並行しても、ブロック成立後に関係が残らないよう同じペアを直列化する。
CREATE FUNCTION public.guard_blocked_follow() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(least(NEW.follower_id::text,NEW.following_id::text)||greatest(NEW.follower_id::text,NEW.following_id::text),0));
  IF EXISTS (SELECT 1 FROM public.user_blocks b WHERE
    (b.blocker_id=NEW.follower_id AND b.blocked_id=NEW.following_id) OR
    (b.blocker_id=NEW.following_id AND b.blocked_id=NEW.follower_id)) THEN
    RAISE EXCEPTION 'Follow is blocked' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_blocked_follow() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_blocked_follow BEFORE INSERT OR UPDATE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.guard_blocked_follow();

CREATE FUNCTION public.submit_content_report(expected_reporter uuid, target_kind text, target uuid, report_reason text, report_details text DEFAULT '') RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE viewer uuid := auth.uid(); target_owner uuid; source jsonb; report uuid; review_uuid uuid;
BEGIN
  IF viewer IS NULL OR viewer IS DISTINCT FROM expected_reporter THEN RAISE EXCEPTION 'Authentication changed' USING ERRCODE = '42501'; END IF;
  IF report_reason IS NULL OR report_reason NOT IN ('harassment','sexual','spam','rights','other') OR report_details IS NULL OR length(report_details)>1000 THEN
    RAISE EXCEPTION 'Invalid report' USING ERRCODE = '22023';
  END IF;
  -- 同じ送信者の同時通報も直列化し、重複排除と日次上限を守る。
  PERFORM pg_advisory_xact_lock(hashtextextended(viewer::text,0));
  SELECT id INTO report FROM public.content_reports WHERE reporter_id=viewer AND target_type=target_kind AND target_id=target AND status='pending';
  IF report IS NOT NULL THEN RETURN report; END IF;
  IF (SELECT count(*) FROM public.content_reports WHERE reporter_id=viewer AND created_at>now()-interval '24 hours') >= 20 THEN
    RAISE EXCEPTION 'Report limit reached' USING ERRCODE = 'P0001';
  END IF;
  IF target_kind='user' THEN
    SELECT p.id,jsonb_build_object('username',p.username,'bio',p.bio) INTO target_owner,source
      FROM public.user_profiles p WHERE p.id=target AND p.is_public=true
      AND NOT public.moderation_is_hidden('user',p.id) AND NOT public.moderation_is_blocked(p.id);
  ELSIF target_kind='review' THEN
    SELECT r.user_id,jsonb_build_object('user_name',r.user_name,'content',r.content,'anime_title',r.anime_title),r.id
      INTO target_owner,source,review_uuid FROM public.reviews r WHERE r.id=target AND public.moderation_review_visible(r.id);
  ELSE RAISE EXCEPTION 'Invalid target type' USING ERRCODE = '22023'; END IF;
  IF target_owner IS NULL OR target_owner=viewer THEN RAISE EXCEPTION 'Target is not available' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.content_reports(reporter_id,target_user_id,target_type,target_id,review_id,reason,details,snapshot)
    VALUES(viewer,target_owner,target_kind,target,review_uuid,report_reason,report_details,source) RETURNING id INTO report;
  RETURN report;
END;
$$;
REVOKE ALL ON FUNCTION public.block_user(uuid,uuid), public.submit_content_report(uuid,text,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_user(uuid,uuid), public.submit_content_report(uuid,text,uuid,text,text) TO authenticated;

CREATE FUNCTION public.resolve_content_report(report_uuid uuid, decision text, resolution_note text) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE report public.content_reports%ROWTYPE;
BEGIN
  IF decision IS NULL OR decision NOT IN ('hide','dismiss','restore') OR resolution_note IS NULL OR length(btrim(resolution_note)) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO report FROM public.content_reports WHERE id=report_uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE = '22023'; END IF;
  IF decision='hide' THEN
    IF report.target_type='review' AND report.review_id IS NULL THEN RAISE EXCEPTION 'Review was deleted' USING ERRCODE = '22023'; END IF;
    INSERT INTO public.moderation_hidden_targets(target_type,target_id,user_id,review_id)
      VALUES(report.target_type,report.target_id,report.target_user_id,report.review_id) ON CONFLICT DO NOTHING;
  ELSIF decision='restore' THEN
    DELETE FROM public.moderation_hidden_targets WHERE target_type=report.target_type AND target_id=report.target_id;
  END IF;
  INSERT INTO public.moderation_actions(report_id,decision,note) VALUES(report_uuid,decision,resolution_note);
  UPDATE public.content_reports SET status=CASE WHEN decision='dismiss' THEN 'dismissed' ELSE 'resolved' END, resolved_at=now() WHERE id=report_uuid;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_content_report(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_content_report(uuid,text,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
