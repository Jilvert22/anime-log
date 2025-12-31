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

// SNS機能用の型定義
export type UserProfile = {
  id: string;
  username: string;
  handle: string | null; // @で始まるハンドル（@なしで保存）
  bio: string | null;
  is_public: boolean;
  otaku_type: string | null; // 'auto' | プリセット名 | null
  otaku_type_custom: string | null; // カスタム入力の場合のテキスト
  avatar_url: string | null; // Supabase StorageのURL
  created_at: string;
  updated_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

// UUID形式かどうかを判定する関数
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// 注意: 以下の関数は新API (app/lib/api) に移行されました
// 後方互換性のため、型定義のみ残しています
// 関数を使用する場合は app/lib/api からimportしてください