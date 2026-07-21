/**
 * GA4 に送信する page_path / page_location / page_referrer / page_title から
 * PII（ユーザー名）を除去するための純粋関数群。
 *
 * `/profile/{username}` と `/share/{username}` の username 部分は Google の公式ポリシー上
 * GA へ送信禁止の PII に該当するため、`[username]` に置換してから GA へ送る。
 * （参照: https://support.google.com/analytics/answer/12017362 ほか、GA4 の PII 禁止ポリシー）
 */

/** GA4 へ送る page_path から username を `[username]` にマスクする。 */
export function maskPath(pathname: string): string {
  return pathname.replace(/^\/(profile|share)\/[^/]+/, '/$1/[username]');
}

/**
 * GA4 へ送る page_title を決定する。
 * username が含まれるルート（/profile/{username}, /share/{username}）では
 * document.title をそのまま使わず、汎用的なタイトルを返す。
 */
export function maskTitle(pathname: string, title: string): string {
  const masked = maskPath(pathname);

  if (masked.startsWith('/profile/[username]')) {
    return 'プロフィール | アニメログ';
  }

  if (masked.startsWith('/share/[username]')) {
    return 'ANIME DNA | アニメログ';
  }

  return title;
}

/**
 * GA4 へ送る page_location（絶対URL）をマスクする。
 * pathname は maskPath でマスクし、クエリ文字列・フラグメントは PII 混入や URL 肥大化を
 * 避けるため常に除去する。href の解析に失敗する場合（空文字・相対URL等）は空文字を返す。
 */
export function maskLocationHref(href: string): string {
  if (!href) {
    return '';
  }

  try {
    const url = new URL(href);
    url.pathname = maskPath(url.pathname);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * GA4 へ送る page_referrer をマスクする。ルールは maskLocationHref と同じ
 * （自サイトの /profile/{username}・/share/{username} からの遷移はマスクし、
 * 外部サイトのリファラはホスト・パスをそのまま、クエリ・フラグメントのみ除去する）。
 */
export function maskReferrer(ref: string): string {
  return maskLocationHref(ref);
}

/**
 * Vercel Analytics / Speed Insights の beforeSend が渡す `url` フィールドをマスクする。
 * Speed Insights は route を `/profile/[username]` にマスクするが、別途 `url` フィールドで
 * username 入りの生パスを送るため（Vercel 公式ドキュメントの Data collected 参照）、
 * GA4 と同じ PII 方針でここでマスクする。
 *
 * この url は絶対URL・相対 pathname のどちらの形式もあり得るため両対応する
 * （maskLocationHref は絶対URL専用で、pathname を渡すと空文字になり全 url が失われる）。
 * pathname の username を `[username]` に置換し、クエリ・フラグメントは除去する。
 */
export function maskVercelUrl(url: string): string {
  if (!url) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.pathname = maskPath(parsed.pathname);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    // 相対 pathname（+ クエリ・フラグメント）の場合
    const pathname = url.split(/[?#]/)[0];
    return maskPath(pathname);
  }
}
