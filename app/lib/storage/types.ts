// ストレージサービスの共通型定義

export type WatchlistItem = {
  id: string;
  user_id?: string; // localStorageの場合は不要
  anilist_id: number;
  title: string;
  image: string | null;
  memo: string | null;
  created_at: string;
  // 今シーズン視聴予定機能用
  status?: 'planned' | 'watching' | 'completed' | null;
  season_year?: number | null;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  // 放送情報
  broadcast_day?: number | null; // 0-6 (0=日曜)
  broadcast_time?: string | null; // HH:mm形式
};

export interface IStorageService {
  // Watchlist操作
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(item: {
    anilist_id: number;
    title: string;
    image?: string | null;
    memo?: string | null;
    status?: 'planned' | 'watching' | 'completed' | null;
    season_year?: number | null;
    season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
    broadcast_day?: number | null;
    broadcast_time?: string | null;
  }): Promise<boolean>;
  removeFromWatchlist(anilistId: number): Promise<boolean>;
  updateWatchlistItem(
    anilistId: number,
    updates: {
      memo?: string | null;
      status?: 'planned' | 'watching' | 'completed' | null;
      season_year?: number | null;
      season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
      broadcast_day?: number | null;
      broadcast_time?: string | null;
    }
  ): Promise<boolean>;
  updateWatchlistItemsStatus(
    ids: string[],
    status: 'planned' | 'watching' | 'completed' | null
  ): Promise<boolean>;
  deleteWatchlistItems(ids: string[]): Promise<boolean>;
  
  // シーズン別watchlist取得
  getSeasonWatchlist(
    year: number,
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]>;
  getCurrentSeasonWatchlist(
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]>;
  getNextSeasonWatchlist(
    status?: 'planned' | 'watching' | 'completed'
  ): Promise<WatchlistItem[]>;
  
  // マイグレーション用
  migrateToSupabase?(items: WatchlistItem[]): Promise<boolean>;
}

