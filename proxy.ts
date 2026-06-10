import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from './app/lib/env'

// VercelのProxyタイムアウトより短くし、認証更新の遅延で画面表示を止めない。
const PROXY_TIMEOUT_MS = 8000

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs)
    }),
  ])
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv()

    // 環境変数が設定されていない場合は、そのままレスポンスを返す
    if (!supabaseUrl || !supabaseAnonKey) {
      return supabaseResponse
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // セッションを更新（タイムアウト付き）
    // タイムアウトが発生してもサイトは表示されるようにする
    await withTimeout(
      supabase.auth.getUser(),
      PROXY_TIMEOUT_MS,
      null
    )
  } catch (error) {
    // エラーが発生してもサイトは表示されるようにする
    // ログは本番環境では出力しない（Vercelのログに記録される）
    if (process.env.NODE_ENV === 'development') {
      console.error('[Proxy Error]', error)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのリクエストパスにマッチ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
