'use client';

import { supabase } from '../supabase';
import { requireAuth } from './auth';
import { AuthenticationError, SupabaseError } from './errors';
import { getAnimesByUser } from './animes';
import { getWatchlist } from './watchlist';
import { animeToSupabase, supabaseToAnime } from '../../utils/helpers';
import type { Season } from '../../types';
import type { RecordBundle } from '../records/importValidation';
import { validateBundle } from '../records/importValidation';

export async function getAccountRecords(ownerId: string): Promise<RecordBundle> {
  const user = await requireAuth();
  if (user.id !== ownerId)
    throw new AuthenticationError('ログイン状態が変わりました。もう一度確認してください。');
  const [animes, watchlist] = await Promise.all([getAnimesByUser(ownerId), getWatchlist(ownerId)]);
  const grouped = new Map<string, Season>();
  for (const row of animes) {
    const name = row.season_name || '未分類';
    if (!grouped.has(name)) grouped.set(name, { name, animes: [] });
    grouped.get(name)!.animes.push(supabaseToAnime(row));
  }
  return validateBundle({ seasons: [...grouped.values()], watchlist });
}

export async function importAccountRecords(
  ownerId: string,
  bundle: RecordBundle
): Promise<{ animes_added: number; watchlist_added: number }> {
  const user = await requireAuth();
  if (user.id !== ownerId)
    throw new AuthenticationError('ログイン状態が変わりました。もう一度確認してください。');
  const safe = validateBundle(bundle);
  const animes = safe.seasons.flatMap((season) =>
    season.animes.map((anime) => ({
      ...animeToSupabase(anime, season.name, ownerId),
      import_key: anime.importKey,
      streaming_updated_at: anime.streamingUpdatedAt ?? null,
    }))
  );
  const watchlist = safe.watchlist.map((item) => ({ ...item, user_id: ownerId }));
  const { data, error } = await supabase.rpc('import_record_bundle', {
    expected_user_id: ownerId,
    anime_records: animes,
    watchlist_records: watchlist,
  });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883')
      throw new SupabaseError(
        'アカウントへの取り込みは準備中です。元の端末記録・ファイルはそのまま残っています。'
      );
    throw new SupabaseError(
      '取り込み結果を確認できませんでした。内容を再確認すると、保存済みの作品は重複を避けて再試行できます。'
    );
  }
  if (!data || !Number.isInteger(data.animes_added) || !Number.isInteger(data.watchlist_added))
    throw new SupabaseError('取り込み結果を確認できませんでした。もう一度内容を確認してください。');
  return data;
}
