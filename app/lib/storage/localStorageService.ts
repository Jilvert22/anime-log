'use client';

import type { IStorageService, WatchlistItem } from './types';

const WATCHLIST_KEY = 'anime_watchlist';

export class LocalStorageService implements IStorageService {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getWatchlistFromStorage(): WatchlistItem[] {
    if (!this.isClient()) return [];
    
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  }

  private saveWatchlistToStorage(items: WatchlistItem[]): void {
    if (!this.isClient()) return;
    
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    return this.getWatchlistFromStorage();
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
    streaming_sites?: string[] | null;
  }): Promise<boolean> {
    try {
      const items = this.getWatchlistFromStorage();
      
      // 重複チェック（anilist_idが-1でない場合）
      if (item.anilist_id !== -1) {
        const existing = items.find(i => i.anilist_id === item.anilist_id);
        if (existing) {
          return true; // 既に存在する場合は成功とみなす
        }
      }

      const newItem: WatchlistItem = {
        id: crypto.randomUUID(),
        anilist_id: item.anilist_id,
        title: item.title,
        image: item.image || null,
        memo: item.memo || null,
        created_at: new Date().toISOString(),
        status: item.status || null,
        season_year: item.season_year || null,
        season: item.season || null,
        broadcast_day: item.broadcast_day || null,
        broadcast_time: item.broadcast_time || null,
        streaming_sites: item.streaming_sites || null,
      };

      items.push(newItem);
      this.saveWatchlistToStorage(items);
      return true;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    }
  }

  async removeFromWatchlist(anilistId: number): Promise<boolean> {
    try {
      const items = this.getWatchlistFromStorage();
      const filtered = items.filter(item => item.anilist_id !== anilistId);
      this.saveWatchlistToStorage(filtered);
      return true;
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      return false;
    }
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
    try {
      const items = this.getWatchlistFromStorage();
      const index = items.findIndex(item => item.anilist_id === anilistId);
      
      if (index === -1) return false;

      items[index] = {
        ...items[index],
        ...updates,
      };

      this.saveWatchlistToStorage(items);
      return true;
    } catch (error) {
      console.error('Failed to update watchlist item:', error);
      return false;
    }
  }

  async updateWatchlistItemsStatus(
    ids: string[],
    status: 'planned' | 'watching' | 'completed' | null
  ): Promise<boolean> {
    try {
      const items = this.getWatchlistFromStorage();
      
      items.forEach(item => {
        if (ids.includes(item.id)) {
          item.status = status;
        }
      });

      this.saveWatchlistToStorage(items);
      return true;
    } catch (error) {
      console.error('Failed to update watchlist items status:', error);
      return false;
    }
  }

  async deleteWatchlistItems(ids: string[]): Promise<boolean> {
    try {
      const items = this.getWatchlistFromStorage();
      const filtered = items.filter(item => !ids.includes(item.id));
      this.saveWatchlistToStorage(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete watchlist items:', error);
      return false;
    }
  }

  async getSeasonWatchlist(
    year: number,
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]> {
    const items = this.getWatchlistFromStorage();
    
    let filtered = items.filter(
      item => item.season_year === year && item.season === season && item.status !== null
    );

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // 新しい順
    });
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

  // マイグレーション用：全データを取得
  getAllWatchlistItems(): WatchlistItem[] {
    return this.getWatchlistFromStorage();
  }

  // マイグレーション用：localStorageをクリア
  clearWatchlist(): void {
    if (this.isClient()) {
      localStorage.removeItem(WATCHLIST_KEY);
    }
  }
}


