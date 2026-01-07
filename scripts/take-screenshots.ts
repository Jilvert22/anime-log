import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'screenshots');

// 出力ディレクトリを作成
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // /about ページ - ライトモード
    console.log('Taking screenshot: /about (light mode)...');
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // アニメーション待機
    await page.screenshot({
      path: join(OUTPUT_DIR, 'about-light.png'),
      fullPage: true,
    });

    // /about ページ - ダークモード
    console.log('Taking screenshot: /about (dark mode)...');
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(OUTPUT_DIR, 'about-dark.png'),
      fullPage: true,
    });

    // ホームページ - ライトモード
    console.log('Taking screenshot: / (light mode)...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // データ読み込み待機
    await page.screenshot({
      path: join(OUTPUT_DIR, 'home-light.png'),
      fullPage: true,
    });

    // ホームページ - ダークモード
    console.log('Taking screenshot: / (dark mode)...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(OUTPUT_DIR, 'home-dark.png'),
      fullPage: true,
    });

    console.log('✅ Screenshots saved to:', OUTPUT_DIR);
  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

takeScreenshots();

