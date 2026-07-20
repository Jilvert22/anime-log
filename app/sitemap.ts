import { MetadataRoute } from 'next';
import { createServerSupabaseClient } from './lib/supabase/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp';

// sitemap に載せる公開プロフィールの最低公開作品数。
// 公開作品 0 件の空プロフィール（thin content）を索引対象から除外する。
// 現状の公開プロフィールは作品数が少ないため 1 に設定（コンテンツが増えたら引き上げを検討）。
const MIN_PUBLIC_ANIMES = 1;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // lastModified は正確な値を出せる場合のみ付ける。
  // アクセスごとに変わる new Date() を入れると「不正確な lastmod」として Google に無視される。
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // 公開プロフィール（SSRで本文・canonical・ProfilePage JSON-LDを持つ）を動的追加。
  // 公開作品が MIN_PUBLIC_ANIMES 件未満の薄いプロフィールは載せない。
  // Supabase障害時も静的分は返す。
  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username, updated_at')
      .eq('is_public', true);

    const candidates = (profiles ?? []).filter((p) => p.username);
    if (candidates.length > 0) {
      // 公開作品数を1クエリで取得し JS 側で集計（公開ユーザー数が小さい前提。増えたら RPC 化を検討）
      const { data: animeRows, error: animeError } = await supabase
        .from('public_animes')
        .select('user_id')
        .in(
          'user_id',
          candidates.map((p) => p.id)
        );

      // 集計クエリが失敗した場合（supabase は throw せず error を返す）、
      // 全滅させず品質ゲート無しで従来どおり全公開プロフィールを載せる
      let passesGate: (id: string) => boolean = () => true;
      if (!animeError) {
        const countByUser = new Map<string, number>();
        for (const row of animeRows ?? []) {
          countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1);
        }
        passesGate = (id) => (countByUser.get(id) ?? 0) >= MIN_PUBLIC_ANIMES;
      }

      profileEntries = candidates
        .filter((p) => passesGate(p.id))
        .map((p) => ({
          url: `${siteUrl}/profile/${encodeURIComponent(p.username)}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
    }
  } catch {
    // クエリ失敗時は静的エントリのみで継続
  }

  return [...staticEntries, ...profileEntries];
}
