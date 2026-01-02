import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(
        new URL(`/?error=missing_env_vars`, requestUrl.origin)
      )
    }

    // リダイレクト先のURL
    const redirectUrl = new URL(next, requestUrl.origin)
    let redirectResponse = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
            // リダイレクトレスポンスを再作成してCookieを設定
            redirectResponse = NextResponse.redirect(redirectUrl)
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options)
            })
          } catch (error) {
            // Cookieの設定に失敗した場合でも続行
            console.error('Failed to set cookies:', error)
          }
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // 認証成功後、Cookieが設定されたリダイレクトレスポンスを返す
    return redirectResponse
  }

  // コードがない場合、指定されたページまたはホームにリダイレクト
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

