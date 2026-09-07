'use client';

import { supabase } from '../supabase';
import { requireAuth } from './auth';
import { SupabaseError } from './errors';
import type { WatchlistItem, WatchlistProgress } from './types';
import { validateProgress } from '../watchlist/progress';

export async function saveWatchlistProgress(
  id: string,
  progress: WatchlistProgress,
  expected: WatchlistProgress
): Promise<WatchlistItem> {
  validateProgress(progress);
  const user = await requireAuth();
  // 手動作品は anilist_id=-1 が重なるため、必ず行ID＋所有者で更新する。
  // 話数の比較で、別端末からの変更を古い表示で上書きすることを防ぐ。
  let query = supabase
    .from('watchlist')
    .update({ ...progress, status: 'watching' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('watched_episodes', expected.watched_episodes)
    .or('status.is.null,status.neq.completed');
  query =
    expected.total_episodes === null
      ? query.is('total_episodes', null)
      : query.eq('total_episodes', expected.total_episodes);
  const { data, error } = await query.select().single();
  if (error || !data) {
    throw new SupabaseError(
      '話数を保存できませんでした。再読み込みしてから、もう一度お試しください。',
      error?.code,
      error
    );
  }
  // 最終話でも自動削除・視聴記録への移動はしない。既存の完了操作で確定する。
  return data;
}
