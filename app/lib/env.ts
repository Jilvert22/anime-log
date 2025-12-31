/**
 * 環境変数のチェックと取得を行うユーティリティ
 */

/**
 * 必須の環境変数を取得し、未設定の場合はエラーをスロー（本番環境）または警告（開発環境）
 * @param name 環境変数名
 * @param description 環境変数の説明（エラーメッセージ用）
 * @param isClientSide クライアント側での呼び出しかどうか
 * @returns 環境変数の値（開発環境で未設定の場合は空文字）
 * @throws Error 環境変数が未設定の場合（本番環境のみ）
 */
export function getRequiredEnv(
  name: string,
  description?: string,
  isClientSide: boolean = false
): string {
  // Next.jsのenvから取得（next.config.tsで設定した値）
  const value = process.env[name] || '';
  
  if (!value || value.trim() === '') {
    const desc = description || name;
    const isDev = process.env.NODE_ENV === 'development';
    
    // 開発環境では警告のみで、空文字を返す（エラーをスローしない）
    if (isDev) {
      console.warn(`[環境変数警告] ${name}が未設定です。`);
      return ''; 
    }
    
    // 本番環境ではエラーをスロー
    throw new Error(`必須の環境変数「${name}」が設定されていません。`);
  }
  return value;
}

/**
 * 環境変数を取得し、未設定の場合はデフォルト値を返す
 * @param name 環境変数名
 * @param defaultValue デフォルト値
 * @returns 環境変数の値またはデフォルト値
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Supabaseの必須環境変数を取得
 * @param isClientSide クライアント側での呼び出しかどうか
 * @returns Supabase URLとAnon Key（開発環境で未設定の場合は空文字）
 * @throws Error 環境変数が未設定の場合（本番環境のみ）
 */
export function getSupabaseEnv(isClientSide: boolean = false) {
  const url = getRequiredEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'SupabaseプロジェクトのURL',
    isClientSide
  );
  const anonKey = getRequiredEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'Supabaseの匿名キー',
    isClientSide
  );
  
  // 開発環境で両方が空文字の場合、警告を追加
  if (process.env.NODE_ENV === 'development' && (!url || !anonKey)) {
    console.warn(
      '[環境変数警告] Supabase環境変数が設定されていません。' +
      'アプリケーションが正常に動作しない可能性があります。'
    );
  }
  
  return {
    url,
    anonKey,
  };
}

/**
 * サイトURLを取得（デフォルト値あり）
 * @returns サイトURL
 */
export function getSiteUrl(): string {
  return getEnv('NEXT_PUBLIC_SITE_URL', 'https://animelog.jp');
}

/**
 * Supabaseサービスロールキーを取得（オプショナル）
 * @returns サービスロールキーまたは空文字列
 */
export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/**
 * ビルド時に必須環境変数をチェック
 * この関数はビルド時または起動時に呼び出されることを想定
 */
export function validateRequiredEnv() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `以下の必須環境変数が設定されていません:\n${missing.join('\n')}\n\n` +
      `.env.localファイルに設定するか、Vercelの環境変数設定で設定してください。`
    );
  }
}

