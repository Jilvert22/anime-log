import { useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import type { Anime, AniListSearchResult } from '../types';

interface YearSeasonDataItem {
  year: string;
  seasons: Array<{ season: string; animes: Anime[] }>;
  allAnimes: Anime[];
}

interface UseExpansionControlParams {
  yearSeasonData: YearSeasonDataItem[];
  expandedYears: Set<string>;
  setExpandedYears: (years: Set<string>) => void;
  expandedSeasons: Set<string>;
  setExpandedSeasons: (seasons: Set<string>) => void;
  seasonSearchResults: Map<string, AniListSearchResult[]>;
  loadingSeasons: Set<string>;
  searchSeasonAnimes: (year: string, season: string, forceRefresh?: boolean) => Promise<void>;
  setExpandedSeasonSearches: Dispatch<SetStateAction<Set<string>>>;
}

export function useExpansionControl({
  yearSeasonData,
  expandedYears,
  setExpandedYears,
  expandedSeasons,
  setExpandedSeasons,
  seasonSearchResults,
  loadingSeasons,
  searchSeasonAnimes,
  setExpandedSeasonSearches,
}: UseExpansionControlParams) {
  // 全展開/全折りたたみ
  const expandAll = useCallback(() => {
    const allYears = new Set<string>();
    const allSeasons = new Set<string>();
    yearSeasonData.forEach(y => {
      // 作品がある年のみ展開
      const hasAnimes = y.seasons.some(s => s.animes.length > 0);
      if (hasAnimes) {
        allYears.add(y.year);
        // 作品がある季節のみ展開
        y.seasons.forEach(s => {
          if (s.animes.length > 0) {
            allSeasons.add(`${y.year}-${s.season}`);
          }
        });
      }
    });
    setExpandedYears(allYears);
    setExpandedSeasons(allSeasons);
  }, [yearSeasonData, setExpandedYears, setExpandedSeasons]);

  const collapseAll = useCallback(() => {
    setExpandedYears(new Set());
    setExpandedSeasons(new Set());
  }, [setExpandedYears, setExpandedSeasons]);

  // 作品があるクールのみを対象に展開状態を判定
  const isAllExpanded = useMemo(() => {
    const yearsWithAnimes = yearSeasonData.filter(y => 
      y.seasons.some(s => s.animes.length > 0)
    );
    const seasonsWithAnimes = yearsWithAnimes.flatMap(y => 
      y.seasons.filter(s => s.animes.length > 0).map(s => `${y.year}-${s.season}`)
    );
    
    return yearsWithAnimes.length > 0 &&
           yearsWithAnimes.every(y => expandedYears.has(y.year)) &&
           seasonsWithAnimes.every(key => expandedSeasons.has(key));
  }, [yearSeasonData, expandedYears, expandedSeasons]);

  // 年の展開切り替え
  const toggleYear = useCallback((year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
      // 年を閉じたら、その年の季節も閉じる
      const newSeasons = new Set(expandedSeasons);
      yearSeasonData.find(y => y.year === year)?.seasons.forEach(s => {
        newSeasons.delete(`${year}-${s.season}`);
      });
      setExpandedSeasons(newSeasons);
    } else {
      newExpanded.add(year);
      // 年を開いたら、登録済みの作品がある季節も自動的に開く
      const newSeasons = new Set(expandedSeasons);
      const yearData = yearSeasonData.find(y => y.year === year);
      if (yearData) {
        yearData.seasons.forEach(s => {
          // 登録済みの作品がある季節のみ展開
          if (s.animes.length > 0) {
            newSeasons.add(`${year}-${s.season}`);
          }
        });
        setExpandedSeasons(newSeasons);
      }
    }
    setExpandedYears(newExpanded);
  }, [expandedYears, expandedSeasons, yearSeasonData, setExpandedYears, setExpandedSeasons]);

  // 季節の展開切り替え
  const toggleSeason = useCallback((year: string, season: string) => {
    const key = `${year}-${season}`;
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // 未登録のシーズンの場合、検索を実行
      const yearData = yearSeasonData.find(y => y.year === year);
      const seasonData = yearData?.seasons.find(s => s.season === season);
      if (seasonData && seasonData.animes.length === 0 && !seasonSearchResults.has(key) && !loadingSeasons.has(key)) {
        // 検索を実行し、完了後に自動的に展開
        searchSeasonAnimes(year, season, false).then(() => {
          // 検索完了後、自動的に検索結果も展開
          setExpandedSeasonSearches(prev => new Set(prev).add(key));
        });
      } else if (seasonData && seasonData.animes.length === 0 && seasonSearchResults.has(key)) {
        // 既に検索結果がある場合は、自動的に展開
        setExpandedSeasonSearches(prev => new Set(prev).add(key));
      }
    }
    setExpandedSeasons(newExpanded);
  }, [expandedSeasons, setExpandedSeasons, yearSeasonData, seasonSearchResults, loadingSeasons, searchSeasonAnimes, setExpandedSeasonSearches]);

  return {
    expandAll,
    collapseAll,
    isAllExpanded,
    toggleYear,
    toggleSeason,
  };
}

