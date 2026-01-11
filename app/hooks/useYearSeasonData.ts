import { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
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
  const [unregisteredSeasonSnapshot, setUnregisteredSeasonSnapshot] = useState<Set<string> | null>(null); // 未登録シーズンのスナップショット
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

  // 未登録シーズンのスナップショットを記録
  useEffect(() => {
    if (showAllSeasons && showUnregisteredOnly) {
      // showUnregisteredOnlyがtrueになった時点で、現在の未登録シーズンリストを記録
      setUnregisteredSeasonSnapshot(prev => {
        if (prev !== null) {
          // 既に記録されている場合は更新しない
          return prev;
        }
        
        // 現在の未登録シーズンを収集
        const snapshot = new Set<string>();
        
        // 1970年から現在年+1年までのすべての年・季節をチェック
        const currentYear = new Date().getFullYear();
        const startYear = 1970;
        const endYear = currentYear + 1;
        
        // 登録済みシーズンをMapに整理（フィルター適用済みのアニメのみ）
        const registeredSeasons = new Map<string, Set<string>>();
        for (let i = 0; i < seasons.length; i++) {
          const season = seasons[i];
          const match = season.name.match(/(\d{4})年(冬|春|夏|秋)/);
          if (match) {
            const year = match[1];
            const seasonName = match[2];
            const filteredAnimes = season.animes.filter(filterAnime);
            if (filteredAnimes.length > 0) {
              if (!registeredSeasons.has(year)) {
                registeredSeasons.set(year, new Set());
              }
              registeredSeasons.get(year)!.add(seasonName);
            }
          }
        }
        
        // 未登録シーズンを記録
        for (let year = endYear; year >= startYear; year--) {
          const yearStr = year.toString();
          for (const seasonName of seasonOrder) {
            const registeredSeasonsForYear = registeredSeasons.get(yearStr);
            if (!registeredSeasonsForYear || !registeredSeasonsForYear.has(seasonName)) {
              snapshot.add(`${yearStr}年${seasonName}`);
            }
          }
        }
        
        return snapshot;
      });
    } else {
      // showAllSeasonsまたはshowUnregisteredOnlyがfalseになった時に記録をクリア
      setUnregisteredSeasonSnapshot(prev => prev !== null ? null : prev);
    }
  }, [showAllSeasons, showUnregisteredOnly, seasons, filterAnime, seasonOrder]);

  // 年→季節→アニメの階層データを生成（フィルター適用済み）
  // メインスレッドのブロッキングを避けるため、処理を最適化
  const yearSeasonData = useMemo(() => {
    const data = new Map<string, Map<string, Anime[]>>();
    
    // forEachの代わりにforループを使用（パフォーマンス向上）
    for (let i = 0; i < seasons.length; i++) {
      const season = seasons[i];
      for (let j = 0; j < season.animes.length; j++) {
        const anime = season.animes[j];
        // フィルター適用
        if (!filterAnime(anime)) continue;
        
        // season.name から年と季節を抽出（例: "2024年春" → year: "2024", seasonName: "春"）
        const match = season.name.match(/(\d{4})年(冬|春|夏|秋)/);
        if (match) {
          const year = match[1];
          const seasonName = match[2];
          
          if (!data.has(year)) {
            data.set(year, new Map());
          }
          const yearData = data.get(year)!;
          if (!yearData.has(seasonName)) {
            yearData.set(seasonName, []);
          }
          yearData.get(seasonName)!.push(anime);
        }
      }
    }
    
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
    
    // 年を降順でソート（メインスレッドのブロッキングを削減）
    const years = Array.from(data.keys());
    const filteredYears = years.filter(year => {
      if (showAllSeasons) {
        const yearNum = Number(year);
        return yearNum >= startYear && yearNum <= endYear;
      }
      return true;
    });
    
    // 数値ソートを最適化
    filteredYears.sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      return bNum - aNum;
    });
    
    const result = filteredYears.map(year => {
      const yearData = data.get(year)!;
      
      // 季節のフィルタリングを最適化
      const filteredSeasons = seasonOrder.filter(s => {
        if (showAllSeasons) {
          // すべて表示モード: すべての季節を表示
          if (showUnregisteredOnly) {
            // 未登録シーズンのみ表示
            // スナップショットが記録されている場合は、記録されたシーズンリストを基準にする
            if (unregisteredSeasonSnapshot !== null) {
              const seasonKey = `${year}年${s}`;
              return unregisteredSeasonSnapshot.has(seasonKey);
            }
            // スナップショットがない場合は従来の動作（未登録シーズンのみ表示）
            return !yearData.has(s) || yearData.get(s)!.length === 0;
          }
          return true;
        } else {
          // 登録済みのみ表示モード: 作品がある季節のみ表示
          return yearData.has(s) && yearData.get(s)!.length > 0;
        }
      });
      
      const seasons = filteredSeasons.map(s => ({
        season: s,
        animes: yearData.get(s) || [],
      }));
      
      // allAnimesの生成を最適化（flat()の代わりに手動で結合）
      const allAnimes: Anime[] = [];
      for (const seasonAnimes of yearData.values()) {
        allAnimes.push(...seasonAnimes);
      }
      
      return {
        year,
        seasons,
        allAnimes,
      };
    });
    
    // 最終フィルタリング
    return result.filter(y => {
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
  }, [seasons, filterAnime, seasonOrder, showAllSeasons, showUnregisteredOnly, unregisteredSeasonSnapshot]);

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

