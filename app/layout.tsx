import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// M PLUS Rounded 1c（日本語用）
const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '500', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rounded',
});

// Poppins（英数字用）
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animelog.jp'

export const metadata: Metadata = {
  title: 'アニメログ - あなたのアニメ視聴記録',
  description: 'アニメの視聴記録を管理し、あなただけのANIME DNAカードを作成しよう。視聴傾向の分析、感想の記録、積みアニメ管理など。',
  metadataBase: new URL(siteUrl),
  keywords: ["アニメ", "視聴履歴", "管理", "記録", "評価"],
  authors: [{ name: "アニメログ" }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
    title: 'アニメログ - あなたのアニメ視聴記録',
    description: 'アニメの視聴記録を管理し、あなただけのANIME DNAカードを作成しよう。',
    url: 'https://animelog.jp',
    siteName: 'アニメログ',
    images: [
      {
        url: '/og-image.png',
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
    title: 'アニメログ - あなたのアニメ視聴記録',
    description: 'アニメの視聴記録を管理し、あなただけのANIME DNAカードを作成しよう。',
    images: ['/og-image.png'],
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
  return (
    <html lang="ja" className={`${mPlusRounded.variable} ${poppins.variable}`}>
      <body className="font-mixed antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}