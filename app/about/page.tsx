import { Metadata } from 'next';
import AboutClient from './AboutClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp';

export const metadata: Metadata = {
  title: 'アニメログとは - あのクール、何見てたっけ？がすぐわかる | animelog',
  description: 'アニメ視聴履歴を記録・管理するWebアプリ。クール別管理、積みアニメ、DNAカード生成など。ログイン不要で今すぐ使える。',
  metadataBase: new URL(siteUrl),
  keywords: ['アニメ', '視聴履歴', '管理', '記録', '評価', 'クール別管理', 'DNAカード'],
  authors: [{ name: 'アニメログ' }],
  openGraph: {
    title: 'アニメログとは | animelog',
    description: 'あのクール、何見てたっけ？がすぐわかる。視聴履歴をコレクションして、見逃したアニメも思い出せる。',
    url: `${siteUrl}/about`,
    siteName: 'アニメログ',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アニメログとは | animelog',
    description: 'あのクール、何見てたっけ？がすぐわかる。',
  },
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  return <AboutClient />;
}

