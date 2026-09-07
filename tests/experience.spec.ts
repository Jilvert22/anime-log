import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// 合成データだけを使う。ログイン・外部API・本番データを必要としない回帰試験。
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin === origin &&
      !url.pathname.startsWith('/api/annict') &&
      !url.pathname.startsWith('/_vercel/')
    )
      return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.addInitScript(() => {
    window.__TEST_MODE__ = true;
    if (localStorage.getItem('qa-experience-seeded')) return;
    localStorage.setItem('qa-experience-seeded', 'true');
    localStorage.setItem('onboarding-completed', 'true');
    const now = new Date();
    localStorage.setItem(
      'lastSeasonCheck',
      `${now.getFullYear()}-${['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(now.getMonth() / 3)]}`
    );
    localStorage.setItem(
      'animeSeasons',
      JSON.stringify([
        {
          name: '2026年夏',
          animes: [
            { id: 1000100, anilistId: 123, title: '星の旅人', image: '', rating: 5, watched: true },
            { id: 1000101, anilistId: 456, title: '風の記録', image: '', rating: 4, watched: true },
          ],
        },
      ])
    );
    localStorage.setItem(
      'anime_watchlist',
      JSON.stringify([
        {
          id: 'qa-one',
          anilist_id: -1,
          title: '星の旅人',
          image: null,
          memo: '視聴メモ',
          created_at: '2026-09-01T00:00:00Z',
          status: 'watching',
          watched_episodes: 7,
          total_episodes: 12,
        },
        {
          id: 'qa-two',
          anilist_id: -1,
          title: '風の記録',
          image: null,
          memo: null,
          created_at: '2026-09-01T00:00:00Z',
          status: 'planned',
        },
      ])
    );
  });
});

