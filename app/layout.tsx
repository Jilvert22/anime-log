import type { Metadata, Viewport } from 'next';
import { M_PLUS_Rounded_1c, Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from './components/analytics/GoogleAnalytics';
import { Providers } from './providers';
import { JsonLd } from './components/seo/JsonLd';
import { siteStructuredData } from './lib/seo/structuredData';
import './globals.css';

// M PLUS Rounded 1c（日本語用）
// CJK フォントは Google Fonts 側が subset 分割に対応しておらず、subsets 指定は効かない
// （常に全 unicode-range チャンクが返る）。そのため preload すると 126 unicode-range ×
// 4 ウェイト = 371 ファイル・4.8MB（ページ総重量の 93%）が preload + レンダーブロッキング
// で取得され、LCP が大幅に悪化する（本番モバイル Lighthouse で LCP≈27秒の主因）。
// preload はデフォルト true のため明示的に false を指定し、ブラウザ標準の遅延読込
// （実際に表示するグリフを含むチャンクのみ取得）に任せる。
const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-rounded',
  preload: false,
  fallback: ['system-ui', 'arial'], // フォールバックフォント
});

// Poppins（英数字用）
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true, // フォントのプリロードを有効化
  fallback: ['system-ui', 'arial'], // フォールバックフォント
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp';

export const metadata: Metadata = {
  title: {
    default: 'アニメログ - 見たアニメをクール別に記録できる視聴管理アプリ',
    template: '%s | アニメログ',
  },
  description:
    '見たアニメをクール別に記録・管理できる無料の視聴管理アプリ。作品ごとの評価や感想を残せるほか、今期・来期に見たいアニメの視聴予定もまとめて管理できます。ログイン不要で今すぐ使えます。',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  // Google Search Console 所有権確認。NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION 未設定なら
  // メタタグは出力されない（トークンはユーザーがVercelの環境変数に設定）。手順は SEO_NOTES.md。
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  keywords: ['アニメ', '視聴履歴', '管理', '記録', '評価'],
  authors: [{ name: 'アニメログ' }],
  icons: {
    icon: '/favicon.ico',
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'アニメログ',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'アニメログ - 見たアニメをクール別に記録できる視聴管理アプリ',
    description:
      '見たアニメをクール別に記録・管理できる無料の視聴管理アプリ。作品ごとの評価や感想を残せるほか、今期・来期に見たいアニメの視聴予定もまとめて管理できます。ログイン不要で今すぐ使えます。',
    url: siteUrl,
    siteName: 'アニメログ',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'アニメログ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アニメログ - 見たアニメをクール別に記録できる視聴管理アプリ',
    description:
      '見たアニメをクール別に記録・管理できる無料の視聴管理アプリ。作品ごとの評価や感想を残せるほか、今期・来期に見たいアニメの視聴予定もまとめて管理できます。ログイン不要で今すぐ使えます。',
    images: ['/api/og'],
  },
};

export const viewport: Viewport = {
  themeColor: '#e879d4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // GA4測定ID。NEXT_PUBLIC_GA_MEASUREMENT_ID未設定（dev/preview）ではGAを読み込まない
  // = 本番環境のみ計測。開示のみ・同意バナー無しの方針（IPは位置情報判定後に破棄）。
  // 注: /profile/[username]・/share/[username] のusernameはPII（Google公式ポリシーで
  // GA送信禁止）のため、GoogleAnalyticsコンポーネント内でgtag('config')の引数自体に
  // マスク済みのpage_location/page_referrer/page_titleを渡す。session_start/first_visit等の
  // 自動イベントもconfig時点のコンテキストを継承するため、これらもマスク対象になる。
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <html lang="ja" className={`${mPlusRounded.variable} ${poppins.variable}`}>
      <head>
        {/* AniList CDNへのpreconnect（画像読み込みの高速化） */}
        <link rel="preconnect" href="https://s4.anilist.co" />
        <link rel="preconnect" href="https://s3.anilist.co" />
        <link rel="dns-prefetch" href="https://cdn.anilist.co" />
      </head>
      <body className="font-mixed antialiased">
        <JsonLd data={siteStructuredData(siteUrl)} />
        <Providers>{children}</Providers>
        {/* Analyticsは既に最適化されているが、必要に応じて遅延読み込み可能 */}
        <Analytics />
        {/* Speed Insights: Core Web Vitals(LCP/CLS/INP等)のフィールド計測 */}
        <SpeedInsights />
        {gaId && /^G-[A-Z0-9]+$/.test(gaId) && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
