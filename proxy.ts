import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './app/lib/env';

// VercelのProxyタイムアウトより短くし、認証更新の遅延で画面表示を止めない。
const PROXY_TIMEOUT_MS = 8000;

// 正規（canonical）ホスト。metadataBase / canonical タグと揃える。
const CANONICAL_HOST = 'animelog.jp';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

export async function proxy(request: NextRequest) {
  // 正規ホスト(animelog.jp)以外へ来た本番アクセスを apex へ 308 で寄せ、
  // 重複URLを実体レベルで塞ぐ。対象:
  //   - Vercel 本番エイリアス(*.vercel.app)/不変デプロイURL(anime-log-<hash>-<team>.vercel.app)
  //   - www.animelog.jp（apex へ未正規化だった別口の重複）
  // - 本番デプロイ限定（VERCEL_ENV === 'production'）。プレビューは
  //   VERCEL_ENV === 'preview' なので対象外＝プレビュー確認は今まで通り動く。
  // - apex 自身(host === CANONICAL_HOST)は素通し＝リダイレクトループしない。
  // Supabase の認証更新より前に早期 return する（飛ばす先で更新すれば十分）。
  // Host は大文字小文字非区別かつポート付き(:443)の場合があるため、
  // ポートを落として小文字化してから判定する（大文字ホスト等の取りこぼし防止）。
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();
  if (process.env.VERCEL_ENV === 'production' && host && host !== CANONICAL_HOST) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = 'https';
    redirectUrl.hostname = CANONICAL_HOST;
    redirectUrl.port = '';
    // 308: 恒久リダイレクト かつ メソッド/ボディを保持
    return NextResponse.redirect(redirectUrl, 308);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

    // 環境変数が設定されていない場合は、そのままレスポンスを返す
    if (!supabaseUrl || !supabaseAnonKey) {
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // セッションを更新（タイムアウト付き）
    // タイムアウトが発生してもサイトは表示されるようにする
    await withTimeout(supabase.auth.getUser(), PROXY_TIMEOUT_MS, null);
  } catch (error) {
    // エラーが発生してもサイトは表示されるようにする
    // ログは本番環境では出力しない（Vercelのログに記録される）
    if (process.env.NODE_ENV === 'development') {
      console.error('[Proxy Error]', error);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのリクエストパスにマッチ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known (TWA assetlinks 等。認証更新を挟まずクリーンに配信する)
     * - google...html (Search Console所有権確認ファイル。同上の理由で素のまま配信)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|\\.well-known|google[a-z0-9]+\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
