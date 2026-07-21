import type { Metadata } from 'next';

// パスワード再設定はトークン起点の遷移ページ。検索インデックス対象外にし、
// layout の `/` canonical 継承（誤り）を自ページに上書きする。
export const metadata: Metadata = {
  title: 'パスワード再設定',
  description: 'パスワードを再設定します。',
  alternates: {
    canonical: '/reset-password',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
