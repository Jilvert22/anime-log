import {
  test,
  expect,
  addAnime,
  expandAllSeasons,
  openReview,
  postReview,
} from './helpers/fixtures';
import { login, dbInsertPlannedWatchlist } from './helpers/auth';

test('積みアニメを視聴済みに移し、リロードなしで感想を投稿できる', async ({ page, anime }) => {
  await login(page);
  await page.locator('[data-tab="watchlist"]').first().click();
  await page.locator('[data-onboarding="step-2"]').click();
  await page.getByPlaceholder('アニメを検索...').fill(anime.title);
  await page.getByRole('button', { name: '検索', exact: true }).first().click();
  await page
    .locator('button')
    .filter({ hasText: anime.title })
    .filter({ hasNotText: '追加済み' })
    .first()
    .click();
  await expect(page.getByText('積みアニメに追加しました')).toBeVisible();
  await page.getByRole('button', { name: 'キャンセル', exact: true }).first().click();
  await page.locator('div.cursor-pointer').filter({ hasText: anime.title }).first().click();
  await page.getByRole('button', { name: '視聴済みにする', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: '視聴済みにする', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '視聴済みにする', exact: true }).last().click();
  await expect(
    page.getByRole('heading', { name: '視聴済みにする', exact: true })
  ).not.toBeVisible();
  await page.locator('[data-tab="watchlist"]').first().click();
  await expect(page.locator('div.cursor-pointer').filter({ hasText: anime.title })).toHaveCount(0);
  await expandAllSeasons(page);
  await openReview(page, anime.title);
  await postReview(page, `移動後の感想${anime.id}`);
});
test('投稿した感想が再読み込み後も残る', async ({ page, anime }) => {
  await login(page);
  await addAnime(page, anime.title);
  await openReview(page, anime.title);
  await postReview(page, `保存する感想${anime.id}`);
  await page.reload();
  await expandAllSeasons(page);
  await page.locator('div.cursor-pointer').filter({ hasText: anime.title }).first().click();
  await page.getByRole('button', { name: '感想', exact: true }).click();
  await expect(page.getByText(`保存する感想${anime.id}`, { exact: true })).toBeVisible();
});
test('クールの検索から追加した作品にリロードなしで感想を投稿できる', async ({ page, anime }) => {
  await login(page);
  await page.getByText('未登録のクールも含めて表示', { exact: true }).click();
  await page
    .getByRole('button', { name: new RegExp(`${new Date().getFullYear()}年.*作品`) })
    .click();
  // 固定の作品・年度に依存せず、表示された未登録クールから検索する。
  const season = page.getByRole('button', { name: /(冬|春|夏|秋).*未登録/ }).first();
  await expect(season).toBeVisible();
  await season.click();
  const result = page.locator('div.relative.group').filter({ hasText: anime.title }).first();
  await result.getByRole('button', { name: '追加', exact: true }).click();
  await expect(
    page.locator('div.cursor-pointer').filter({ hasText: anime.title }).first()
  ).toBeVisible();
  await openReview(page, anime.title);
  await postReview(page, `クール検索後の感想${anime.id}`);
});
test('シーズン開始時の予定作品を処理できる', async ({ page, anime }) => {
  await dbInsertPlannedWatchlist(anime.id, anime.title);
  await login(page, { seasonCheck: 'stale' });
  await page.reload();
  await expect(page.getByText('今期が始まりました！', { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText(anime.title, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '視聴中に移行', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '積みアニメに移動', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '削除', exact: true }).click();
  await expect(page.getByText('今期が始まりました！', { exact: true })).not.toBeVisible();
});
