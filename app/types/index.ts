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

