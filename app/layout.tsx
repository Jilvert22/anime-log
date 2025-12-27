import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "アニメログ",
  description: "自分だけのアニメ視聴履歴を記録・管理するWebアプリ。クール別表示、評価、周回数管理、DNAカード生成など。",
  keywords: ["アニメ", "視聴履歴", "管理", "記録", "評価"],
  authors: [{ name: "アニメログ" }],
  openGraph: {
    title: "アニメログ",
    description: "自分だけのアニメ視聴履歴を記録・管理するWebアプリ",
    url: "https://anime-log-rho.vercel.app",
    siteName: "アニメログ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "アニメログ",
    description: "自分だけのアニメ視聴履歴を記録・管理するWebアプリ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}