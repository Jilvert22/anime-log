/**
 * ウォッチリスト関連のAPI
 */

'use client';

import { supabase } from '../supabase';
import { requireAuth, getCurrentUser } from './auth';
import { SupabaseError, translateSupabaseError, logError, normalizeError } from './errors';
import { validateLength, INPUT_LIMITS, throwIfInvalid } from '../validation';
import type { WatchlistItem, WatchlistItemInput, WatchlistItemUpdate, Season } from './types';
import type { WatchlistStatus, WatchlistStatusValue } from '../watchlist/status';
import { fetchAnimeStatusByIds } from './anilist';
import { isContinuingAnime, getPreviousSeason } from '../../utils/continuingAnime';

/**
 * 積みアニメ一覧を取得
 */
export async function getWatchlist(userId?: string): Promise<WatchlistItem[]> {
  try {
    const user = await getCurrentUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return [];
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ウォッチリストの取得に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
  } catch (error) {
    logError(error, 'getWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 積みアニメを追加（anilist_idが-1の場合は重複チェックなし）
 */
export async function addToWatchlist(item: WatchlistItemInput): Promise<WatchlistItem> {
  try {
    const user = await requireAuth();

    // memoのバリデーション
    if (item.memo !== undefined && item.memo !== null) {
      throwIfInvalid(validateLength(item.memo, 'メモ', INPUT_LIMITS.watchlistMemo));
    }

    // anilist_idが-1でない場合は重複チェック
    if (item.anilist_id !== -1) {
      const { data: existing } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('anilist_id', item.anilist_id)
        .single();

      if (existing) {
        // シーズン指定付きの追加で、既存アイテム(積みアニメ等)のシーズンが異なる場合は
        // シーズン情報を付け替えて「移動」する。黙って既存を返すと、積みアニメにある
        // 作品を視聴予定に追加した操作が無視されたように見えてしまうため
        if (
          item.season_year &&
          item.season &&
          (existing.season_year !== item.season_year || existing.season !== item.season)
        ) {
          const { data: moved, error: moveError } = await supabase
            .from('watchlist')
            .update({
              season_year: item.season_year,
              season: item.season,
              status: item.status || 'planned',
              broadcast_day: item.broadcast_day ?? existing.broadcast_day,
              broadcast_time: item.broadcast_time ?? existing.broadcast_time,
              streaming_sites: item.streaming_sites ?? existing.streaming_sites,
            })
            .eq('id', existing.id)
            .select()
            .single();
          if (moveError || !moved) {
            throw new SupabaseError(
              translateSupabaseError(moveError) || 'ウォッチリストの更新に失敗しました',
              undefined,
              moveError ?? undefined
            );
          }
          return moved;
        }
        // 同じ目的(同シーズンまたは積みアニメ同士)なら既存のアイテムを返す
        return existing;
      }
    }

    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        anilist_id: item.anilist_id,
        title: item.title,
        image: item.image || null,
        memo: item.memo || null,
        status: item.status || null,
        season_year: item.season_year || null,
        season: item.season || null,
        broadcast_day: item.broadcast_day || null,
        broadcast_time: item.broadcast_time || null,
        streaming_sites: item.streaming_sites || null,
      })
      .select()
      .single();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ウォッチリストへの追加に失敗しました',
        undefined,
        error
      );
    }

    if (!data) {
      throw new SupabaseError('ウォッチリストへの追加に失敗しました');
    }

    return data;
  } catch (error) {
    logError(error, 'addToWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 積みアニメを削除
 */
export async function removeFromWatchlist(anilistId: number): Promise<void> {
  try {
    const user = await requireAuth();

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('anilist_id', anilistId);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ウォッチリストからの削除に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'removeFromWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 積みアニメを更新（メモ、ステータスなど）
 */
export async function updateWatchlistItem(
  anilistId: number,
  updates: WatchlistItemUpdate
): Promise<WatchlistItem> {
  try {
    const user = await requireAuth();

    // memoのバリデーション
    if (updates.memo !== undefined && updates.memo !== null) {
      throwIfInvalid(validateLength(updates.memo, 'メモ', INPUT_LIMITS.watchlistMemo));
    }

    const { data, error } = await supabase
      .from('watchlist')
      .update(updates)
      .eq('user_id', user.id)
      .eq('anilist_id', anilistId)
      .select()
      .single();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ウォッチリストアイテムの更新に失敗しました',
        undefined,
        error
      );
    }

    if (!data) {
      throw new SupabaseError('ウォッチリストアイテムの更新に失敗しました');
    }

    return data;
  } catch (error) {
    logError(error, 'updateWatchlistItem');
    throw normalizeError(error);
  }
}

/**
 * 複数アイテムのステータスを一括更新
 */
export async function updateWatchlistItemsStatus(
  ids: string[],
  status: WatchlistStatusValue
): Promise<void> {
  try {
    const user = await requireAuth();

    if (ids.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .update({ status })
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ウォッチリストアイテムの一括更新に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'updateWatchlistItemsStatus');
    throw normalizeError(error);
  }
}

/**
 * 複数アイテムを一括削除
 */
export async function deleteWatchlistItems(ids: string[]): Promise<void> {
  try {
    const user = await requireAuth();

    if (ids.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ウォッチリストアイテムの一括削除に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'deleteWatchlistItems');
    throw normalizeError(error);
  }
}

/**
 * 指定シーズンの視聴予定アニメを取得
 */
export async function getSeasonWatchlist(
  userId: string,
  year: number,
  season: Season,
  status?: WatchlistStatus
): Promise<WatchlistItem[]> {
  try {
    if (!userId) {
      return [];
    }

    // 1. 開始期がターゲットと一致するアイテム (通常の取得)
    let startMatchQuery = supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('season_year', year)
      .eq('season', season)
      .not('status', 'is', null);

    if (status) {
      startMatchQuery = startMatchQuery.eq('status', status);
    }

    // 2. 前期開始のアイテム (連続2クール候補)
    const prev = getPreviousSeason({ year, season });
    let prevQuery = supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('season_year', prev.year)
      .eq('season', prev.season)
      .not('status', 'is', null);

    if (status) {
      prevQuery = prevQuery.eq('status', status);
    }

    const [startMatchRes, prevRes] = await Promise.all([
      startMatchQuery.order('created_at', { ascending: false }),
      prevQuery.order('created_at', { ascending: false }),
    ]);

    if (startMatchRes.error) {
      throw new SupabaseError(
        translateSupabaseError(startMatchRes.error) || 'シーズンウォッチリストの取得に失敗しました',
        undefined,
        startMatchRes.error
      );
    }
    if (prevRes.error) {
      throw new SupabaseError(
        translateSupabaseError(prevRes.error) || 'シーズンウォッチリストの取得に失敗しました',
        undefined,
        prevRes.error
      );
    }

    const startMatch = (startMatchRes.data || []) as WatchlistItem[];
    const prevItems = (prevRes.data || []) as WatchlistItem[];

    // 3. 全アイテムのAniListデータを一括取得 (継続判定 + 放送開始日表示用)
    const allIds = [...startMatch, ...prevItems].map((it) => it.anilist_id);
    const mediaMap = allIds.length > 0 ? await fetchAnimeStatusByIds(allIds) : new Map();

    // 4. startMatch に開始日を付与
    const enrichedStartMatch = startMatch.map((it) => {
      const media = mediaMap.get(it.anilist_id);
      return media?.startDate ? { ...it, start_date: media.startDate } : it;
    });

    // 5. 前期アイテムの中から「対象シーズンに継続中」のものだけ抽出 + 開始日付与
    const continuing = prevItems
      .filter((it) => {
        const media = mediaMap.get(it.anilist_id);
        return media ? isContinuingAnime(media, { year, season }) : false;
      })
      .map((it) => {
        const media = mediaMap.get(it.anilist_id);
        return {
          ...it,
          isContinuing: true,
          ...(media?.startDate ? { start_date: media.startDate } : {}),
        };
      });

    return [...enrichedStartMatch, ...continuing];
  } catch (error) {
    logError(error, 'getSeasonWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 今期（現在のシーズン）の視聴予定アニメを取得
 */
export async function getCurrentSeasonWatchlist(
  userId?: string,
  status?: WatchlistStatus
): Promise<WatchlistItem[]> {
  try {
    const user = await getCurrentUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return [];
    }

    // 今期のシーズンを取得
    const { getCurrentSeason } = await import('../../utils/helpers');
    const { year, season } = getCurrentSeason();

    return getSeasonWatchlist(targetUserId, year, season, status);
  } catch (error) {
    logError(error, 'getCurrentSeasonWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 来期（次のシーズン）の視聴予定アニメを取得
 */
export async function getNextSeasonWatchlist(
  userId?: string,
  status?: WatchlistStatus
): Promise<WatchlistItem[]> {
  try {
    const user = await getCurrentUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return [];
    }

    // 来期のシーズンを取得
    const { getNextSeason } = await import('../../utils/helpers');
    const { year, season } = getNextSeason();

    return getSeasonWatchlist(targetUserId, year, season, status);
  } catch (error) {
    logError(error, 'getNextSeasonWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 今期（現在のシーズン）で視聴予定（planned）のアニメを取得
 * 「来期」が「今期」になった時点で、視聴予定のアニメをチェックするために使用
 */
export async function getCurrentSeasonPlannedWatchlist(userId?: string): Promise<WatchlistItem[]> {
  try {
    const user = await getCurrentUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return [];
    }

    // 現在のシーズンを取得
    const { getCurrentSeason } = await import('../../utils/helpers');
    const { year, season } = getCurrentSeason();

    // 今期で視聴予定（planned）のアニメを取得
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('season_year', year)
      .eq('season', season)
      .eq('status', 'planned')
      .order('created_at', { ascending: false });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || '今期視聴予定ウォッチリストの取得に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
  } catch (error) {
    logError(error, 'getCurrentSeasonPlannedWatchlist');
    throw normalizeError(error);
  }
}

/**
 * 視聴予定リストの (season_year, season) を AniList の開始期と照合し、不一致のものを修正する。
 * PR #19 以前に保存されたデータは「活性ビューのシーズン」で保存されている可能性があり、
 * これによって連続2クール作品が今期/来季の片側にしか出てこない不具合が発生する。
 * この関数を呼び出すと、watchlist 全件を AniList と照合して開始期に揃える。
 *
 * @returns 修復件数 (検査件数 / 更新件数)
 */
export async function repairWatchlistSeasons(
  userId?: string
): Promise<{ checked: number; repaired: number }> {
  try {
    const user = await getCurrentUser();
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      return { checked: 0, repaired: 0 };
    }

    // 1. ユーザーの全 watchlist を取得 (season_year/season を持つもののみ対象)
    const { data: items, error } = await supabase
      .from('watchlist')
      .select('id, anilist_id, season_year, season')
      .eq('user_id', targetUserId)
      .not('season_year', 'is', null)
      .not('season', 'is', null);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || '修復対象の取得に失敗しました',
        undefined,
        error
      );
    }

    const list = (items || []) as Array<{
      id: string;
      anilist_id: number;
      season_year: number | null;
      season: Season | null;
    }>;

    if (list.length === 0) return { checked: 0, repaired: 0 };

    // 2. AniList から開始期情報を一括取得
    const mediaMap = await fetchAnimeStatusByIds(list.map((it) => it.anilist_id));

    // 3. (season_year, season) が AniList の開始期と違うものを修正
    const { getStartSeason } = await import('../../utils/continuingAnime');
    let repaired = 0;
    for (const it of list) {
      const media = mediaMap.get(it.anilist_id);
      if (!media) continue;
      const start = getStartSeason(media);
      if (!start) continue;
      if (start.year === it.season_year && start.season === it.season) continue;

      const { error: updateError } = await supabase
        .from('watchlist')
        .update({ season_year: start.year, season: start.season })
        .eq('id', it.id);
      if (updateError) {
        logError(updateError, `repairWatchlistSeasons:${it.id}`);
        continue;
      }
      repaired += 1;
    }

    return { checked: list.length, repaired };
  } catch (error) {
    logError(error, 'repairWatchlistSeasons');
    throw normalizeError(error);
  }
}
