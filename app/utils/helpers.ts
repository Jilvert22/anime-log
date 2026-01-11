import { genreTranslation } from '../constants';
import type { Anime, SupabaseAnimeRow } from '../types';

// ジャンルを日本語に変換
export const translateGenre = (genre: string): string => {
  return genreTranslation[genre] || genre;
};

// データマッピング関数：Anime型 → Supabase形式（snake_case）
export function animeToSupabase(anime: Anime, seasonName: string, userId: string) {
  return {
    user_id: userId,
    season_name: seasonName,
    title: anime.title,
    image: anime.image || null,
    rating: anime.rating && anime.rating > 0 ? anime.rating : null, // 0の場合はNULLにする
    watched: anime.watched ?? false,
    rewatch_count: anime.rewatchCount ?? 0,
    tags: (anime.tags && anime.tags.length > 0) ? anime.tags : null,
    songs: anime.songs || null,
    quotes: anime.quotes || null,
    series_name: anime.seriesName || null,
    studios: (anime.studios && anime.studios.length > 0) ? anime.studios : null,
    streaming_sites: (anime.streamingSites && anime.streamingSites.length > 0) ? anime.streamingSites : null,
  };
}

// データマッピング関数：Supabase形式 → Anime型
export function supabaseToAnime(row: SupabaseAnimeRow): Anime {
  return {
    id: row.id ?? 0, // idが存在しない場合は0をデフォルト値として使用
    title: row.title,
    image: row.image ?? '', // nullの場合は空文字列に変換
    rating: row.rating ?? 0, // nullの場合は0に変換
    watched: row.watched,
    rewatchCount: row.rewatch_count ?? 0,
    tags: row.tags || [],
    songs: row.songs || undefined,
    quotes: row.quotes || undefined,
    seriesName: row.series_name || undefined,
    studios: row.studios || undefined,
    streamingSites: row.streaming_sites || undefined,
    streamingUpdatedAt: row.streaming_updated_at || undefined,
  };
}

