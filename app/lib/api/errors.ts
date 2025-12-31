/**
 * API層のエラーハンドリング
 * カスタムエラークラスと日本語エラーメッセージを提供
 */

/**
 * APIエラーの基底クラス
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    // TypeScriptのError継承で必要な設定
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Supabaseエラークラス
 */
export class SupabaseError extends ApiError {
  constructor(
    message: string,
    code?: string,
    originalError?: unknown
  ) {
    super(message, code, undefined, originalError);
    this.name = 'SupabaseError';
    Object.setPrototypeOf(this, SupabaseError.prototype);
  }
}

/**
 * 認証エラークラス
 */
export class AuthenticationError extends SupabaseError {
  constructor(message: string = '認証が必要です', originalError?: unknown) {
    super(message, 'AUTH_ERROR', originalError);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * ネットワークエラークラス
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'ネットワークエラーが発生しました', originalError?: unknown) {
    super(message, 'NETWORK_ERROR', undefined, originalError);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * バリデーションエラークラス
 */
export class ValidationError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, originalError);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Supabaseのエラーを日本語メッセージに変換
 */
export function translateSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    
    // よくあるSupabaseエラーメッセージの日本語化
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
      'Email not confirmed': 'メールアドレスの確認が完了していません',
      'User already registered': 'このメールアドレスは既に登録されています',
      'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
      'User not found': 'ユーザーが見つかりません',
      'JWT expired': 'セッションの有効期限が切れました。再度ログインしてください',
      'duplicate key value violates unique constraint': 'この値は既に使用されています',
      'new row violates row-level security policy': '権限が不足しています',
      'relation does not exist': 'データベースエラーが発生しました',
    };
    
    // 完全一致チェック
    if (message in errorMap) {
      return errorMap[message];
    }
    
    // 部分一致チェック
    for (const [key, value] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return value;
      }
    }
    
    // マッチしない場合は元のメッセージを返す
    return message;
  }
  
  return 'エラーが発生しました';
}

/**
 * エラーをApiErrorに変換
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    const message = translateSupabaseError(error);
    return new SupabaseError(message, undefined, error);
  }
  
  if (error instanceof Error) {
    return new ApiError(error.message, undefined, undefined, error);
  }
  
  return new ApiError('予期しないエラーが発生しました', undefined, undefined, error);
}

/**
 * エラーログを出力（開発環境では詳細情報も出力）
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '[API Error]';
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`${prefix}`, error);
    if (error instanceof ApiError && error.originalError) {
      console.error(`${prefix} Original error:`, error.originalError);
    }
  } else {
    // 本番環境では簡潔なログのみ
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${prefix} ${message}`);
  }
}

