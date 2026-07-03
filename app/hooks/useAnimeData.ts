'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getAnimesByUser } from '../lib/api/animes';
import type { User } from '@supabase/supabase-js';
import type { Season, Anime } from '../types';
import { supabaseToAnime, sortSeasonsByTime } from '../utils/helpers';
import { logger } from '../lib/logger';
import { normalizeError } from '../lib/api/errors';

export function useAnimeData(user: User | null, isLoading: boolean) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [isAnimeDataReady, setIsAnimeDataReady] = useState(false);
  const prevSeasonsRef = useRef<string>('');
  const loadCycleRef = useRef(0);

  // 最初のシーズンを展開状態にする
  // useCallbackは不要（この関数はuseEffect内でのみ使用され、依存配列に含めない）
  const expandFirstSeason = (seasonList: Season[]) => {
    if (seasonList.length > 0) {
      setExpandedSeasons(new Set([seasonList[0].name]));
    }
  };

  // アニメデータをlocalStorageに保存（未ログイン時のみ）
  useEffect(() => {
    if (!user && seasons.length > 0) {
      const seasonsString = JSON.stringify(seasons);
      if (prevSeasonsRef.current !== seasonsString) {
        localStorage.setItem('animeSeasons', seasonsString);
        prevSeasonsRef.current = seasonsString;
      }
    }
  }, [seasons, user]);

  // Supabaseからアニメデータを読み込む
  // useCallbackは不要（この関数はuseEffect内でのみ使用される）
  const loadFromSupabase = async (userId: string, loadCycle: number) => {
    try {
      const data = await getAnimesByUser(userId);

      if (loadCycleRef.current !== loadCycle) return;

      if (data && data.length > 0) {
        const seasonMap = new Map<string, Anime[]>();
        data.forEach((row) => {
          const anime = supabaseToAnime(row);
          const seasonName = row.season_name || '未分類';
          if (!seasonMap.has(seasonName)) {
            seasonMap.set(seasonName, []);
          }
          seasonMap.get(seasonName)!.push(anime);
        });

        const loadedSeasons: Season[] = Array.from(seasonMap.entries()).map(([name, animes]) => ({
          name,
          animes,
        }));

        // 時系列順にソート
        const sortedSeasons = sortSeasonsByTime(loadedSeasons);
        setSeasons(sortedSeasons);
        expandFirstSeason(sortedSeasons);
      } else {
        setSeasons([]);
      }
    } catch (error) {
      if (loadCycleRef.current !== loadCycle) return;
      const normalizedError = normalizeError(error);
      logger.error('Failed to load animes from Supabase', normalizedError, 'useAnimeData');
      setSeasons([]);
    } finally {
      if (loadCycleRef.current === loadCycle) {
        setIsAnimeDataReady(true);
      }
    }
  };

  // localStorageからアニメデータを読み込む
  // useCallbackは不要（この関数はuseEffect内でのみ使用される）
  const loadFromLocalStorage = (loadCycle: number) => {
    try {
      const savedSeasons = localStorage.getItem('animeSeasons');
      if (!savedSeasons) {
        if (loadCycleRef.current === loadCycle) {
          setSeasons([]);
        }
        return;
      }

      const parsedSeasons: Season[] = JSON.parse(savedSeasons);

      // サンプルデータを検出（IDが1-4のアニメが含まれている場合）
      const hasSampleData = parsedSeasons.some((season) =>
        season.animes.some((anime) => anime.id >= 1 && anime.id <= 4)
      );

      if (hasSampleData) {
        localStorage.removeItem('animeSeasons');
        if (loadCycleRef.current === loadCycle) {
          setSeasons([]);
        }
      } else {
        if (loadCycleRef.current === loadCycle) {
          setSeasons(parsedSeasons);
          expandFirstSeason(parsedSeasons);
        }
      }
    } catch {
      if (loadCycleRef.current === loadCycle) {
        setSeasons([]);
      }
    } finally {
      if (loadCycleRef.current === loadCycle) {
        setIsAnimeDataReady(true);
      }
    }
  };

  // データ読み込み
  useEffect(() => {
    const loadCycle = loadCycleRef.current + 1;
    loadCycleRef.current = loadCycle;
    setIsAnimeDataReady(false);

    if (isLoading) return;

    if (user) {
      void loadFromSupabase(user.id, loadCycle);
    } else {
      // ログアウト時は即座にデータをクリア
      setSeasons([]);
      loadFromLocalStorage(loadCycle);
    }
    // loadFromSupabaseとloadFromLocalStorageは関数内で定義されているため依存配列に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  // すべてのアニメを取得
  const allAnimes = useMemo(() => seasons.flatMap((season) => season.animes), [seasons]);

  // 平均評価を計算
  const averageRating = useMemo(() => {
    const ratedAnimes = allAnimes.filter((a) => a.rating > 0);
    if (ratedAnimes.length === 0) return 0;
    return ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length;
  }, [allAnimes]);

  // 累計周回数を計算
  const totalRewatchCount = useMemo(
    () => allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0),
    [allAnimes]
  );

  return {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
    isAnimeDataReady,
  };
}
