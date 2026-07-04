import { type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fskcfnjyyanvzjzsqeju.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

type SeasonCheck = 'current' | 'stale';

/**
 * テストユーザーの animes / watchlist から指定 anilist_id の行を DB から直接削除する。
 *
 * アプリの UI 削除 (AnimeDetailModal の「削除」) は、Supabase から読み込んだ作品に
 * 割り当てられる合成 ID で `animes.id`(UUID) を照合するため DB 削除が空振りし、
 * 画面からは消えても DB 行が残る既知の挙動がある。UNIQUE 制約下では残骸が次回の
 * 追加/移動を 23505 で失敗させるため、冪等な後始末は REST (Supabase JS) 経由で行う。
 *
 * env (NEXT_PUBLIC_SUPABASE_ANON_KEY / TEST_USER_*) が無ければ何もしない(best-effort)。
 */
export async function dbCleanupByAnilistId(anilistId: number): Promise<void> {
  if (!SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) return;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error || !data.user) return;
    const userId = data.user.id;
    await client.from('animes').delete().eq('user_id', userId).eq('anilist_id', anilistId);
    await client.from('watchlist').delete().eq('user_id', userId).eq('anilist_id', anilistId);
  } catch {
    // 掃除失敗はテスト本体に影響させない
  } finally {
    // scope:'local' 必須。既定の global はテストユーザーの全 refresh token を失効させ、
    // ブラウザ側のログインセッションまで巻き添えでログアウトさせてしまう。
    await client.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}

/**
 * テストユーザーの watchlist に「今期・視聴予定(planned)」の行を1件 DB に直接挿入する。
 * SeasonEndModal は getCurrentSeasonWatchlist('planned') が 1 件以上で発火するため、
 * 外部 API (今期アニメ一覧) に依存せず決定論的にモーダルを出すのに使う。
 * 事前に dbCleanupByAnilistId で同 anilist_id を掃除しておくこと (UNIQUE 制約)。
 */
export async function dbInsertPlannedWatchlist(anilistId: number, title: string): Promise<void> {
  if (!SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) return;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error || !data.user) return;
    const now = new Date();
    const m = now.getMonth() + 1;
    const season = m <= 3 ? 'WINTER' : m <= 6 ? 'SPRING' : m <= 9 ? 'SUMMER' : 'FALL';
    await client.from('watchlist').insert({
      user_id: data.user.id,
      anilist_id: anilistId,
      title,
      status: 'planned',
      season_year: now.getFullYear(),
      season,
    });
  } catch {
    // 失敗してもテスト本体に影響させない
  } finally {
    await client.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}

/**
 * テストユーザーでログインする。既存 anime.spec.ts の beforeEach を関数化したもの。
 *
 * `seasonCheck` で SeasonEndModal（「今期が始まりました！」）の発火を制御する:
 * - 'current' … localStorage の lastSeasonCheck を「今期キー」で既読化し、モーダルを抑止する。
 *   積み→視聴済み / レビュー投稿テストが不意のモーダルに邪魔されないようにする。
 * - 'stale' … lastSeasonCheck を常に過去の値にして毎ロード「未確認」扱いにし、
 *   今期 planned が 1 件以上あればモーダルを発火させる（シーズン終了テスト用）。
 *
 * キー形式は app/utils/helpers.ts の `${year}-${season}`（season は月から算出）に合わせる。
 */
export async function login(
  page: Page,
  { seasonCheck = 'current' }: { seasonCheck?: SeasonCheck } = {}
): Promise<void> {
  await page.addInitScript((mode) => {
    window.__TEST_MODE__ = true;
    // userIcon は useUserProfile で avatarPublicUrl || localStorage('userIcon') || null と
    // 導出される。テストユーザーはアバター未設定で null になり、reviews.user_icon(NOT NULL)
    // 違反でレビュー投稿が失敗するため、localStorage に絵文字アイコンを入れておく。
    localStorage.setItem('userIcon', '👤');
    const KEY = 'lastSeasonCheck';
    if (mode === 'current') {
      const now = new Date();
      const m = now.getMonth() + 1;
      const season = m <= 3 ? 'WINTER' : m <= 6 ? 'SPRING' : m <= 9 ? 'SUMMER' : 'FALL';
      localStorage.setItem(KEY, `${now.getFullYear()}-${season}`);
    } else {
      localStorage.setItem(KEY, '1970-WINTER');
    }
  }, seasonCheck);

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    console.log(`[Page Error] ${error.message}`);
  });

  await page.goto('/');

  await page.getByRole('button', { name: 'ログイン' }).first().click();
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);

  await page
    .locator('div[class*="bg-white dark:bg-gray-800"]')
    .getByRole('button', { name: 'ログイン' })
    .last()
    .click();

  // モーダルが閉じるのを待つ（閉じなくてもログイン成功していれば続行）
  await page
    .waitForSelector('div[class*="bg-white dark:bg-gray-800"]', {
      state: 'hidden',
      timeout: 10000,
    })
    .catch(() => {});

  // ログイン後、「+ アニメを追加」ボタン（クール別タブ）が出るまで待つ
  const addButton = page.locator('[data-onboarding="step-1"]');
  await addButton.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000);
}
