/**
 * API層の共通型定義
 */

import type { User } from '@supabase/supabase-js';
import type { WatchlistStatusValue } from '../watchlist/status';

/**
 * ユーザープロフィール型
 */
export type UserProfile = {
  id: string;
  username: string;
  handle: string | null; // @で始まるハンドル（@なしで保存）
  bio: string | null;
  is_public: boolean;
  otaku_type: string | null; // 'auto' | プリセット名 | null
  otaku_type_custom: string | null; // カスタム入力の場合のテキスト
  avatar_url: string | null; // Supabase StorageのURL
  created_at: string;
  updated_at: string;
};

/**
 * フォロー関係型
 */
export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

/**
 * ウォッチリストアイテム型
 */
export type WatchlistItem = {
  id: string;
  user_id: string;
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
  // 連続2クール: この作品が「対象シーズンに継続中」として表示されているか (DB保存値ではなく取得時に計算)
  isContinuing?: boolean;
  // 放送開始日 (AniListから取得時に付与、DBには保存しない)
  start_date?: { year: number | null; month: number | null; day?: number | null } | null;
};

/**
 * ウォッチリスト追加用のパラメータ型
 */
export type WatchlistItemInput = {
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
};

/**
 * ウォッチリスト更新用のパラメータ型
 */
export type WatchlistItemUpdate = {
  memo?: string | null;
  status?: WatchlistStatusValue;
  season_year?: number | null;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
};

/**
 * プロフィール作成・更新用のパラメータ型
 */
export type UserProfileInput = {
  username: string;
  handle?: string | null;
  bio?: string;
  is_public?: boolean;
  otaku_type?: string | null;
  otaku_type_custom?: string | null;
  avatar_url?: string | null;
};

/**
 * フォロー数・フォロワー数型
 */
export type FollowCounts = {
  following: number;
  followers: number;
};

/**
 * 認証済みユーザー情報（User型の再エクスポート）
 */
export type { User };

/**
 * シーズン型
 */
export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

