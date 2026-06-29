// ストレージサービスの共通型定義

import type { WatchlistStatus, WatchlistStatusValue } from '../watchlist/status';

export type WatchlistItem = {
  id: string;
  user_id?: string; // localStorageの場合は不要
  anilist_id: number;
  title: string;
  image: string | null;
  memo: string | null;
  created_at: string;
  // 今シーズン視聴予定機能用
  status?: WatchlistStatusValue;
  season_year?: number | null;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  // 放送情報
  broadcast_day?: number | null; // 0-6 (0=日曜)
  broadcast_time?: string | null; // HH:mm形式
  // 配信情報
  streaming_sites?: string[] | null;
  streaming_updated_at?: string | null;
  // 連続2クール: 対象シーズンに継続中として表示されているか (DBには保存しない、取得時に計算)
  isContinuing?: boolean;
};

export interface IStorageService {
  // Watchlist操作
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(item: {
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
  }): Promise<boolean>;
  removeFromWatchlist(anilistId: number): Promise<boolean>;
  updateWatchlistItem(
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
  ): Promise<boolean>;
  updateWatchlistItemsStatus(
    ids: string[],
    status: WatchlistStatusValue
  ): Promise<boolean>;
  deleteWatchlistItems(ids: string[]): Promise<boolean>;
  
  // シーズン別watchlist取得
  getSeasonWatchlist(
    year: number,
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
    status?: WatchlistStatus
  ): Promise<WatchlistItem[]>;
  getCurrentSeasonWatchlist(
    status?: WatchlistStatus
  ): Promise<WatchlistItem[]>;
  getNextSeasonWatchlist(
    status?: WatchlistStatus
  ): Promise<WatchlistItem[]>;
  
  // マイグレーション用
  migrateToSupabase?(items: WatchlistItem[]): Promise<boolean>;
  
  // 配信情報の更新（LocalStorageService専用メソッド）
  updateStreamingInfo?(id: string, streamingSites: string[]): void;
}

