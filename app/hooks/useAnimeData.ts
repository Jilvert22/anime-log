'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Season, Anime } from '../types';
import { supabaseToAnime, sortSeasonsByTime } from '../utils/helpers';

export function useAnimeData(user: User | null, isLoading: boolean) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const prevSeasonsRef = useRef<string>('');

  // 最初のシーズンを展開状態にする
  const expandFirstSeason = useCallback((seasonList: Season[]) => {
    if (seasonList.length > 0) {
      setExpandedSeasons(new Set([seasonList[0].name]));
    }
  }, []);

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
  const loadFromSupabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('animes')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (error) throw error;

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

        const loadedSeasons: Season[] = Array.from(seasonMap.entries()).map(
          ([name, animes]) => ({ name, animes })
        );

        // 時系列順にソート
        const sortedSeasons = sortSeasonsByTime(loadedSeasons);
        setSeasons(sortedSeasons);
        expandFirstSeason(sortedSeasons);
      } else {
        setSeasons([]);
      }
    } catch (error) {
      console.error('Failed to load animes from Supabase:', error);
      setSeasons([]);
    }
  }, [expandFirstSeason]);

  // localStorageからアニメデータを読み込む
  const loadFromLocalStorage = useCallback(() => {
    const savedSeasons = localStorage.getItem('animeSeasons');
    if (!savedSeasons) {
      setSeasons([]);
      return;
    }

    try {
      const parsedSeasons: Season[] = JSON.parse(savedSeasons);
      
      // サンプルデータを検出（IDが1-4のアニメが含まれている場合）
      const hasSampleData = parsedSeasons.some((season) =>
        season.animes.some((anime) => anime.id >= 1 && anime.id <= 4)
      );

      if (hasSampleData) {
        localStorage.removeItem('animeSeasons');
        setSeasons([]);
      } else {
        setSeasons(parsedSeasons);
        expandFirstSeason(parsedSeasons);
      }
    } catch {
      setSeasons([]);
    }
  }, [expandFirstSeason]);

  // データ読み込み
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      loadFromSupabase(user.id);
    } else {
      // ログアウト時は即座にデータをクリア
      setSeasons([]);
      loadFromLocalStorage();
    }
  }, [user, isLoading, loadFromSupabase, loadFromLocalStorage]);

  // すべてのアニメを取得
  const allAnimes = useMemo(
    () => seasons.flatMap((season) => season.animes),
    [seasons]
  );

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
  };
}
