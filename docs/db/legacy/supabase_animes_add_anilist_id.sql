-- animes テーブルに anilist_id を追加（将来の「作品単位」の集約キー）。
--
-- 背景: これまでAniListの作品ID(result.id)は検索結果に存在したが、アニメ追加時に捨てていた。
-- animes.id はローカル合成ID(maxId+index+1)で作品の同一性を表さないため、作品単位の集約ができない。
-- このカラムで、追加した作品が「どのAniList作品か」を保持する。
--
-- 既存行はNULLのまま（n≈0想定でバックフィル不要）。新規追加分に値が入る。
-- 既存のRLSポリシー（本人のみSELECT/INSERT/UPDATE/DELETE）は変更しない。
--
-- 適用方法: Supabase Dashboard → SQL Editor にこの内容を貼って実行。
-- ※このマイグレを適用してから、anilist_idを書き込むアプリ版をデプロイすること
--   （カラムが無い状態で書き込むとINSERTが失敗するため）。NULL許容なので既存版には無害。

ALTER TABLE animes ADD COLUMN IF NOT EXISTS anilist_id integer;

CREATE INDEX IF NOT EXISTS idx_animes_anilist_id ON animes(anilist_id);
