import { Metadata } from 'next';
import AboutClient from './AboutClient';
import { JsonLd } from '../components/seo/JsonLd';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { faqPageJsonLd } from '../lib/seo/aboutFaq';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp';

export const metadata: Metadata = {
  title: 'アニメログとは - あのクール、何見てたっけ？がすぐわかる | アニメログ',
  description:
    'アニメ視聴履歴を記録・管理するWebアプリ。クール別管理、積みアニメ、DNAカード生成など。ログイン不要で今すぐ使える。',
  metadataBase: new URL(siteUrl),
  keywords: ['アニメ', '視聴履歴', '管理', '記録', '評価', 'クール別管理', 'DNAカード'],
  authors: [{ name: 'アニメログ' }],
  openGraph: {
    title: 'アニメログとは | アニメログ',
    description:
      'あのクール、何見てたっけ？がすぐわかる。視聴履歴をコレクションして、見逃したアニメも思い出せる。',
    url: `${siteUrl}/about`,
    siteName: 'アニメログ',
    type: 'website',
    locale: 'ja_JP',
    // openGraph を再定義すると layout の /api/og 画像は継承されないため明示指定する
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'アニメログ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アニメログとは | アニメログ',
    description: 'あのクール、何見てたっけ？がすぐわかる。',
    images: ['/api/og'],
  },
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd()} />
      <AboutClient
        breadcrumb={
          <Breadcrumb items={[{ name: 'ホーム', url: siteUrl }, { name: 'アニメログとは' }]} />
        }
      />
    </>
  );
}
