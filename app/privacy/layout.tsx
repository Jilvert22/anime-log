import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | アニメログ',
  description: 'アニメログのプライバシーポリシー。収集する情報、利用目的、データの保管・削除について。',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
