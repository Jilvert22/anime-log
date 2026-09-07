import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD)
    throw new Error('E2E用の認証設定が必要です');
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error || !data.user) throw new Error('E2Eアカウントの認証に失敗しました');
  return { client, userId: data.user.id };
}
function syntheticId(id: number) {
  if (!Number.isInteger(id) || id < 1_000_000_000 || id >= 1_100_000_000)
    throw new Error('E2Eの合成作品以外は操作できません');
}
export async function dbCleanupByAnilistId(anilistId: number): Promise<void> {
  syntheticId(anilistId);
  const { client, userId } = await testClient();
  try {
    const anime = await client
      .from('animes')
      .delete()
      .eq('user_id', userId)
      .eq('anilist_id', anilistId);
    const watch = await client
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('anilist_id', anilistId);
    if (anime.error || watch.error) throw new Error('E2Eデータの後始末に失敗しました');
  } finally {
    await client.auth.signOut({ scope: 'local' });
  }
}
export async function dbInsertPlannedWatchlist(anilistId: number, title: string): Promise<void> {
  syntheticId(anilistId);
  const { client, userId } = await testClient();
  try {
    const now = new Date();
    const season = ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(now.getMonth() / 3)];
    const { error } = await client.from('watchlist').insert({
      user_id: userId,
      anilist_id: anilistId,
      title,
      status: 'planned',
      season_year: now.getFullYear(),
      season,
    });
    if (error) throw new Error('E2Eの視聴予定を作成できませんでした');
  } finally {
    await client.auth.signOut({ scope: 'local' });
  }
}
export async function dbAnimeCount(anilistId: number): Promise<number> {
  syntheticId(anilistId);
  const { client, userId } = await testClient();
  try {
    const { count, error } = await client
      .from('animes')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', userId)
      .eq('anilist_id', anilistId);
    if (error) throw new Error('E2Eの保存結果を確認できませんでした');
    return count ?? 0;
  } finally {
    await client.auth.signOut({ scope: 'local' });
  }
}
export async function login(
  page: Page,
  { seasonCheck = 'current' }: { seasonCheck?: 'current' | 'stale' } = {}
) {
  await page.addInitScript((mode) => {
    window.__TEST_MODE__ = true;
    localStorage.setItem('onboarding-completed', 'true');
    localStorage.setItem('userIcon', '👤');
    const now = new Date();
    localStorage.setItem(
      'lastSeasonCheck',
      mode === 'stale'
        ? '1970-WINTER'
        : `${now.getFullYear()}-${['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(now.getMonth() / 3)]}`
    );
  }, seasonCheck);
  await page.goto('/');
  await page.getByRole('button', { name: 'ログイン', exact: true }).first().click();
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page
    .locator('div[class*="bg-white dark:bg-gray-800"]')
    .getByRole('button', { name: 'ログイン', exact: true })
    .last()
    .click();
  await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-onboarding="step-1"]')).toBeVisible({ timeout: 15000 });
}
