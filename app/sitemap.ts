import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 公開プロフィール(/profile/<username>)は、本文のSSR化・canonical・noindex整備と
  // セットでPR4(WS3)で動的追加する。ここで先に載せると canonical(=/) と矛盾するため載せない。
  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
