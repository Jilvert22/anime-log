/**
 * ウォッチリスト関連のAPI
 */

'use client';

import { supabase } from '../supabase';
import { requireAuth, getCurrentUser } from './auth';
import {
  SupabaseError,
  translateSupabaseError,
  logError,
  normalizeError,
} from './errors';
import {
  validateLength,
  INPUT_LIMITS,
  throwIfInvalid,
} from '../validation';
import type { WatchlistItem, WatchlistItemInput, WatchlistItemUpdate, Season } from './types';

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
        // 既に登録されている場合は既存のアイテムを返す
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
  status: 'planned' | 'watching' | 'completed' | null
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
  status?: 'planned' | 'watching' | 'completed'
): Promise<WatchlistItem[]> {
  try {
    if (!userId) {
      return [];
    }

    let query = supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('season_year', year)
      .eq('season', season)
      .not('status', 'is', null);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'シーズンウォッチリストの取得に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
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
  status?: 'planned' | 'watching' | 'completed'
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
  status?: 'planned' | 'watching' | 'completed'
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
export async function getCurrentSeasonPlannedWatchlist(
  userId?: string
): Promise<WatchlistItem[]> {
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

