import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | アニメログ',
  description: 'アニメログの利用規約。サービス内容、利用資格、禁止事項などについて。',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
