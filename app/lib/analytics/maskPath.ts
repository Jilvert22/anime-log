/**
 * GA4 に送信する page_path / page_title から PII（ユーザー名）を除去するための純粋関数群。
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
