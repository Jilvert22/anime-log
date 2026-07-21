'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { maskLocationHref, maskPath, maskReferrer, maskTitle } from '../../lib/analytics/maskPath';

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
 * GA4 をロードし、マスク済みの page_location / page_referrer / page_title を
 * 「設定コンテキスト」レベルで確定させてから計測する。
 *
 * `send_page_view: false` は自動 page_view のみを止める。しかし GA4 が自動発火する
 * session_start / first_visit / user_engagement 等の他イベントは、`gtag('config')` 実行時点の
 * page_location（未マスクの実URL）をそのまま引き継いでしまうため、手動 page_view だけを
 * マスクしても /profile/[username] のような外部から直接ランディングする導線では
 * 最初の session_start で username が漏洩する。
 *
 * そこで gtag.js のロードと config 呼び出しを React 側の制御下に置き、
 * `gtag('config', ...)` の引数自体に最初からマスク済みの page_location/page_referrer/
 * page_title を渡す。dataLayer への push はスタブ関数（下記インラインスクリプト）が
 * 同期的に処理するため、gtag.js 本体の読み込みが完了する前に config 呼び出しが
 * キューに積まれても、実処理時にはマスク済みの値だけが使われる。
 */
export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const configuredRef = useRef(false);

  // 初回マウント時に1回だけ config を呼び、以降 gtag.js が発火する全イベント
  // （session_start / first_visit / user_engagement 等）が継承する
  // page_location / page_referrer / page_title をマスク済みの値で確定させる。
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag || configuredRef.current) {
      return;
    }
    configuredRef.current = true;

    window.gtag('config', gaId, {
      send_page_view: false,
      page_location: maskLocationHref(window.location.href),
      page_referrer: maskReferrer(document.referrer),
      page_title: maskTitle(window.location.pathname, document.title),
    });
  }, [gaId]);

  // ルート変更ごと（初回マウント含む）に、マスク済みの値でコンテキストを更新してから
  // 手動 page_view を送る。SPA 内遷移の page_referrer は前ページ URL の漏洩を避けるため
  // 送らない（空文字）。
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }

    let cancelled = false;
    let raf2 = 0;

    // document.title は Next.js のメタデータ更新前で古い可能性があるため、
    // 二重 requestAnimationFrame で1フレーム待ってから読む
    // （profile → about 遷移直後に古い profile title が送られる漏洩を防ぐ）。
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled || !window.gtag) {
          return;
        }

        const maskedPath = maskPath(pathname);
        const maskedLocation = maskLocationHref(window.location.href);
        const title = maskTitle(pathname, document.title);

        window.gtag('set', {
          page_location: maskedLocation,
          page_referrer: '',
          page_title: title,
        });

        window.gtag('event', 'page_view', {
          page_path: maskedPath,
          page_location: maskedLocation,
          page_title: title,
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
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
        `}
      </Script>
    </>
  );
}
