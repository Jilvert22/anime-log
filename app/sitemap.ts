import { MetadataRoute } from 'next';
import { createServerSupabaseClient } from './lib/supabase/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // 公開プロフィール（SSRで本文・canonical・ProfilePage JSON-LDを持つ）を動的追加。
  // Supabase障害時も静的分は返す。
  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('user_profiles')
      .select('username, updated_at')
      .eq('is_public', true);

    if (data) {
      profileEntries = data
        .filter((p) => p.username)
        .map((p) => ({
          url: `${siteUrl}/profile/${encodeURIComponent(p.username)}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
    }
  } catch {
    // クエリ失敗時は静的エントリのみで継続
  }

  return [...staticEntries, ...profileEntries];
}
