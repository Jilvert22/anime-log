/**
 * シーズンの覇権アニメを取得・管理するカスタムフック
 */

import { useState, useCallback, useRef } from 'react';
import { getDominantAnimes, type DominantAnime } from '../utils/seasonRepresentativeAnimes';

type DominantAnimesMap = Map<string, DominantAnime[]>;

export function useRepresentativeAnimes() {
  const [dominantAnimes, setDominantAnimes] = useState<DominantAnimesMap>(new Map());
  const [loadingSeasons, setLoadingSeasons] = useState<Set<string>>(new Set());
  const dominantAnimesRef = useRef<DominantAnimesMap>(new Map());
  const loadingSeasonsRef = useRef<Set<string>>(new Set());

  // refを同期
  dominantAnimesRef.current = dominantAnimes;
  loadingSeasonsRef.current = loadingSeasons;

  /**
   * 指定されたシーズンの覇権アニメを取得する
   * @param seasonName シーズン名（例: "2024年春"）
   * @param limit 取得する件数（デフォルト: 3）
   */
  const fetchRepresentativeAnimes = useCallback(
    async (seasonName: string, limit: number = 3) => {
      // 既に取得済みの場合はスキップ
      if (dominantAnimesRef.current.has(seasonName)) {
        return;
      }

      // 既に読み込み中の場合はスキップ
      if (loadingSeasonsRef.current.has(seasonName)) {
        return;
      }

      setLoadingSeasons((prev) => new Set(prev).add(seasonName));

      try {
        const animes = await getDominantAnimes(seasonName, limit);
        setDominantAnimes((prev) => {
          // 既に取得済みの場合はスキップ（二重取得を防ぐ）
          if (prev.has(seasonName)) {
            return prev;
          }
          const newMap = new Map(prev);
          newMap.set(seasonName, animes);
          return newMap;
        });
      } catch (error) {
        console.error('覇権アニメの取得に失敗しました:', error);
        // エラーが発生した場合も空配列を設定して、再試行を防ぐ
        setDominantAnimes((prev) => {
          const newMap = new Map(prev);
          newMap.set(seasonName, []);
          return newMap;
        });
      } finally {
        setLoadingSeasons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(seasonName);
          return newSet;
        });
      }
    },
    []
  );

  /**
   * 指定されたシーズンの覇権アニメを取得（既に取得済みの場合は何もしない）
   * @param seasonName シーズン名
   */
  const getRepresentativeAnimesForSeason = useCallback(
    (seasonName: string): DominantAnime[] => {
      return dominantAnimes.get(seasonName) || [];
    },
    [dominantAnimes]
  );

  /**
   * 指定されたシーズンの覇権アニメが読み込み中かどうかを判定
   * @param seasonName シーズン名
   */
  const isLoading = useCallback(
    (seasonName: string): boolean => {
      return loadingSeasons.has(seasonName);
    },
    [loadingSeasons]
  );

  return {
    representativeAnimes: dominantAnimes,
    fetchRepresentativeAnimes,
    getRepresentativeAnimesForSeason,
    isLoading,
  };
}

