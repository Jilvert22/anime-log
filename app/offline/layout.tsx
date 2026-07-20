import type { Metadata } from 'next';

// オフライン時の PWA フォールバック。検索インデックス対象外にし、
// layout の `/` canonical 継承（誤り）を自ページに上書きする。
export const metadata: Metadata = {
  title: 'オフライン | アニメログ',
  description: 'インターネット接続がありません。',
  alternates: {
    canonical: '/offline',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