// タイトルからシリーズ名を自動判定する関数
export function extractSeriesName(title: string): string {
  // 「2期」「3期」「Season 2」「S2」「The Final Season」などのパターンを検出
  const patterns = [
    /^(.+?)\s*[第]?(\d+)[期季]/,
    /^(.+?)\s*Season\s*(\d+)/i,
    /^(.+?)\s*S(\d+)/i,
    /^(.+?)\s*第(\d+)期/,
    /^(.+?)\s*第(\d+)シーズン/i,
    /^(.+?)\s*The\s+Final\s+Season/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // パターンにマッチしない場合は元の文字列を返す
  return title;
}

// 季節名に月の範囲を追加する関数
export function getSeasonNameWithMonths(seasonName: string): string {
  const monthRanges: { [key: string]: string } = {
    '冬': '1~3月',
    '春': '4~6月',
    '夏': '7~9月',
    '秋': '10~12月',
  };
  const months = monthRanges[seasonName] || '';
  return months ? `${seasonName} (${months})` : seasonName;
}

// シーズン名を日本語に変換、または年とクォーターからシーズン名を生成する関数
// オーバーロード: 文字列を受け取る場合（既存コードとの互換性）
export function getSeasonName(season: string): string;
// オーバーロード: 年とクォーターを受け取る場合（テスト用）
export function getSeasonName(year: number, quarter: number): string;
// 実装
export function getSeasonName(seasonOrYear: string | number, quarter?: number): string {
  // 2つの引数が渡された場合（年とクォーター）
  if (typeof seasonOrYear === 'number' && quarter !== undefined) {
    const seasonNames = ['冬', '春', '夏', '秋'];
    if (quarter < 1 || quarter > 4) {
      throw new Error('Quarter must be between 1 and 4');
    }
    return `${seasonOrYear}年${seasonNames[quarter - 1]}`;
  }
  
  // 1つの引数が渡された場合（文字列のシーズン名）
  const seasonMap: { [key: string]: string } = {
    'WINTER': '冬',
    'SPRING': '春',
    'SUMMER': '夏',
    'FALL': '秋',
  };
  return seasonMap[seasonOrYear as string] || (seasonOrYear as string);
}

// 現在のシーズンを取得する関数
export function getCurrentSeason(): { year: number; season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; seasonName: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  let season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  let seasonName: string;
  
  if (month >= 1 && month <= 3) {
    season = 'WINTER';
    seasonName = '冬 (1~3月)';
  } else if (month >= 4 && month <= 6) {
    season = 'SPRING';
    seasonName = '春 (4~6月)';
  } else if (month >= 7 && month <= 9) {
    season = 'SUMMER';
    seasonName = '夏 (7~9月)';
  } else {
    season = 'FALL';
    seasonName = '秋 (10~12月)';
  }
  
  return { year, season, seasonName };
}

// 来期（次のシーズン）を取得する関数
export function getNextSeason(): { year: number; season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; seasonName: string } {
  const current = getCurrentSeason();
  
  const seasonOrder: ('WINTER' | 'SPRING' | 'SUMMER' | 'FALL')[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const seasonNames: string[] = ['冬 (1~3月)', '春 (4~6月)', '夏 (7~9月)', '秋 (10~12月)'];
  const currentIndex = seasonOrder.indexOf(current.season);
  
  if (currentIndex === 3) {
    // FALL → 翌年のWINTER
    return { year: current.year + 1, season: 'WINTER', seasonName: '冬 (1~3月)' };
  }
  const nextIndex = currentIndex + 1;
  return { year: current.year, season: seasonOrder[nextIndex], seasonName: seasonNames[nextIndex] };
}

// 指定された年とシーズンが来期かどうかを判定する関数
export function isNextSeason(year: number, season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'): boolean {
  const next = getNextSeason();
  return next.year === year && next.season === season;
}

// シーズン名が今シーズンかどうかを判定する関数
export function isCurrentSeason(seasonName: string): boolean {
  const current = getCurrentSeason();
  const expectedSeasonName = `${current.year}年${current.seasonName}`;
  return seasonName === expectedSeasonName;
}

// シーズン開始時のモーダル表示チェック用のlocalStorageキー
const SEASON_CHECK_KEY = 'lastSeasonCheck';

// シーズン開始時のモーダルを表示すべきかどうかを判定
export function shouldShowSeasonStartModal(): boolean {
  const { year, season } = getCurrentSeason();
  const currentKey = `${year}-${season}`;
  
  // ブラウザ環境でのみlocalStorageを使用
  if (typeof window === 'undefined') return false;
  
  const lastCheck = localStorage.getItem(SEASON_CHECK_KEY);
  return lastCheck !== currentKey;
}

// シーズン開始時のモーダルを確認済みとしてマーク
export function markSeasonChecked(): void {
  const { year, season } = getCurrentSeason();
  const currentKey = `${year}-${season}`;
  
  // ブラウザ環境でのみlocalStorageを使用
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(SEASON_CHECK_KEY, currentKey);
}

// シーズン名を解析して年と季節を取得する関数
// シーズン名の形式: "YYYY年[春|夏|秋|冬]" または "YYYY年[春|夏|秋|冬] (X~Y月)"
export function parseSeasonName(seasonName: string): { year: number; season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' } | null {
  // "未分類"の場合はnullを返す
  if (seasonName === '未分類') return null;

  // シーズン名を解析（例: "2024年秋" または "2024年秋 (10~12月)"）
  const match = seasonName.match(/^(\d+)年(春|夏|秋|冬)/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const seasonJa = match[2];

  const seasonMap: { [key: string]: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' } = {
    '春': 'SPRING',
    '夏': 'SUMMER',
    '秋': 'FALL',
    '冬': 'WINTER',
  };

  const season = seasonMap[seasonJa];
  if (!season) return null;

  return { year, season };
}

// シーズン名を時系列順にソートする関数
// シーズン名の形式: "YYYY年[春|夏|秋|冬]" または "未分類"
// ソート順: 新しい年→古い年、同じ年は秋→夏→春→冬の順（秋が最新、アニメのクールは冬→春→夏→秋の順で放送されるため）、"未分類"は最後
export function sortSeasonsByTime(seasons: { name: string; animes: Anime[] }[]): { name: string; animes: Anime[] }[] {
  const seasonOrder: { [key: string]: number } = {
    '秋': 0,  // 最新
    '夏': 1,
    '春': 2,
    '冬': 3,
  };

  return [...seasons].sort((a, b) => {
    // "未分類"は最後に配置
    if (a.name === '未分類') return 1;
    if (b.name === '未分類') return -1;

    // シーズン名を解析（例: "2024年秋"）
    const matchA = a.name.match(/^(\d+)年(春|夏|秋|冬)$/);
    const matchB = b.name.match(/^(\d+)年(春|夏|秋|冬)$/);

    // パターンにマッチしない場合は最後に配置
    if (!matchA) return 1;
    if (!matchB) return -1;

    const yearA = parseInt(matchA[1], 10);
    const seasonA = matchA[2];
    const yearB = parseInt(matchB[1], 10);
    const seasonB = matchB[2];

    // 年で降順ソート（新しい年が上）
    if (yearA !== yearB) {
      return yearB - yearA;
    }

    // 同じ年の場合は、秋→夏→春→冬の順（秋が最新）
    return (seasonOrder[seasonA] || 999) - (seasonOrder[seasonB] || 999);
  });
}
