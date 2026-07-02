// クライアント側で使用するSupabaseクライアント
// 注意: サーバー側では createServerSupabaseClient を使用してください
import { createBrowserSupabaseClient } from './supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// クライアント側用のSupabaseクライアントをエクスポート
// このクライアントはブラウザでのみ使用可能です
// 遅延評価により、モジュール読み込み時のエラーを回避
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // サーバー側では使用しない
    throw new Error('supabase client should only be used in client components');
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserSupabaseClient();
  }

  return supabaseInstance;
}

// getterプロパティとしてエクスポート（遅延評価）
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});

// SNS機能用の型は app/lib/api/types.ts を正とする (供給元を1つに統一)。
// 後方互換のため re-export のみ残す。
export type { UserProfile, Follow } from './api/types';
