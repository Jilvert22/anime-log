/**
 * JSON-LD（schema.org）構造化データの生成。
 *
 * 重要: ここで出す内容は「ページに実際に表示されている内容」と一致させること。
 * 架空の評価(aggregateRating)やレビュー件数は入れない（Googleの構造化データ要件）。
 */

const APP_NAME = 'アニメログ';
const APP_DESCRIPTION =
  'アニメの視聴記録をクール（春・夏・秋・冬）別に管理できるPWA。視聴傾向の分析、ANIME DNAカードや視聴予定カードの作成、感想の記録ができます。ログイン不要で今すぐ使えます。';

type JsonLdObject = Record<string, unknown>;

export function websiteJsonLd(siteUrl: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: siteUrl,
    inLanguage: 'ja',
    description: APP_DESCRIPTION,
  };
}

export function organizationJsonLd(siteUrl: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-512x512.png`,
  };
}

export function softwareApplicationJsonLd(siteUrl: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APP_NAME,
    url: siteUrl,
    description: APP_DESCRIPTION,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    inLanguage: 'ja',
    // 無料アプリ。架空のratingは出さない。
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
  };
}

/** サイト全体（トップ/layout）に出す構造化データ一式 */
export function siteStructuredData(siteUrl: string): JsonLdObject[] {
  return [websiteJsonLd(siteUrl), organizationJsonLd(siteUrl), softwareApplicationJsonLd(siteUrl)];
}
