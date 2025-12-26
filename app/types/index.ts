// アニメの型定義
export type Anime = {
  id: number;
  title: string;
  image: string;
  rating: number;
  watched: boolean;
  rewatchCount?: number;
  tags?: string[];
  seriesName?: string; // シリーズ名（任意）
  studios?: string[]; // 制作会社（任意）
  songs?: {
    op?: { title: string; artist: string; rating: number; isFavorite: boolean };
    ed?: { title: string; artist: string; rating: number; isFavorite: boolean };
  };
  quotes?: { text: string; character?: string }[];
  reviews?: Review[]; // 感想一覧（オプション）
};

// 感想の型定義
export type Review = {
  id: string;
  animeId: number;
  userId: string;
  userName: string;
  userIcon: string;
  type: 'overall' | 'episode';
  episodeNumber?: number;
  content: string;
  containsSpoiler: boolean;
  spoilerHidden: boolean;
  likes: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  userLiked?: boolean; // 現在のユーザーがいいねしたか
  userHelpful?: boolean; // 現在のユーザーが役に立ったを押したか
};

// シーズンの型定義
export type Season = {
  name: string;
  animes: Anime[];
};

// 実績の型定義
export type Achievement = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: number;
};

// 布教リストの型定義
export type EvangelistList = {
  id: number;
  title: string;
  description: string;
  animeIds: number[];
  createdAt: Date;
};

// 推しキャラの型定義
export type FavoriteCharacter = {
  id: number;
  name: string;
  animeId: number;
  animeName: string;
  image: string;
  category: string;
  tags: string[];
};

// 声優の型定義
export type VoiceActor = {
  id: number;
  name: string;
  animeIds: number[]; // 出演したアニメのIDリスト
  animeNames: string[]; // 出演したアニメの名前リスト
  image: string; // アイコン（絵文字）
  notes?: string; // メモ（任意）
};
