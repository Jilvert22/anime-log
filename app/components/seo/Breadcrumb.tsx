import Link from 'next/link';
import { JsonLd } from './JsonLd';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '../../lib/seo/structuredData';

type BreadcrumbProps = {
  /** ホーム→現在ページの順。最後の要素（現在ページ）には url を渡さないこと。 */
  items: BreadcrumbItem[];
};

/**
 * item.url(JSON-LD向けの絶対URL)から、実際のリンク先として使うパス部分だけを取り出す。
 * 絶対URLのまま <Link href> に渡すと、NEXT_PUBLIC_SITE_URL 未設定時のフォールバック値
 * (本番ドメイン)がdev/staging環境と食い違い、別オリジンへのフルリロードになってしまうため。
 */
function toRelativePath(absoluteUrl: string): string {
  try {
    const url = new URL(absoluteUrl);
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    // 既に相対パスならそのまま使う
    return absoluteUrl;
  }
}

/**
 * 可視パンくずナビ + JSON-LD(BreadcrumbList) を同じ items から同時出力するサーバーコンポーネント。
 *
 * 表示と構造化データを1箇所に集約することで「JSON-LDだけ出して画面に見えるパンくずが無い」
 * 状態（Googleに無視される/評価が下がるリスク）を構造的に防ぐ。'use client' は不要。
 *
 * 自身は固定ヘッダーの有無を関知しない（ページによってヘッダーがある/ないため）。
 * 固定ヘッダーの直下に置く場合は呼び出し側でヘッダー高さ分のオフセット（例: mt-14）を付与すること。
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <>
      <nav
        aria-label="パンくずリスト"
        className="border-b border-[var(--color-primary)]/10 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
      >
        <ol className="max-w-7xl mx-auto flex flex-wrap items-center gap-1 px-4 py-2 text-[13px]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isLinkable = !isLast && !!item.url;

            return (
              <li key={`${item.name}-${index}`} className="flex items-center gap-1">
                {index > 0 && <span className="text-gray-400 dark:text-gray-600">›</span>}
                {isLinkable ? (
                  <Link
                    href={toRelativePath(item.url as string)}
                    className="font-semibold text-[var(--color-primary)] no-underline hover:underline"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span
                    className="text-gray-500 dark:text-gray-400"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbListJsonLd(items)} />
    </>
  );
}
