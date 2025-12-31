// 共通の型
export type AnimeId = number;
export type UserId = string;

// 主題歌の型定義
export type Song = {
  title: string;
  artist: string;
  rating: number;
  isFavorite: boolean;
};

// 名言の型定義
export type Quote = {
  text: string;
  character?: string;
};

// 感想の型定義
export type Review = {
  id: string;
  animeId: AnimeId;
  userId: UserId;
  userName: string;
  userIcon: string;
  type: 'overall' | 'episode';
  episodeNumber?: number;
  content: string;
  containsSpoiler: boolean;
  spoilerHidden: boolean;
  likes: number;
  helpfulCount: number;
  createdAt: string; // ISO 8601形式
  updatedAt: string; // ISO 8601形式
  userLiked?: boolean;
  userHelpful?: boolean;
};

// アニメの型定義
export type Anime = {
  id: AnimeId;
  title: string;
  image: string;
  rating: number;
  watched: boolean;
  rewatchCount?: number;
  tags?: string[];
  seriesName?: string;
  studios?: string[];
  songs?: {
    op?: Song;
    ed?: Song;
  };
  quotes?: Quote[];
  reviews?: Review[];
};

// シーズンの型定義
export type Season = {
  name: string;
  animes: Anime[];
};

// 推しキャラの型定義
export type FavoriteCharacter = {
  id: number;
  name: string;
  animeId: AnimeId;
  animeName: string;
  image: string;
  category: string;
  tags: string[];
};

// Supabaseのanimesテーブルの行型（新規作成時はidが不要）
export type SupabaseAnimeRow = {
  id?: number; // 新規作成時はオプショナル
  user_id: string;
  season_name: string;
  title: string;
  image: string | null;
  rating: number | null;
  watched: boolean;
  rewatch_count: number;
  tags: string[] | null;
  songs: {
    op?: Song;
    ed?: Song;
  } | null;
  quotes: Quote[] | null;
  series_name: string | null;
  studios: string[] | null;
  created_at?: string;
  updated_at?: string;
};

// AniList APIの検索結果型（HomeTabで使用）
// AniListMediaのエイリアスとして定義（型定義の重複を解消）
import type { AniListMedia } from '../lib/anilist';
export type AniListSearchResult = AniListMedia;

// Supabaseクライアント型（Database型が定義されていない場合はanyを使用）
import type { SupabaseClient } from '@supabase/supabase-js';

export type SupabaseClientType = SupabaseClient<any>;

// ユーザー型（@supabase/supabase-jsから）
import type { User } from '@supabase/supabase-js';
export type { User };

