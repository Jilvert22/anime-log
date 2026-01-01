'use client';

import { useState, useMemo } from 'react';
import type { Anime, Season, AniListSearchResult } from '../../types';
import { AnimeCard } from '../AnimeCard';

// タイトルから期数を取得する関数
function getSeasonNumber(title: string): number | null {
  const patterns = [
    /第(\d+)期/,
    /第(\d+)シーズン/i,
    /(\d+)期/,
    /Season\s*(\d+)/i,
    /S(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return null;
}

interface SeriesViewProps {
  seasons: Season[];
  setSelectedAnime: (anime: Anime | null) => void;
  onOpenAddForm: () => void;
}

export function SeriesView({ 
  seasons, 
  setSelectedAnime,
  onOpenAddForm
}: SeriesViewProps) {
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [expandedStandalone, setExpandedStandalone] = useState(false);
  const [suggestedSeasons, setSuggestedSeasons] = useState<Map<string, any[]>>(new Map());
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => {
    // localStorageから非表示にした提案を読み込む
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dismissedAnimeSuggestions');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    }
    return new Set<string>();
  });

  // シリーズごとのグループ化とソートをメモ化
  const { seriesArray, standaloneAnimes } = useMemo(() => {
    // すべてのアニメを取得
    const allAnimes = seasons.flatMap(s => s.animes);
    
    // シリーズごとにグループ化
    const seriesMap = new Map<string, Anime[]>();
    const standalone: Anime[] = [];
    
    allAnimes.forEach(anime => {
      if (anime.seriesName) {
        if (!seriesMap.has(anime.seriesName)) {
          seriesMap.set(anime.seriesName, []);
        }
        seriesMap.get(anime.seriesName)!.push(anime);
      } else {
        standalone.push(anime);
      }
    });
    
    // 1作品のみのシリーズは単発作品に移動
    const filteredSeriesMap = new Map<string, Anime[]>();
    seriesMap.forEach((animes, seriesName) => {
      if (animes.length > 1) {
        filteredSeriesMap.set(seriesName, animes);
      } else {
        standalone.push(...animes);
      }
    });
    
    // シリーズ内を時系列順にソート（期数とシーズン名から判断）
    filteredSeriesMap.forEach((animes) => {
      animes.sort((a, b) => {
        // 期数でソート
        const aSeasonNum = getSeasonNumber(a.title);
        const bSeasonNum = getSeasonNumber(b.title);
        
        if (aSeasonNum !== null && bSeasonNum !== null) {
          return aSeasonNum - bSeasonNum;
        }
        if (aSeasonNum !== null) return -1;
        if (bSeasonNum !== null) return 1;
        
        // 期数がない場合はシーズン名でソート
        const aSeason = seasons.find(s => s.animes.includes(a));
        const bSeason = seasons.find(s => s.animes.includes(b));
        if (aSeason && bSeason) {
          const seasonIndexA = seasons.indexOf(aSeason);
          const seasonIndexB = seasons.indexOf(bSeason);
          if (seasonIndexA !== seasonIndexB) {
            return seasonIndexA - seasonIndexB;
          }
          const animeIndexA = aSeason.animes.indexOf(a);
          const animeIndexB = bSeason.animes.indexOf(b);
          return animeIndexA - animeIndexB;
        }
        return 0;
      });
    });
    
    return {
      seriesArray: Array.from(filteredSeriesMap.entries()),
      standaloneAnimes: standalone,
    };
  }, [seasons]);

  // 未登録シーズンの提案を取得
  const fetchSuggestions = async (seriesName: string, registeredTitles: Set<string>) => {
    if (loadingSuggestions.has(seriesName) || suggestedSeasons.has(seriesName)) {
      return;
    }

    setLoadingSuggestions(prev => new Set(prev).add(seriesName));

    try {
      const { searchAnime } = await import('../../lib/anilist');
      const results = await searchAnime(seriesName);
      
      // 登録済みでない作品をフィルタリング（タイトルで比較）
      const unregistered = results.filter((anime: AniListSearchResult) => {
        const animeId = anime.id.toString();
        // 非表示にした提案を除外
        if (dismissedSuggestions.has(animeId)) {
          return false;
        }
        
        const titleRomaji = anime.title?.romaji?.toLowerCase() || '';
        const titleNative = anime.title?.native?.toLowerCase() || '';
        
        // 登録済みタイトルと比較
        return !Array.from(registeredTitles).some(registeredTitle => {
          const lowerRegistered = registeredTitle.toLowerCase();
          return titleRomaji.includes(lowerRegistered) || 
                 titleNative.includes(lowerRegistered) ||
                 lowerRegistered.includes(titleRomaji) ||
                 lowerRegistered.includes(titleNative);
        });
      });

      if (unregistered.length > 0) {
        setSuggestedSeasons(prev => {
          const newMap = new Map(prev);
          newMap.set(seriesName, unregistered);
          return newMap;
        });
      }
    } catch (error) {
      console.error('提案の取得に失敗しました:', error);
    } finally {
      setLoadingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesName);
        return newSet;
      });
    }
  };

  const toggleSeries = (seriesName: string, registeredTitles: Set<string>) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(seriesName)) {
      newExpanded.delete(seriesName);
    } else {
      newExpanded.add(seriesName);
      // 展開時に提案を取得
      fetchSuggestions(seriesName, registeredTitles);
    }
    setExpandedSeries(newExpanded);
  };

  // 提案を非表示にする
  const dismissSuggestion = (animeId: string) => {
    const newDismissed = new Set(dismissedSuggestions);
    newDismissed.add(animeId);
    setDismissedSuggestions(newDismissed);
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedAnimeSuggestions', JSON.stringify(Array.from(newDismissed)));
    }
    
    // 提案リストから削除
    setSuggestedSeasons(prev => {
      const newMap = new Map(prev);
      newMap.forEach((suggestions, key) => {
        const filtered = suggestions.filter((s: AniListSearchResult) => s.id.toString() !== animeId);
        if (filtered.length === 0) {
          newMap.delete(key);
        } else {
          newMap.set(key, filtered);
        }
      });
      return newMap;
    });
  };

  return (
    <div className="space-y-6">
      {/* シリーズ一覧 */}
      {seriesArray.map(([seriesName, animes]) => {
        const isExpanded = expandedSeries.has(seriesName);
        const registeredTitles = new Set(animes.map(a => a.title));
        const suggestions = suggestedSeasons.get(seriesName) || [];
        const isLoading = loadingSuggestions.has(seriesName);

        return (
          <div key={seriesName} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
            <button
              onClick={() => toggleSeries(seriesName, registeredTitles)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">
                  {isExpanded ? '▼' : '▶'}
                </span>
                <h2 className="text-xl font-bold dark:text-white">{seriesName}</h2>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                全{animes.length}作品
              </span>
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {animes.map((anime, index) => {
                    const seasonNum = getSeasonNumber(anime.title);
                    return (
                      <div key={anime.id} className="relative">
                        {seasonNum !== null && (
                          <div className="absolute -top-1 -right-1 bg-[#e879d4] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                            第{seasonNum}期
                          </div>
                        )}
                        <AnimeCard anime={anime} onClick={() => setSelectedAnime(anime)} />
                      </div>
                    );
                  })}
                </div>

                {/* 未登録シーズンの提案 */}
                {suggestions.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      このシリーズの他の作品が見つかりました
                    </p>
                    <div className="space-y-2">
                      {suggestions.slice(0, 3).map((suggestion: AniListSearchResult) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => {
                            onOpenAddForm();
                            // ここで選択された作品の情報をAddAnimeFormModalに渡す必要がある
                            // 現時点ではモーダルを開くだけ
                          }}
                        >
                          {suggestion.coverImage?.medium && (
                            <img
                              src={suggestion.coverImage.medium}
                              alt={suggestion.title.romaji || suggestion.title.native || ''}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {suggestion.title.romaji || suggestion.title.native}
                            </p>
                            {suggestion.seasonYear && suggestion.season && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {suggestion.seasonYear}年{(() => {
                                  const seasonName = suggestion.season === 'SPRING' ? '春' : suggestion.season === 'SUMMER' ? '夏' : suggestion.season === 'FALL' ? '秋' : '冬';
                                  const monthRanges: { [key: string]: string } = {
                                    '冬': '1~3月',
                                    '春': '4~6月',
                                    '夏': '7~9月',
                                    '秋': '10~12月',
                                  };
                                  const months = monthRanges[seasonName] || '';
                                  return months ? `${seasonName} (${months})` : seasonName;
                                })()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissSuggestion(suggestion.id.toString());
                              }}
                              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                              title="間違っている"
                            >
                              ×
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAddForm();
                              }}
                              className="px-3 py-1 text-xs bg-[#e879d4] text-white rounded hover:bg-[#d45dbf] transition-colors"
                            >
                              追加
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      他の作品を検索中...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* 単発作品 */}
      {standaloneAnimes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
          <button
            onClick={() => setExpandedStandalone(!expandedStandalone)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">
                {expandedStandalone ? '▼' : '▶'}
              </span>
              <h2 className="text-xl font-bold dark:text-white">単発作品</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              全{standaloneAnimes.length}作品
            </span>
          </button>
          
          {expandedStandalone && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {standaloneAnimes.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    onClick={() => setSelectedAnime(anime)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {seriesArray.length === 0 && standaloneAnimes.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          アニメが登録されていません
        </p>
      )}
    </div>
  );
}

