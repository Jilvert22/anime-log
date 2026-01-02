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

      const mergedResults = mergeWithAnnictData(anilistResults.media, annictResults);
      
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
    setIsLoading(true);
    setError(null);

    try {
      const [anilistResults, annictResults] = await Promise.all([
        searchAnime(title),
        searchAnnictByTitle(title, 20).catch(err => {
          console.warn('Annict title search failed:', err);
          return [];
        }),
      ]);

      const mergedResults = mergeWithAnnictData(anilistResults, annictResults);
      
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

