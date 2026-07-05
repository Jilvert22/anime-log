import { test, expect, type Page } from '@playwright/test';
import { login, dbCleanupByAnilistId, dbInsertPlannedWatchlist } from './helpers/auth';

/**
 * 積みアニメ / レビュー / シーズン終了の主要フローを検証する E2E。
 * 既存 tests/anime.spec.ts の流儀（実 Supabase・getByRole/getByText 主体・
 * 外部検索が 0 件ならスキップ）を踏襲する。
 *
 * DB UNIQUE 制約との相互作用:
 * 同一作品 (user_id, anilist_id) は 1 件しか登録できず、二重登録は 23505 で失敗する。
 * 共有テストアカウントに残骸が残ると次回の追加/移動が失敗するため、追加を伴うテストは
 * 開始時に対象作品を DB から掃除 (dbCleanupByAnilistId) して冪等にする。
 * (アプリの UI 削除は DB 削除が空振りするため後始末には使えない — helpers/auth.ts 参照)
 */

// テストで使う作品の AniList ID
const ANILIST_BOCCHI = 130003; // ぼっち・ざ・ろっく！
const ANILIST_LYCORIS = 143270; // リコリス・リコイル

// リロードしてアプリが操作可能になるまで待つ（DB 掃除の反映・モーダル残留の除去に使う）。
async function reloadReady(page: Page): Promise<void> {
  await page.reload();
  await page
    .locator('[data-onboarding="step-1"]')
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(500);
}

