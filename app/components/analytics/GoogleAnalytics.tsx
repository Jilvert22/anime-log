'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { maskPath, maskTitle } from '../../lib/analytics/maskPath';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface GoogleAnalyticsProps {
  gaId: string;
}

/**
 * GA4 を手動ロードし、ルート変更ごとにマスク済みの page_view を手動送信する。
 *
 * `@next/third-parties` の `<GoogleAnalytics>` は自動計測が /profile/[username] の
 * username を page_path / page_title としてそのまま GA に送ってしまう（PII 送信の
 * ポリシー違反）。そのため自動計測を止め（send_page_view: false）、代わりに
 * usePathname() の変化を検知して maskPath/maskTitle でマスクした値を手動送信する。
 * クエリ文字列は送らない（page_location は origin + masked path のみ）。
 */
export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }

    const masked = maskPath(pathname);
    const title = maskTitle(pathname, document.title);

    window.gtag('event', 'page_view', {
      page_path: masked,
      page_location: window.location.origin + masked,
      page_title: title,
    });
  }, [pathname]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments)}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
