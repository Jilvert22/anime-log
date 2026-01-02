// app/lib/api/annict.ts
/**
 * Annict API関連
 * GraphQL APIのラッパー関数（API Route経由）
 */

import { NetworkError, logError, normalizeError } from './errors';
import type { AniListMedia } from '../anilist';

// ============================================
// 型定義
// ============================================

export type AnnictMedia = 'TV' | 'OVA' | 'MOVIE' | 'WEB' | 'OTHER';

export type AnnictChannel = {
  name: string;
};

export type AnnictProgram = {
  startedAt: string;
  channel: AnnictChannel;
};

export type AnnictCast = {
  character: {
    name: string;
  };
  person: {
    name: string;
  };
};

export type AnnictWork = {
  annictId: number;
  title: string;
  titleKana: string;
  media: AnnictMedia;
  officialSiteUrl: string | null;
  twitterHashtag: string | null;
  programs: {
    nodes: AnnictProgram[];
  };
  casts?: {
    nodes: AnnictCast[];
  };
};

export type AnnictSearchResult = {
  searchWorks: {
    nodes: AnnictWork[];
    pageInfo?: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

// ============================================
// 配信サービス判定用
// ============================================

// 配信サービスのリスト
const STREAMING_SERVICES = [
  'dアニメストア',
  'Amazon Prime Video',
  'Netflix',
  'U-NEXT',
  'ABEMA',
  'Disney+',
  'Hulu',
  'FOD',
  'DMM TV',
  'バンダイチャンネル',
  'アニメ放題',
  'ニコニコ動画',
  'ニコニコチャンネル',
  'GYAO!',
  'TVer',
  'Lemino',
];

/**
 * チャンネル名が配信サービスかどうかを判定
 */
export function isStreamingService(channelName: string): boolean {
  return STREAMING_SERVICES.some(service => 
    channelName.includes(service) || service.includes(channelName)
  );
}

/**
 * プログラム一覧から配信サービスを抽出
 */
export function extractStreamingServices(programs: AnnictProgram[]): string[] {
  const services = new Set<string>();
  
  for (const program of programs) {
    if (isStreamingService(program.channel.name)) {
      services.add(program.channel.name);
    }
  }
  
  return Array.from(services);
}

/**
 * プログラム一覧から放送局（TV局）を抽出
 */
export function extractBroadcastChannels(programs: AnnictProgram[]): string[] {
  const channels = new Set<string>();
  
  for (const program of programs) {
    if (!isStreamingService(program.channel.name)) {
      channels.add(program.channel.name);
    }
  }
  
  return Array.from(channels);
}

/**
 * プログラム一覧から放送日時を抽出（最初の放送情報を取得）
 */
export function extractBroadcastTime(programs: AnnictProgram[]): string | null {
  if (programs.length === 0) return null;
  
  // 最初の放送情報を取得
  const firstProgram = programs[0];
  if (!firstProgram.startedAt) return null;
  
  try {
    const date = new Date(firstProgram.startedAt);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const day = dayNames[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('放送日時の解析に失敗しました:', error);
    return null;
  }
}

// ============================================
// API関数
// ============================================

/**
 * Annict GraphQL APIにリクエストを送信（API Route経由）
 */
async function queryAnnict<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  try {
    const response = await fetch('/api/annict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new NetworkError(`Annict API エラー: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map((e: { message: string }) => e.message).join(', ');
      throw new NetworkError(`Annict API エラー: ${errorMessages}`);
    }

    if (!data.data) {
      throw new NetworkError('Annict API からデータが返されませんでした');
    }

    return data.data;
  } catch (error) {
    logError(error, 'queryAnnict');
    throw normalizeError(error);
  }
}

/**
 * シーズン別にアニメを検索
 * @param season シーズン文字列（例: "2025-winter"）
 * @param first 取得件数（デフォルト: 50）
 */
export async function searchAnnictBySeason(
  season: string,
  first: number = 50
): Promise<AnnictWork[]> {
  const query = `
    query SearchWorks($season: [String!], $first: Int) {
      searchWorks(seasons: $season, first: $first) {
        nodes {
          annictId
          title
          titleKana
          media
          officialSiteUrl
          twitterHashtag
          programs {
            nodes {
              startedAt
              channel {
                name
              }
            }
          }
          casts {
            nodes {
              character {
                name
              }
              person {
                name
              }
            }
          }
        }
      }
    }
  `;

  const data = await queryAnnict<AnnictSearchResult>(query, { 
    season: [season], 
    first 
  });
  
  return data.searchWorks.nodes;
}

/**
 * タイトルでアニメを検索
 * @param title 検索するタイトル
 * @param first 取得件数（デフォルト: 10）
 */
export async function searchAnnictByTitle(
  title: string,
  first: number = 10
): Promise<AnnictWork[]> {
  const query = `
    query SearchWorks($titles: [String!]!, $first: Int) {
      searchWorks(titles: $titles, first: $first) {
        nodes {
          annictId
          title
          titleKana
          media
          officialSiteUrl
          twitterHashtag
          programs {
            nodes {
              startedAt
              channel {
                name
              }
            }
          }
          casts {
            nodes {
              character {
                name
              }
              person {
                name
              }
            }
          }
        }
      }
    }
  `;

  const data = await queryAnnict<AnnictSearchResult>(query, { 
    titles: [title], 
    first 
  });
  
  return data.searchWorks.nodes;
}

/**
 * Annictのシーズン文字列を生成
 * @param year 年
 * @param season シーズン（spring, summer, fall, winter）
 */
export function formatAnnictSeason(year: number, season: string): string {
  return `${year}-${season.toLowerCase()}`;
}

// ============================================
// AniList連携用
// ============================================

/**
 * タイトルを正規化（マッチング用）
 * - 全角→半角
 * - 大文字→小文字
 * - 記号・空白を除去
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    // 全角英数字→半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => 
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    )
    // 記号・空白を除去
    .replace(/[\s\-\_\・\:\!\?\.\,\、\。\「\」\『\』\【\】\(\)\[\]]/g, '')
    // 全角スペース
    .replace(/　/g, '');
}

/**
 * 2つのタイトルがマッチするか判定
 */
export function titlesMatch(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  // 完全一致
  if (norm1 === norm2) return true;
  
  // 片方が片方を含む（部分一致）
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  return false;
}

/**
 * AniListの検索結果にAnnictの配信情報を付与
 */
export type AniListMediaWithStreaming = AniListMedia & {
  streamingServices?: string[];
  broadcastChannels?: string[];
  synopsisJa?: string | null;  // 日本語あらすじ
  synopsisSource?: string | null;  // あらすじ出典
  broadcastTime?: string | null;  // 放送日時（Annictから取得）
  casts?: { character: string; actor: string }[];  // キャスト情報
};

export function mergeWithAnnictData(
  anilistResults: AniListMedia[],
  annictResults: AnnictWork[]
): AniListMediaWithStreaming[] {
  return anilistResults.map(anilistItem => {
    // タイトルでマッチするAnnictアイテムを探す
    const matchedAnnict = annictResults.find(annictItem => {
      // 日本語タイトル同士で比較
      const anilistTitle = anilistItem.title.native || anilistItem.title.romaji || '';
      return titlesMatch(anilistTitle, annictItem.title);
    });

    if (matchedAnnict) {
      // キャスト情報を整形
      const casts = matchedAnnict.casts?.nodes?.map(cast => ({
        character: cast.character.name,
        actor: cast.person.name,
      })) || [];

      return {
        ...anilistItem,
        streamingServices: extractStreamingServices(matchedAnnict.programs.nodes),
        broadcastChannels: extractBroadcastChannels(matchedAnnict.programs.nodes),
        synopsisJa: null, // Annict APIにはsynopsisフィールドが存在しないため、AniListのdescriptionを使用
        synopsisSource: null,
        broadcastTime: extractBroadcastTime(matchedAnnict.programs.nodes),
        casts: casts.length > 0 ? casts : undefined,
      };
    }

    return anilistItem;
  });
}

