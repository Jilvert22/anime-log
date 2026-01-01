import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env.test を読み込む（CI環境では環境変数が既に設定されている）
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // ローカル開発サーバーに向ける
    baseURL: 'http://localhost:3000',
    
    // スクリーンショットとトレースを残す（デバッグ用）
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // まずはChromeだけでテスト（シンプルに）
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // npm run dev を自動で起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 起動に時間かかる場合用
  },
});
