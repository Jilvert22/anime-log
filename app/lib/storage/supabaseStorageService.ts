'use client';

import { supabase } from '../supabase';
import type { IStorageService, WatchlistItem } from './types';
import type { WatchlistStatus, WatchlistStatusValue } from '../watchlist/status';
import { getSeasonWatchlist as apiGetSeasonWatchlist } from '../api/watchlist';

export class SupabaseStorageService implements IStorageService {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get watchlist:', error);
      return [];
    }

    return (data || []) as WatchlistItem[];
  }

  async addToWatchlist(item: {
    anilist_id: number;
    title: string;
    image?: string | null;
    memo?: string | null;
    status?: WatchlistStatusValue;
    season_year?: number | null;
    season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
    broadcast_day?: number | null;
    broadcast_time?: string | null;
    streaming_sites?: string[] | null;
  }): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // anilist_idが-1でない場合は重複チェック
    if (item.anilist_id !== -1) {
      const { data: existing } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('anilist_id', item.anilist_id)
        .single();

      if (existing) {
        // シーズン指定付きの追加で、既存のシーズンが異なる場合は付け替えて「移動」する。
        // (積みアニメ→視聴予定への追加や、誤った season で保存された旧データの修復用。
        //  localStorageService と api/watchlist.ts と挙動を揃える)
        if (
          item.season_year &&
          item.season &&
          (existing.season_year !== item.season_year || existing.season !== item.season)
        ) {
          const { error: moveError } = await supabase
            .from('watchlist')
            .update({
              season_year: item.season_year,
              season: item.season,
              status: item.status || 'planned',
              broadcast_day: item.broadcast_day ?? existing.broadcast_day,
              broadcast_time: item.broadcast_time ?? existing.broadcast_time,
              streaming_sites: item.streaming_sites ?? existing.streaming_sites,
            })
            .eq('id', existing.id);
          if (moveError) {
            console.error('Failed to move watchlist season:', moveError);
            return false;
          }
        }
        return true;
      }
    }

    const { error } = await supabase.from('watchlist').insert({
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
    });

    if (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    }

    return true;
  }

  async removeFromWatchlist(anilistId: number): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('anilist_id', anilistId);

    if (error) {
      console.error('Failed to remove from watchlist:', error);
      return false;
    }

    return true;
  }

  async updateWatchlistItem(
    anilistId: number,
    updates: {
      memo?: string | null;
      status?: WatchlistStatusValue;
      season_year?: number | null;
      season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
      broadcast_day?: number | null;
      broadcast_time?: string | null;
      streaming_sites?: string[] | null;
      streaming_updated_at?: string | null;
    }
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('watchlist')
      .update(updates)
      .eq('user_id', user.id)
      .eq('anilist_id', anilistId);

    if (error) {
      console.error('Failed to update watchlist item:', error);
      return false;
    }

    return true;
  }

  async updateWatchlistItemsStatus(ids: string[], status: WatchlistStatusValue): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || ids.length === 0) return false;

    const { error } = await supabase
      .from('watchlist')
      .update({ status })
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) {
      console.error('Failed to update watchlist items status:', error);
      return false;
    }

    return true;
  }

  async deleteWatchlistItems(ids: string[]): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || ids.length === 0) return false;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) {
      console.error('Failed to delete watchlist items:', error);
      return false;
    }

    return true;
  }

  async getSeasonWatchlist(
    year: number,
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
    status?: WatchlistStatus
  ): Promise<WatchlistItem[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    // API層の getSeasonWatchlist に委譲。前期開始で継続中の作品も和集合で拾う
    // (以前はここで完全一致クエリを直書きしており、継続作品が漏れていた)
    try {
      return await apiGetSeasonWatchlist(user.id, year, season, status);
    } catch (error) {
      console.error(`Failed to get watchlist for ${year} ${season}:`, error);
      return [];
    }
  }

  async getCurrentSeasonWatchlist(status?: WatchlistStatus): Promise<WatchlistItem[]> {
    const { getCurrentSeason } = await import('../../utils/helpers');
    const { year, season } = getCurrentSeason();
    return this.getSeasonWatchlist(year, season, status);
  }

  async getNextSeasonWatchlist(status?: WatchlistStatus): Promise<WatchlistItem[]> {
    const { getNextSeason } = await import('../../utils/helpers');
    const { year, season } = getNextSeason();
    return this.getSeasonWatchlist(year, season, status);
  }

  async migrateToSupabase(items: WatchlistItem[]): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || items.length === 0) return true; // ユーザーがいない、またはアイテムがない場合は成功とみなす

    try {
      // 既存のアイテムを取得して重複チェック
      const { data: existing } = await supabase
        .from('watchlist')
        .select('anilist_id')
        .eq('user_id', user.id);

      const existingIds = new Set((existing || []).map((item) => item.anilist_id));

      // 重複していないアイテムのみを追加
      const itemsToAdd = items
        .filter((item) => !existingIds.has(item.anilist_id))
        .map((item) => ({
          user_id: user.id,
          anilist_id: item.anilist_id,
          title: item.title,
          image: item.image,
          memo: item.memo,
          status: item.status,
          season_year: item.season_year,
          season: item.season,
          broadcast_day: item.broadcast_day,
          broadcast_time: item.broadcast_time,
          streaming_sites: item.streaming_sites,
        }));

      if (itemsToAdd.length === 0) return true;

      const { error } = await supabase.from('watchlist').insert(itemsToAdd);

      if (error) {
        console.error('Failed to migrate watchlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  }
}
