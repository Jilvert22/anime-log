import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 正規（canonical）ホスト。metadataBase / canonical タグと揃える。
const CANONICAL_HOST = 'animelog.jp';

/**
 * Vercel の本番エイリアス（例: anime-log-rho.vercel.app）や不変デプロイURL
 * （anime-log-<hash>-<team>.vercel.app）へ来たアクセスを、正規ドメインへ 308 で寄せる。
 *
 * - 本番デプロイ限定（VERCEL_ENV === 'production'）。プレビュー(*.vercel.app)は
 *   VERCEL_ENV === 'preview' なので対象外＝プレビュー確認は今まで通り動く。
 * - 対象は `.vercel.app` ホストのみ。animelog.jp / www.animelog.jp などの
 *   カスタムドメインには触れない（www→apex の寄せは別途検討）。
 * - canonical タグだけだと vercel.app URL 自体は 200 で生き続けるため、
 *   ハードリダイレクトで重複URLを実体レベルで塞ぐ。
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host');

  if (process.env.VERCEL_ENV === 'production' && host && host.endsWith('.vercel.app')) {
    const url = req.nextUrl.clone();
    url.protocol = 'https';
    url.hostname = CANONICAL_HOST;
    url.port = '';
    // 308: 恒久リダイレクト かつ メソッド/ボディを保持
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Next 内部アセットと favicon 以外の全パスを対象（robots.txt / sitemap.xml も含む）。
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
