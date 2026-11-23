// app/lib/api/annict.ts
/**
 * Annict API関連
 * 作品検索と放送・配信情報の変換（API Route経由）
 */

import { NetworkError, logError, normalizeError } from './errors';
import type { AniListMedia } from './anilist';

// ============================================
// 型定義
// ============================================

export type AnnictProgram = {
  startedAt: string;
  channel: { name: string };
};

export type AnnictWork = {
  title: string;
  programs: { nodes: AnnictProgram[] };
};

export type AnnictSearchRequest = {
  kind: 'title' | 'season';
  term: string;
  first: number;
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
  return STREAMING_SERVICES.some(
    (service) => channelName.includes(service) || service.includes(channelName)
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

const RATE_LIMIT_MESSAGE = 'Annict の検索が混み合っています。しばらくしてからお試しください';
let retryAfterUntil = 0;

async function searchAnnict(search: AnnictSearchRequest): Promise<AnnictWork[]> {
  if (Date.now() < retryAfterUntil) throw new NetworkError(RATE_LIMIT_MESSAGE);

  try {
    const response = await fetch('/api/annict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(search),
    });

    if (response.status === 429) {
      const seconds = Number(response.headers.get('Retry-After'));
      if (Number.isSafeInteger(seconds) && seconds > 0) {
        retryAfterUntil = Math.max(retryAfterUntil, Date.now() + seconds * 1000);
      }
      throw new NetworkError(RATE_LIMIT_MESSAGE);
    }
    if (!response.ok) {
      throw new NetworkError('Annict の作品検索に失敗しました');
    }

    const { works } = await response.json();
    if (!Array.isArray(works)) {
      throw new NetworkError('Annict の検索結果を取得できませんでした');
    }
    return works;
  } catch (error) {
    logError(error, 'searchAnnict');
    throw normalizeError(error);
  }
}

export function searchAnnictBySeason(season: string, first = 50): Promise<AnnictWork[]> {
  return searchAnnict({ kind: 'season', term: season, first });
}

export function searchAnnictByTitle(title: string, first = 10): Promise<AnnictWork[]> {
  return searchAnnict({ kind: 'title', term: title, first });
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
 * - 全角→半角変換
 * - 記号の統一・除去
 * - シーズン表記の統一
 * - ローマ数字→アラビア数字
 * - 大文字→小文字
 * - スペースの統一
 */
export function normalizeTitle(title: string): string {
  return (
    title
      // 全角→半角変換
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      // 記号の統一
      .replace(/[！!]/g, '')
      .replace(/[？?]/g, '')
      .replace(/[〜～~]/g, '')
      .replace(/[：:]/g, '')
      .replace(/[・·]/g, '')
      .replace(/[「」『』【】\[\]()（）]/g, '')
      .replace(/["'""'']/g, '')
      // スペースの統一
      .replace(/[\s　]+/g, ' ')
      // シーズン表記の統一
      .replace(/第?(\d+)期/g, ' $1 ')
      .replace(/(\d+)(nd|rd|th)?\s*season/gi, ' $1 ')
      .replace(/season\s*(\d+)/gi, ' $1 ')
      .replace(/part\s*(\d+)/gi, ' $1 ')
      .replace(/パート\s*(\d+)/gi, ' $1 ')
      // ローマ数字→アラビア数字
      .replace(/\bII\b/gi, '2')
      .replace(/\bIII\b/gi, '3')
      .replace(/\bIV\b/gi, '4')
      .replace(/\bV\b/gi, '5')
      // 小文字化
      .toLowerCase()
      // 前後の空白削除
      .trim()
  );
}

/**
 * 2つのタイトルがマッチするか判定
 * - 完全一致
 * - 部分一致（片方がもう片方を含む）
 * - 単語ベースの一致度判定（60%以上の単語が一致）
 */
export function titlesMatch(anilistTitle: string, annictTitle: string): boolean {
  const normalizedAnilist = normalizeTitle(anilistTitle);
  const normalizedAnnict = normalizeTitle(annictTitle);

  // 完全一致
  if (normalizedAnilist === normalizedAnnict) return true;

  // 片方がもう片方を含む（部分一致）
  if (
    normalizedAnilist.includes(normalizedAnnict) ||
    normalizedAnnict.includes(normalizedAnilist)
  ) {
    return true;
  }

  // 単語分割して一致度を計算
  const anilistWords = normalizedAnilist.split(/\s+/).filter((w) => w.length > 1);
  const annictWords = normalizedAnnict.split(/\s+/).filter((w) => w.length > 1);

  if (anilistWords.length === 0 || annictWords.length === 0) return false;

  // 共通単語数をカウント
  const commonWords = anilistWords.filter((word) => annictWords.includes(word));
  const matchRatio = commonWords.length / Math.min(anilistWords.length, annictWords.length);

  // 60%以上の単語が一致すればマッチとみなす
  return matchRatio >= 0.6;
}

/**
 * AniListの検索結果にAnnictの配信情報を付与
 */
export type AniListMediaWithStreaming = AniListMedia & {
  streamingServices?: string[];
  broadcastChannels?: string[];
  synopsisJa?: string | null; // 日本語あらすじ
  synopsisSource?: string | null; // あらすじ出典
  broadcastTime?: string | null; // 放送日時（Annictから取得）
  // 連続2クール: 検索対象シーズンに継続中の作品 (前シーズン開始)
  isContinuing?: boolean;
};

/**
 * AniListの検索結果にAnnictの配信情報を付与（IDマッピング優先）
 * @param anilistResults AniListの検索結果
 * @param annictResults Annictの検索結果（フォールバック用）
 * @returns 配信情報が付与されたAniListMedia配列
 */
export async function mergeWithAnnictData(
  anilistResults: AniListMedia[],
  annictResults: AnnictWork[]
): Promise<AniListMediaWithStreaming[]> {
  // 最終結果を構築 (AniList ID → Annict ID マッピングは searchAnnictById が
  // 常に null を返す仕様のため廃止し、タイトルマッチング一本に統合)
  const results: AniListMediaWithStreaming[] = [];

  for (const anilist of anilistResults) {
    // タイトルマッチングで Annict 作品を特定
    const titlesToMatch = [
      anilist.title?.native,
      anilist.title?.romaji,
      anilist.title?.english,
      ...(anilist.synonyms || []),
    ].filter(Boolean) as string[];

    const matchedAnnict =
      annictResults.find((annict) =>
        titlesToMatch.some((title) => titlesMatch(title, annict.title))
      ) || null;

    if (matchedAnnict && process.env.NODE_ENV === 'development') {
      console.log('[Annict Title Match]', {
        anilistId: anilist.id,
        anilistTitle: anilist.title?.native,
        matched: matchedAnnict.title,
        titlesChecked: titlesToMatch,
      });
    }

    // 3. マッチしたAnnictデータを統合
    if (matchedAnnict) {
      results.push({
        ...anilist,
        streamingServices: extractStreamingServices(matchedAnnict.programs.nodes),
        broadcastChannels: extractBroadcastChannels(matchedAnnict.programs.nodes),
        synopsisJa: undefined,
        synopsisSource: undefined,
        broadcastTime: extractBroadcastTime(matchedAnnict.programs.nodes),
      });
    } else {
      results.push({ ...anilist });
    }
  }

  return results;
}
