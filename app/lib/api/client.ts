/**
 * APIクライアントの共通処理
 * リトライロジック、リクエスト/レスポンスのインターセプトなど
 */

import { NetworkError, normalizeError, logError } from './errors';

/**
 * リトライ設定
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // ミリ秒
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * 指数バックオフで待機時間を計算
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * 指定時間待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リトライ可能なエラーかどうかを判定
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = Number(error.statusCode);
    return DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(statusCode);
  }
  
  return false;
}

/**
 * fetchリクエストをリトライ付きで実行
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // リトライ可能なステータスコードの場合
      if (config.retryableStatusCodes.includes(response.status) && attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config.retryDelay);
        logError(
          new Error(`HTTP ${response.status} received, retrying...`),
          'fetchWithRetry'
        );
        await sleep(delay);
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // リトライ可能なエラーで、まだリトライ回数に余裕がある場合
      if (isRetryableError(error) && attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config.retryDelay);
        logError(error, 'fetchWithRetry');
        await sleep(delay);
        continue;
      }
      
      // リトライ不可能、または最大リトライ回数に達した場合
      throw normalizeError(error);
    }
  }
  
  // ここに到達することは通常ないが、型安全性のため
  throw normalizeError(lastError);
}

/**
 * JSONレスポンスをパース（エラーハンドリング付き）
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  try {
    const text = await response.text();
    if (!text) {
      throw new Error('レスポンスが空です');
    }
    return JSON.parse(text) as T;
  } catch (error) {
    logError(error, 'parseJsonResponse');
    throw new NetworkError('レスポンスの解析に失敗しました', error);
  }
}

/**
 * レスポンスが成功かどうかをチェック
 */
export function checkResponseStatus(response: Response): void {
  if (!response.ok) {
    throw new NetworkError(
      `HTTPエラー: ${response.status} ${response.statusText}`,
      { statusCode: response.status }
    );
  }
}

