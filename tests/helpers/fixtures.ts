import { test as base, expect, type Page } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import { dbCleanupByAnilistId } from './auth';
const run = process.env.GITHUB_RUN_ID || randomUUID();
type AnimeFixture = { id: number; title: string };
export const test = base.extend<{ anime: AnimeFixture }>({
  anime: async ({ page }, provideFixture, info) => {
    const id =
      1_000_000_000 +
      (createHash('sha256').update(`${run}:${info.testId}`).digest().readUInt32BE(0) % 100_000_000);
    const title = `E2E作品${id}`;
    const now = new Date();
    await page.route('https://graphql.anilist.co/**', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      const media = {
        id,
        title: { native: title, romaji: title, english: title },
        coverImage: { large: '', extraLarge: '', medium: '' },
        seasonYear: body.variables?.seasonYear ?? now.getFullYear(),
        season:
          body.variables?.season ??
          ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(now.getMonth() / 3)],
        episodes: 12,
        status: 'FINISHED',
        format: 'TV',
        isAdult: false,
        genres: [],
        studios: { nodes: [] },
        relations: { edges: [] },
        tags: [],
        externalLinks: [],
        nextAiringEpisode: null,
        description: 'E2E専用の合成作品',
        startDate: { year: now.getFullYear(), month: now.getMonth() + 1, day: 1 },
      };
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: { Page: { media: [media], pageInfo: { hasNextPage: false } }, Media: media },
        }),
      });
    });
    await page.route('**/api/annict', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: { searchWorks: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } },
        }),
      })
    );
    // 共有CIアカウントの既存作品を変更しないよう、ブラウザのDB読取をこの作品へ限定する。
    // 認証・DB保存・RLSは実Supabaseを使用し、後始末も合成IDだけを対象にする。
    await page.route(/\/rest\/v1\/(?:animes|watchlist)(?:\?|$)/, (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const url = new URL(route.request().url());
      url.searchParams.set('anilist_id', `eq.${id}`);
      return route.continue({ url: url.toString() });
    });
    await dbCleanupByAnilistId(id);
    try {
      await provideFixture({ id, title });
    } finally {
      await dbCleanupByAnilistId(id);
    }
  },
});
export { expect };
export async function expandAllSeasons(page: Page) {
  await page.locator('[data-tab="seasons"]').first().click();
  const expand = page.getByRole('button', { name: '全て展開', exact: true });
  if (await expand.isVisible()) await expand.click();
}
export async function addAnime(page: Page, title: string) {
  await page.locator('[data-onboarding="step-1"]').click();
  await page.getByPlaceholder('アニメタイトルで検索').fill(title);
  const modal = page
    .locator('div[class*="bg-white dark:bg-gray-800"]')
    .filter({ hasText: '新しいアニメを追加' });
  await modal.getByRole('button', { name: '検索', exact: true }).click();
  await modal.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: /件のアニメを登録/ }).click();
  await expect(page.getByText('新しいアニメを追加')).not.toBeVisible({ timeout: 10000 });
  await expandAllSeasons(page);
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
}
export async function openReview(page: Page, title: string) {
  await page.locator('div.cursor-pointer').filter({ hasText: title }).first().click();
  await page.getByRole('button', { name: '感想', exact: true }).click();
  await page.getByRole('button', { name: '+ 感想を投稿', exact: true }).click();
}
export async function postReview(page: Page, content: string) {
  await page.getByPlaceholder('感想を入力してください...').fill(content);
  // 先行の記録改善PRにも同じE2Eを適用する。規約ゲート自体は別途ユニットで固定する。
  const consent = page.getByRole('checkbox', { name: /利用規約・禁止事項/ });
  if (await consent.count()) {
    await expect(page.getByRole('button', { name: '投稿', exact: true })).toBeDisabled();
    await consent.check();
  }
  await page.getByRole('button', { name: '投稿', exact: true }).click();
  await expect(page.getByRole('heading', { name: '感想を投稿', exact: true })).not.toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(content, { exact: true })).toBeVisible({ timeout: 10000 });
}
