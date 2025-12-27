'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Season, Anime } from '../types';
import { supabaseToAnime } from '../utils/helpers';

export function useAnimeData(user: User | null, isLoading: boolean) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const prevSeasonsRef = useRef<string>('');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  // アニメデータをlocalStorageに保存（未ログイン時のみ）
  useEffect(() => {
    if (typeof window !== 'undefined' && !user && seasons.length > 0) {
      const seasonsString = JSON.stringify(seasons);
      // 前回の値と比較して、変更があった場合のみ保存
      if (prevSeasonsRef.current !== seasonsString) {
        localStorage.setItem('animeSeasons', seasonsString);
        prevSeasonsRef.current = seasonsString;
      }
    }
  }, [seasons, user]);

  // ログイン時にSupabaseからアニメデータを読み込む、未ログイン時はlocalStorageから読み込む
  useEffect(() => {
    const loadAnimes = async () => {
      if (isLoading) return;

      if (user) {
        // ログイン時：Supabaseから読み込む
        try {
          const { data, error } = await supabase
            .from('animes')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

          if (error) throw error;

          if (data && data.length > 0) {
            // シーズンごとにグループ化
            const seasonMap = new Map<string, Anime[]>();
            data.forEach((row) => {
              const anime = supabaseToAnime(row);
              const seasonName = row.season_name || '未分類';
              if (!seasonMap.has(seasonName)) {
                seasonMap.set(seasonName, []);
              }
              seasonMap.get(seasonName)!.push(anime);
            });

            // Season型に変換
            const loadedSeasons: Season[] = Array.from(seasonMap.entries()).map(([name, animes]) => ({
              name,
              animes,
            }));

            if (loadedSeasons.length > 0) {
              setSeasons(loadedSeasons);
              setExpandedSeasons(new Set([loadedSeasons[0].name]));
            } else {
              setSeasons([]);
            }
          } else {
            setSeasons([]);
          }
        } catch (error) {
          console.error('Failed to load animes from Supabase:', error);
        }
      } else {
        // 未ログイン時：localStorageから読み込む
        if (typeof window !== 'undefined') {
          const savedSeasons = localStorage.getItem('animeSeasons');
          if (savedSeasons) {
            try {
              const parsedSeasons = JSON.parse(savedSeasons);
              // サンプルデータを検出（IDが1-4のアニメが含まれている場合）
              const hasSampleData = parsedSeasons.some((season: Season) =>
                season.animes.some((anime: Anime) => anime.id >= 1 && anime.id <= 4)
              );
              
              if (hasSampleData) {
                // サンプルデータが含まれている場合はlocalStorageをクリア
                localStorage.removeItem('animeSeasons');
                setSeasons([]);
              } else {
                setSeasons(parsedSeasons);
                if (parsedSeasons.length > 0) {
                  setExpandedSeasons(new Set([parsedSeasons[0].name]));
                }
              }
            } catch (e) {
              // パースエラーの場合は空の配列を使用
              setSeasons([]);
            }
          } else {
            // 保存データがない場合は空の配列を使用
            setSeasons([]);
          }
        }
      }
    };

    loadAnimes();
  }, [user, isLoading]);

  // すべてのアニメを取得（メモ化）
  const allAnimes = useMemo(
    () => seasons.flatMap(season => season.animes),
    [seasons]
  );

  // 平均評価を計算（メモ化）
  const averageRating = useMemo(() => {
    if (allAnimes.length === 0 || !allAnimes.some(a => a.rating > 0)) {
      return 0;
    }
    const ratedAnimes = allAnimes.filter(a => a.rating > 0);
    return ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length;
  }, [allAnimes]);

  // 累計周回数を計算（メモ化）
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