test('スマホで1話記録・編集・再起動でき、手動作品を取り違えない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?tab=watching');
  const card = page.getByRole('article').filter({ hasText: '星の旅人' });
  await expect(card).toContainText('7 / 12 話');
  await page.getByRole('button', { name: '星の旅人を1話観た' }).click();
  await expect(card).toContainText('8 / 12 話');
  await card.getByRole('button', { name: '話数を編集', exact: true }).click();
  await card.getByLabel('観た話数').fill('12');
  await card.getByRole('button', { name: '保存する', exact: true }).click();
  await expect(card).toContainText('12 / 12 話');
  await expect(page.getByRole('button', { name: '星の旅人を1話観た' })).toBeDisabled();
  await page.reload();
  await expect(card).toContainText('12 / 12 話');
  await page.getByLabel('これから観る作品も表示').check();
  await expect(page.getByRole('article').filter({ hasText: '風の記録' })).toContainText(
    '0 話まで視聴'
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('書き出したJSONは表示中の話数を含み、作品棚の配色を切り替えられる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?tab=mypage');
  await expect(page.getByRole('heading', { name: '年別の作品棚' })).toBeVisible();
  await page.getByLabel('配色', { exact: false }).selectOption('night');
  await expect(page.getByText('2作品の思い出', { exact: true })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSONを書き出す' }).click();
  const downloaded = await pending;
  const json = JSON.parse(await readFile((await downloaded.path())!, 'utf8'));
  expect(json.watchlist[0].watched_episodes).toBe(7);
  expect(json.seasons[0].animes).toHaveLength(2);
  await page.getByText('もっと楽しめる振り返りを検討しています', { exact: true }).click();
  await expect(page.getByText(/購入や請求はありません/)).toBeVisible();
  await page.getByRole('button', { name: 'この追加機能に興味がある' }).click();
  await expect(page.getByRole('button', { name: '興味ありを選択しました' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('初回案内から作品追加へ進み、タブの戻る操作で前の画面に戻る', async ({ page }) => {
  await page.goto('/?tab=watching');
  await page.getByRole('button', { name: '好きな作品を選ぶ', exact: true }).click();
  await expect(page.getByRole('heading', { name: '新しいアニメを追加' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('nav').getByRole('button', { name: '視聴中', exact: true }).click();
  await page.locator('nav').getByRole('button', { name: 'ギャラリー', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '今日の視聴を記録' })).toBeVisible();
  await expect(
    page.locator('nav').getByRole('button', { name: '視聴中', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
});

test('ブラウザの削除案内からマイページに移動できる', async ({ page }) => {
  await page.goto('/delete-account');
  await expect(page.getByRole('heading', { name: 'アカウントとデータの削除' })).toBeVisible();
  await page.getByRole('link', { name: 'マイページを開く' }).click();
  await expect(page.getByRole('heading', { name: '記録の保存と書き出し' })).toBeVisible();
});

test('JSONの内容を確認して追加し、同じファイルを再実行しても重複しない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?tab=mypage');
  const panel = page.getByRole('region', { name: '記録の取り込み' });
  const file = {
    name: 'records.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'animelog-records',
        version: 1,
        seasons: [
          {
            name: '2026年夏',
            animes: [
              { id: 'exported-uuid', title: '新しい手動作品', image: '', rating: 5, watched: true },
            ],
          },
        ],
        watchlist: [
          {
            id: 'external-watch',
            anilist_id: -1,
            title: '新しい視聴予定',
            image: null,
            memo: '続きから',
            created_at: '2026-09-01T00:00:00Z',
            watched_episodes: 2,
            total_episodes: 12,
          },
        ],
      })
    ),
  };
  await panel.getByLabel('JSONファイルを選択', { exact: false }).setInputFiles(file);
  await expect(panel).toContainText('追加する視聴記録：1件 ／ 視聴予定：1件');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('animeSeasons')!)[0].animes.length)
  ).toBe(2);
  await panel.getByRole('button', { name: '確認した内容を取り込む' }).click();
  await expect(
    page.getByText('2件を追加しました。元のファイル・端末記録は残っています。', { exact: true })
  ).toBeVisible();
  const added = await page.evaluate(
    () => JSON.parse(localStorage.getItem('animeSeasons')!)[0].animes
  );
  expect(added).toHaveLength(3);
  expect(typeof added[2].id).toBe('number');
  const beforeDownload = page.waitForEvent('download');
  await panel.getByRole('button', { name: '復元前の記録を書き出す' }).click();
  const filePath = await (await beforeDownload).path();
  const previous = JSON.parse(await readFile(filePath!, 'utf8'));
  expect(previous.seasons[0].animes).toHaveLength(2);
  await panel.getByLabel('JSONファイルを選択', { exact: false }).setInputFiles(file);
  await expect(panel).toContainText('追加する視聴記録：0件 ／ 視聴予定：0件');
  await expect(panel).toContainText('追加しない重複：2件');
  await expect(panel.getByRole('button', { name: '確認した内容を取り込む' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('不正なファイルと確認後の編集で、現在の記録を上書きしない', async ({ page }) => {
  await page.goto('/?tab=mypage');
  const panel = page.getByRole('region', { name: '記録の取り込み' });
  await panel.getByLabel('JSONファイルを選択', { exact: false }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(panel.getByRole('alert')).toContainText('JSONファイルを選んでください');
  const before = await page.evaluate(() => localStorage.getItem('animeSeasons'));
  await panel.getByLabel('JSONファイルを選択', { exact: false }).setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'animelog-records',
        version: 1,
        seasons: [
          {
            name: '2026年秋',
            animes: [{ id: 1, title: '次の作品', image: '', rating: 0, watched: false }],
          },
        ],
        watchlist: [],
      })
    ),
  });
  await expect(panel).toContainText('追加する視聴記録：1件');
  await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('animeSeasons')!);
    value[0].animes[0].rating = 3;
    localStorage.setItem('animeSeasons', JSON.stringify(value));
  });
  await panel.getByRole('button', { name: '確認した内容を取り込む' }).click();
  await expect(panel.getByRole('alert')).toContainText('確認後に記録が更新されました');
  const current = await page.evaluate(() => JSON.parse(localStorage.getItem('animeSeasons')!));
  expect(current[0].animes).toHaveLength(JSON.parse(before!)[0].animes.length);
  expect(current[0].animes[0].rating).toBe(3);
});
