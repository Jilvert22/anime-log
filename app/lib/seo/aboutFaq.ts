/**
 * /about に表示するFAQ。可視セクションと FAQPage JSON-LD の双方がこの配列を使うことで、
 * 「構造化データと可視内容を一致させる」Google要件を構造的に担保する。
 */
export const ABOUT_FAQ: { question: string; answer: string }[] = [
  {
    question: 'アニメログとは何ですか？',
    answer:
      'アニメの視聴記録をクール（春・夏・秋・冬）別に管理できる無料のWebアプリ（PWA）です。ログイン不要で今すぐ使えます。',
  },
  {
    question: 'ログインや会員登録は必要ですか？',
    answer:
      '不要です。アカウントを作成しなくても視聴記録をはじめられます。アカウントを作成すると複数の端末で同期できます。',
  },
  {
    question: '料金はかかりますか？',
    answer: 'すべての機能を無料でご利用いただけます。',
  },
  {
    question: 'ANIME DNAカードとは何ですか？',
    answer:
      '最推し作品5つとあなたの視聴傾向タイプを1枚の画像にまとめて、SNSでシェアできる機能です。',
  },
  {
    question: '視聴予定カードとは何ですか？',
    answer: '今期・来期の視聴予定を1枚の画像カードにして、保存したりSNSでシェアできる機能です。',
  },
];

export function faqPageJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ABOUT_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
