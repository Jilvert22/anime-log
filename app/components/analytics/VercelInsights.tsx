'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { maskVercelUrl } from '../../lib/analytics/maskPath';

/**
 * Vercel Analytics / Speed Insights をまとめて描画するクライアントラッパー。
 *
 * どちらも送信イベントの `url`（`/profile/{username}` 等 username 入りの生パスを含みうる）を
 * beforeSend でマスクする。Speed Insights は `route` を `/profile/[username]` にマスクするが
 * `url` フィールドは未マスクのまま送るため、GA4 と同じ PII 方針
 * （app/lib/analytics/maskPath / GoogleAnalytics.tsx）で塞ぐ。
 *
 * layout.tsx は Server Component のため beforeSend 関数を直接 props で渡せない
 * （RSC の制約で関数はシリアライズ不可）。この 'use client' 境界が必要。
 */
export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: maskVercelUrl(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: maskVercelUrl(event.url) })} />
    </>
  );
}
