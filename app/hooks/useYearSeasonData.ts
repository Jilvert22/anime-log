import { useState, useMemo, useCallback, Dispatch, SetStateAction } from 'react';
import type { Anime, Season } from '../types';

export type FilterType = 'all' | 'unrated' | 'unwatched';

interface UseYearSeasonDataParams {
  seasons: Season[];
  allAnimes: Anime[];
}

export function useYearSeasonData({ seasons, allAnimes }: UseYearSeasonDataParams) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAllSeasons, setShowAllSeasons] = useState(false); // すべての年・季節を表示するか
  const [showUnregisteredOnly, setShowUnregisteredOnly] = useState(false); // 未登録シーズンのみ表示
  const seasonOrder = ['冬', '春', '夏', '秋'];

  // フィルター適用
  const filterAnime = useCallback((anime: Anime): boolean => {
    switch (filter) {
      case 'unrated':
        return !anime.rating || anime.rating === 0;
      case 'unwatched':
        return !anime.rewatchCount || anime.rewatchCount === 0;
      default:
        return true;
    }
  }, [filter]);

  // 年→季節→アニメの階層データを生成（フィルター適用済み）
  const yearSeasonData = useMemo(() => {
    const data = new Map<string, Map<string, Anime[]>>();
    
    seasons.forEach(season => {
      season.animes.forEach(anime => {
        // フィルター適用
        if (!filterAnime(anime)) return;
        
        // season.name から年と季節を抽出（例: "2024年春" → year: "2024", seasonName: "春"）
        const match = season.name.match(/(\d{4})年(冬|春|夏|秋)/);
        if (match) {
          const year = match[1];
          const seasonName = match[2];
          
          if (!data.has(year)) {
            data.set(year, new Map());
          }
          if (!data.get(year)!.has(seasonName)) {
            data.get(year)!.set(seasonName, []);
          }
          data.get(year)!.get(seasonName)!.push(anime);
        }
      });
    });
    
    // すべて表示モードの場合、1970年から現在年+1年までのすべての年・季節を含める
    const currentYear = new Date().getFullYear();
    const startYear = 1970; // アニメのクールは1970年代から始まる
    const endYear = currentYear + 1; // 来年まで表示（来クールの準備）
    
    if (showAllSeasons) {
      for (let year = endYear; year >= startYear; year--) {
        const yearStr = year.toString();
        if (!data.has(yearStr)) {
          data.set(yearStr, new Map());
        }
        // すべての季節を追加（登録がない場合でも）
        seasonOrder.forEach(seasonName => {
          if (!data.get(yearStr)!.has(seasonName)) {
            data.get(yearStr)!.set(seasonName, []);
          }
        });
      }
    }
    
    // 年を降順でソート
    const sortedYears = Array.from(data.keys())
      .filter(year => {
        if (showAllSeasons) {
          const yearNum = Number(year);
          return yearNum >= startYear && yearNum <= endYear;
        }
        return true;
      })
      .sort((a, b) => Number(b) - Number(a));
    
    return sortedYears
      .map(year => ({
        year,
        seasons: seasonOrder
          .filter(s => {
            if (showAllSeasons) {
              // すべて表示モード: すべての季節を表示
              if (showUnregisteredOnly) {
                // 未登録シーズンのみ表示
                return !data.get(year)!.has(s) || data.get(year)!.get(s)!.length === 0;
              }
              return true;
            } else {
              // 登録済みのみ表示モード: 作品がある季節のみ表示
              return data.get(year)!.has(s) && data.get(year)!.get(s)!.length > 0;
            }
          })
          .map(s => ({
            season: s,
            animes: data.get(year)!.get(s) || [],
          })),
        allAnimes: Array.from(data.get(year)!.values()).flat(),
      }))
      .filter(y => {
        if (showAllSeasons) {
          // すべて表示モード: すべての年を表示
          if (showUnregisteredOnly) {
            // 未登録シーズンがある年のみ表示
            return y.seasons.length > 0;
          }
          return true;
        } else {
          // 登録済みのみ表示モード: 作品がある年のみ表示
          return y.allAnimes.length > 0;
        }
      });
  }, [seasons, filterAnime, seasonOrder, showAllSeasons, showUnregisteredOnly]);

  // フィルター後の統計
  const filteredStats = useMemo(() => {
    const filteredAnimes = allAnimes.filter(filterAnime);
    return {
      count: filteredAnimes.length,
      totalCount: allAnimes.length,
    };
  }, [allAnimes, filterAnime]);

  return {
    filter,
    setFilter: setFilter as Dispatch<SetStateAction<FilterType>>,
    showAllSeasons,
    setShowAllSeasons,
    showUnregisteredOnly,
    setShowUnregisteredOnly,
    yearSeasonData,
    filteredStats,
    filterAnime,
  };
}

