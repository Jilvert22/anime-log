'use client';

import { supabase } from '../supabase';
import type { IStorageService, WatchlistItem } from './types';

export class SupabaseStorageService implements IStorageService {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
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
    status?: 'planned' | 'watching' | 'completed' | null;
    season_year?: number | null;
    season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
    broadcast_day?: number | null;
    broadcast_time?: string | null;
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // anilist_idが-1でない場合は重複チェック
    if (item.anilist_id !== -1) {
      const { data: existing } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('anilist_id', item.anilist_id)
        .single();
      
      if (existing) {
        return true; // 既に登録されている場合は成功とみなす
      }
    }
    
    const { error } = await supabase
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
      });
    
    if (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    }
    
    return true;
  }

  async removeFromWatchlist(anilistId: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
      status?: 'planned' | 'watching' | 'completed' | null;
      season_year?: number | null;
      season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
      broadcast_day?: number | null;
      broadcast_time?: string | null;
    }
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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

  async updateWatchlistItemsStatus(
    ids: string[],
    status: 'planned' | 'watching' | 'completed' | null
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    let query = supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_year', year)
      .eq('season', season)
      .not('status', 'is', null);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to get watchlist for ${year} ${season}:`, error);
      return [];
    }

    return (data || []) as WatchlistItem[];
  }

  async getCurrentSeasonWatchlist(
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]> {
    const { getCurrentSeason } = await import('../../utils/helpers');
    const { year, season } = getCurrentSeason();
    return this.getSeasonWatchlist(year, season, status);
  }

  async getNextSeasonWatchlist(
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]> {
    const { getNextSeason } = await import('../../utils/helpers');
    const { year, season } = getNextSeason();
    return this.getSeasonWatchlist(year, season, status);
  }

  async migrateToSupabase(items: WatchlistItem[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || items.length === 0) return true; // ユーザーがいない、またはアイテムがない場合は成功とみなす

    try {
      // 既存のアイテムを取得して重複チェック
      const { data: existing } = await supabase
        .from('watchlist')
        .select('anilist_id')
        .eq('user_id', user.id);

      const existingIds = new Set((existing || []).map(item => item.anilist_id));

      // 重複していないアイテムのみを追加
      const itemsToAdd = items
        .filter(item => !existingIds.has(item.anilist_id))
        .map(item => ({
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
        }));

      if (itemsToAdd.length === 0) return true;

      const { error } = await supabase
        .from('watchlist')
        .insert(itemsToAdd);

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

