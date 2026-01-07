/**
 * 統一されたロギングシステム
 * 開発環境と本番環境で異なるログレベルを提供
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown, context?: string) => void;
}

class AppLogger implements Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // 開発環境ではすべてのログを出力
    }
    // 本番環境ではwarnとerrorのみ
    return level === 'warn' || level === 'error';
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown, context?: string): void {
    if (this.shouldLog('error')) {
      const prefix = context ? `[${context}]` : '[ERROR]';
      if (error instanceof Error) {
        console.error(`${prefix} ${message}`, error);
        if (this.isDevelopment && error.stack) {
          console.error('Stack trace:', error.stack);
        }
      } else if (error !== undefined) {
        console.error(`${prefix} ${message}`, error);
      } else {
        console.error(`${prefix} ${message}`);
      }
    }
  }
}

// シングルトンインスタンス
export const logger = new AppLogger();

/**
 * 非推奨: 後方互換性のためconsole.errorを直接使用している箇所を段階的に移行
 * 新しいコードではlogger.errorを使用してください
 */
export default logger;

