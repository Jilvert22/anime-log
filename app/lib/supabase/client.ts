import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createBrowserSupabaseClient(): SupabaseClient {
  // NEXT_PUBLIC_環境変数はビルド時にインライン化される
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // フォールバック値（開発用）
    console.warn('[Supabase] 環境変数が読み込めません。フォールバック値を使用します。')
    return createBrowserClient(
      'https://fskcfnjyyanvzjzsqeju.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZza2Nmbmp5eWFudnpqenNxZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzI5NzksImV4cCI6MjA4MTg0ODk3OX0.Vvbd107l0JAUlJFCk50pkebDsfB4ABDtC4vWy1LtYys'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

