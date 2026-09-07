import { test, expect, addAnime, expandAllSeasons } from './helpers/fixtures';
import { login, dbAnimeCount } from './helpers/auth';

test('アニメを検索して追加し、再読み込みしても保存されている', async ({ page, anime }) => {
  await login(page);
  await addAnime(page, anime.title);
  await expect.poll(() => dbAnimeCount(anime.id)).toBe(1);
  await page.reload();
  await expandAllSeasons(page);
  await expect(page.getByText(anime.title, { exact: true })).toBeVisible();
});
test('追加したアニメを削除するとDBと再読み込み後の画面から消える', async ({ page, anime }) => {
  await login(page);
  await addAnime(page, anime.title);
  await page.locator('div.cursor-pointer').filter({ hasText: anime.title }).first().click();
  await expect(page.getByText('基本情報', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '削除', exact: true }).last().click();
  await expect(page.getByText('基本情報', { exact: true })).not.toBeVisible();
  await expect.poll(() => dbAnimeCount(anime.id)).toBe(0);
  await page.reload();
  await expandAllSeasons(page);
  await expect(page.getByText(anime.title, { exact: true })).toHaveCount(0);
});
