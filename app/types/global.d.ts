/**
 * グローバルオブジェクトの型拡張。
 * `(window as any).xxx` のようなキャストを排除し、型安全にアクセスするための宣言。
 */

declare global {
  interface Window {
    /** E2Eテスト (Playwright) が addInitScript で立てるフラグ。重複チェック等をスキップする */
    __TEST_MODE__?: boolean;
  }

  interface Navigator {
    /** iOS Safari 独自プロパティ。PWAがホーム画面から起動されたとき true */
    standalone?: boolean;
  }
}

export {};