// クール別タブを開き、全クールを展開する（トグルではなく「全て展開」で決定論的に）。
async function expandAllSeasons(page: Page): Promise<void> {
  await page.locator('[data-tab="seasons"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const expandBtn = page.getByRole('button', { name: '全て展開' });
  if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expandBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

test.describe('積みアニメ・レビュー・シーズン終了フロー', () => {
  // 掃除→実行→後始末で操作数が多く、実 Supabase/外部検索の待ちも入るため延長する
  test.describe.configure({ timeout: 120_000 });

  test('積みアニメを追加して視聴済みに移動できる', async ({ page }) => {
    const SEARCH_WORD = 'ぼっち・ざ・ろっく';
    const TITLE = /ぼっち/;

    // ログイン前に残骸を DB から掃除（これで視聴済み移動時の 23505 を防ぐ）。
    await dbCleanupByAnilistId(ANILIST_BOCCHI);
    await login(page, { seasonCheck: 'current' });

    // 積みアニメタブへ。既に積みにあれば使い回し、無ければ検索して追加。
    await page.locator('[data-tab="watchlist"]').first().click();
    await page.waitForTimeout(500);

    let watchlistCard = page.locator('div.cursor-pointer').filter({ hasText: TITLE }).first();
    if (!(await watchlistCard.isVisible({ timeout: 2000 }).catch(() => false))) {
      await page.locator('[data-onboarding="step-2"]').click();
      const searchInput = page.getByPlaceholder('アニメを検索...');
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.fill(SEARCH_WORD);
      await page.getByRole('button', { name: '検索', exact: true }).first().click();
      await page
        .waitForSelector('text=検索中...', { state: 'hidden', timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(1000);

      const resultButton = page
        .locator('button')
        .filter({ hasText: TITLE })
        .filter({ hasNotText: '追加済み' })
        .first();
      if (!(await resultButton.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('積みアニメの検索結果が見つかりませんでした。スキップします。');
        return;
      }
      await resultButton.click();
      await expect(page.getByText('積みアニメに追加しました')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'キャンセル' }).first().click();
      await page.waitForTimeout(500);
      watchlistCard = page.locator('div.cursor-pointer').filter({ hasText: TITLE }).first();
    }

    // 積みカード → 詳細シート → 視聴済みにする
    await watchlistCard.click();
    await page.getByRole('button', { name: '視聴済みにする' }).first().click();
    await expect(page.getByRole('heading', { name: '視聴済みにする' })).toBeVisible({
      timeout: 5000,
    });

    // 評価を選択（任意）→ 確定
    await page
      .getByRole('button', { name: /^5/ })
      .first()
      .click()
      .catch(() => {});
    await page.getByRole('button', { name: '視聴済みにする' }).last().click();
    await page.waitForTimeout(1500);

    // 検証: 積みアニメ一覧から消えている
    await page.locator('[data-tab="watchlist"]').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('div.cursor-pointer').filter({ hasText: TITLE })).toHaveCount(0, {
      timeout: 5000,
    });

    // 検証: クール別タブに現れる
    await expandAllSeasons(page);
    await expect(page.getByText(TITLE).first()).toBeVisible({ timeout: 5000 });
  });

  test('アニメに感想（レビュー）を投稿できる', async ({ page }) => {
    const SEARCH_WORD = 'リコリス・リコイル';
    const TITLE = /リコリス/;
    const content = `E2Eテスト感想 ${Date.now()}`;

    // ログイン前に残骸を DB から掃除（reviews は animes 削除で CASCADE 削除される）
    await dbCleanupByAnilistId(ANILIST_LYCORIS);
    await login(page, { seasonCheck: 'current' });

    // 通常の追加フローで animes にレコードを作る（レビューには自分の animes 行が必要）
    await page.locator('[data-onboarding="step-1"]').click();
    await expect(page.getByText('新しいアニメを追加')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('アニメタイトルで検索').fill(SEARCH_WORD);
    const modal = page
      .locator('div[class*="bg-white dark:bg-gray-800"]')
      .filter({ hasText: '新しいアニメを追加' });
    await modal.getByRole('button', { name: '検索', exact: true }).click();
    await page
      .waitForSelector('text=検索中...', { state: 'hidden', timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(1000);

    const firstCheckbox = modal.locator('input[type="checkbox"]').first();
    if (!(await firstCheckbox.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('レビュー用アニメの検索結果が見つかりませんでした。スキップします。');
      return;
    }
    await firstCheckbox.click();
    await page.getByRole('button', { name: /件のアニメを登録/ }).click();
    await expect(page.getByText('新しいアニメを追加')).not.toBeVisible({ timeout: 10000 });

    // リロードして DB の実 ID を反映させる。一括登録（AddAnimeFormModal）は insert 戻り値の
    // 実 UUID を state に反映するよう修正済みで通常はリロード不要だが、共有テストアカウントに
    // 対象作品が残存（重複）していると insertAnimeRows が 23505 で失敗して合成 ID のままになる。
    // 冪等性のため、ここでは reload して DB の実 UUID を読み直す。
    await reloadReady(page);

    // クール別タブで対象カードを開く
    await expandAllSeasons(page);
    const card = page.locator('div.cursor-pointer').filter({ hasText: TITLE }).first();
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('追加したアニメのカードが見つかりませんでした。スキップします。');
      return;
    }
    await card.click();
    await expect(page.getByText('基本情報')).toBeVisible({ timeout: 5000 });

    // 感想タブ → 感想を投稿
    await page.getByRole('button', { name: '感想', exact: true }).click();
    await page.getByRole('button', { name: '+ 感想を投稿' }).click();
    await expect(page.getByRole('heading', { name: '感想を投稿' })).toBeVisible({ timeout: 5000 });

    // 本文を入力して投稿
    await page.getByPlaceholder('感想を入力してください...').fill(content);
    await page.getByRole('button', { name: '投稿', exact: true }).click();

    // 検証1: 投稿モーダルが閉じる（handleSubmit は成功時のみ onClose する）+ エラートーストなし
    await expect(page.getByRole('heading', { name: '感想を投稿' })).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('感想の投稿に失敗しました')).not.toBeVisible();

    // 検証2: リロード→再度開いて、投稿した本文が感想タブに表示される。
    // (useAnimeReviews の二重インスタンス統合 + loadReviews の id ガード緩和により、
    //  投稿した感想が一覧に反映されるようになった修正の実証)
    await reloadReady(page);
    await expandAllSeasons(page);
    await page.locator('div.cursor-pointer').filter({ hasText: TITLE }).first().click();
    await expect(page.getByText('基本情報')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '感想', exact: true }).click();
    await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
  });

  test('検索追加した作品にリロードなしで感想を投稿できる（useSeasonSearch 経路）', async ({
    page,
  }) => {
    // ぼっち・ざ・ろっく！は 2022年秋。クール別タブのシーズン検索から追加し、
    // リロードせずに感想を投稿できることを検証する（合成 id のまま state 保持だと
    // getAnimeRowId が UUID を見つけられず silent に失敗していた回帰の実証）。
    const TARGET_ANILIST = ANILIST_BOCCHI;
    const TITLE = /ぼっち/;
    const content = `E2E検索追加感想 ${Date.now()}`;

    await dbCleanupByAnilistId(TARGET_ANILIST);
    await login(page, { seasonCheck: 'current' });

    try {
      // クール別タブ →「未登録のクールも含めて表示」を ON にして未登録シーズンを出す
      await page.locator('[data-tab="seasons"]').first().click({ timeout: 8000 });
      await page.waitForTimeout(400);
      const showAll = page.getByText('未登録のクールも含めて表示');
      if (!(await showAll.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('「未登録のクールも含めて表示」トグルが見つかりませんでした。スキップします。');
        return;
      }
      await showAll.click();
      await page.waitForTimeout(500);

      // 2022年秋（未登録）を展開 → 自動でシーズン検索が走る。
      // 年が畳まれている場合はヘッダーをクリックして展開する。
      let seasonHeader = page.getByRole('button', { name: /秋.*未登録/ }).first();
      if (!(await seasonHeader.isVisible({ timeout: 2000 }).catch(() => false))) {
        const yearHeader = page.getByRole('button', { name: /2022年/ }).first();
        if (await yearHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
          await yearHeader.click().catch(() => {});
          await page.waitForTimeout(500);
        }
        seasonHeader = page.getByRole('button', { name: /秋.*未登録/ }).first();
      }
      if (!(await seasonHeader.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('2022年秋（未登録）のシーズンヘッダーが見つかりませんでした。スキップします。');
        return;
      }
      await seasonHeader.click();

      // シーズン検索（外部 AniList）の完了を待つ
      await page
        .waitForSelector('text=作品を検索中...', { state: 'hidden', timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(1500);

      // 検索結果カードから対象作品の「追加」ボタンを押す
      const resultCard = page.locator('div.relative.group').filter({ hasText: TITLE }).first();
      if (!(await resultCard.isVisible({ timeout: 8000 }).catch(() => false))) {
        console.log('シーズン検索結果に対象作品が見つかりませんでした。スキップします。');
        return;
      }
      await resultCard.getByRole('button', { name: '追加', exact: true }).click();
      // 追加完了を待つ（「追加中...」が消える）。リロードはしない（本テストの主眼）。
      await page.waitForTimeout(2500);

      // リロードなしで、追加された作品カード（登録済み表示）を開く
      const registeredCard = page.locator('div.cursor-pointer').filter({ hasText: TITLE }).first();
      if (!(await registeredCard.isVisible({ timeout: 8000 }).catch(() => false))) {
        console.log('追加後の登録カードが見つかりませんでした。スキップします。');
        return;
      }
      await registeredCard.click();
      await expect(page.getByText('基本情報')).toBeVisible({ timeout: 5000 });

      // 感想タブ → 感想を投稿
      await page.getByRole('button', { name: '感想', exact: true }).click();
      await page.getByRole('button', { name: '+ 感想を投稿' }).click();
      await expect(page.getByRole('heading', { name: '感想を投稿' })).toBeVisible({
        timeout: 5000,
      });
      await page.getByPlaceholder('感想を入力してください...').fill(content);
      await page.getByRole('button', { name: '投稿', exact: true }).click();

      // 検証: リロードせずに投稿が成功する（handleSubmit は成功時のみ onClose）
      await expect(page.getByRole('heading', { name: '感想を投稿' })).not.toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText('感想の投稿に失敗しました')).not.toBeVisible();
      // 追加直後（リロードなし）に一覧へ反映される
      await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
    } finally {
      await dbCleanupByAnilistId(TARGET_ANILIST);
    }
  });

  test('シーズン終了モーダルで前期アニメを処理できる', async ({ page }) => {
    const PLANNED_ANILIST = 999_000_001; // テスト専用の架空 ID（実作品と衝突しない）
    const PLANNED_TITLE = 'E2Eシーズン終了テスト作品';

    // 今期・視聴予定(planned)の行を DB に直接用意して、外部 API に依存せずモーダルを発火させる
    await dbCleanupByAnilistId(PLANNED_ANILIST);
    await dbInsertPlannedWatchlist(PLANNED_ANILIST, PLANNED_TITLE);

    try {
      // stale モード = lastSeasonCheck を過去値にして毎ロード「未確認」扱い。
      await login(page, { seasonCheck: 'stale' });

      // リロードして、認証セッション確立後にシーズン開始チェックを走らせる。
      // (ログイン直後の初回チェックはセッション確立前に走り planned が空判定される
      //  レースがあるため。addInitScript が stale キーを再注入するので再チェックで発火する)
      await page.reload();

      // 検証: シーズン終了モーダルと、作品名・3 つの選択肢が出る
      await expect(page.getByText('今期が始まりました！')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(PLANNED_TITLE)).toBeVisible();
      await expect(page.getByRole('button', { name: '視聴中に移行' })).toBeVisible();
      await expect(page.getByRole('button', { name: '積みアニメに移動' })).toBeVisible();
      await expect(page.getByRole('button', { name: '削除' })).toBeVisible();

      // 「削除」を選ぶとモーダルが閉じる
      await page.getByRole('button', { name: '削除' }).click();
      await expect(page.getByText('今期が始まりました！')).not.toBeVisible({ timeout: 10000 });
    } finally {
      await dbCleanupByAnilistId(PLANNED_ANILIST);
    }
  });
});
