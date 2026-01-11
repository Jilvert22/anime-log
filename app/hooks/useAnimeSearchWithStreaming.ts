// app/hooks/useAnimeSearchWithStreaming.ts
'use client';

import { useState, useCallback } from 'react';
import { searchAnimeBySeason, searchAnime, type AniListMedia } from '../lib/api/anilist';
import { 
  searchAnnictBySeason,
  searchAnnictByTitle,
  formatAnnictSeason,
  mergeWithAnnictData,
  type AniListMediaWithStreaming 
} from '../lib/api/annict';

type SeasonType = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

/**
 * AniListのシーズン形式をAnnictの形式に変換
 */
function convertToAnnictSeason(season: SeasonType): string {
  const map: Record<SeasonType, string> = {
    WINTER: 'winter',
    SPRING: 'spring',
    SUMMER: 'summer',
    FALL: 'fall',
  };
  return map[season];
}

/**
 * キャッシュエントリー型
 */
type CacheEntry = {
  data: AniListMediaWithStreaming[];
  timestamp: number;
};

/**
 * 検索結果のキャッシュ（モジュールレベル）
 * キー: 検索クエリ文字列
 * 値: キャッシュエントリー（データとタイムスタンプ）
 */
const searchCache = new Map<string, CacheEntry>();

/**
 * キャッシュの有効期限（ミリ秒）
 * 10分間キャッシュを保持
 */
const CACHE_TTL = 10 * 60 * 1000; // 10分

/**
 * キャッシュから取得
 */
function getFromCache(key: string): AniListMediaWithStreaming[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    // 有効期限切れの場合は削除
    searchCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * キャッシュに保存
 */
function setCache(key: string, data: AniListMediaWithStreaming[]): void {
  searchCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function useAnimeSearchWithStreaming() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * シーズン別検索（AniList + Annict並列）
   */
  const searchBySeason = useCallback(async (
    season: SeasonType,
    year: number,
    page: number = 1,
    perPage: number = 50
  ): Promise<AniListMediaWithStreaming[]> => {
    // キャッシュキーを生成
    const cacheKey = `season:${year}:${season}:${page}:${perPage}`;
    
    // キャッシュから取得を試みる
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const annictSeason = formatAnnictSeason(year, convertToAnnictSeason(season));
      
      const [anilistResults, annictResults] = await Promise.all([
        searchAnimeBySeason(season, year, page, perPage),
        searchAnnictBySeason(annictSeason, 100).catch(err => {
          console.warn('Annict search failed, continuing without streaming info:', err);
          return [];
        }),
      ]);

      const mergedResults = await mergeWithAnnictData(anilistResults.media, annictResults);
      
      // キャッシュに保存
      setCache(cacheKey, mergedResults);
      
      return mergedResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : '検索に失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * タイトル検索（AniList + Annict並列）
   */
  const searchByTitle = useCallback(async (
    title: string
  ): Promise<AniListMediaWithStreaming[]> => {
    // 検索クエリを正規化（前後の空白を削除）
    const normalizedTitle = title.trim();
    
    // キャッシュキーを生成
    const cacheKey = `title:${normalizedTitle}`;
    
    // キャッシュから取得を試みる
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [anilistResults, annictResults] = await Promise.all([
        searchAnime(normalizedTitle),
        searchAnnictByTitle(normalizedTitle, 20).catch(err => {
          console.warn('Annict title search failed:', err);
          return [];
        }),
      ]);

      const mergedResults = await mergeWithAnnictData(anilistResults, annictResults);
      
      // キャッシュに保存
      setCache(cacheKey, mergedResults);
      
      return mergedResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : '検索に失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchBySeason,
    searchByTitle,
    isLoading,
    error,
  };
}

