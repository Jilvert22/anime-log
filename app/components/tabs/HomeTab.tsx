'use client';

import { useMemo } from 'react';
import type { Anime, Season } from '../../types';
import { AnimeCard } from '../AnimeCard';

export function HomeTab({
  homeSubTab,
  setHomeSubTab,
  count,
  totalRewatchCount,
  averageRating,
  seasons,
  expandedSeasons,
  setExpandedSeasons,
  onOpenAddForm,
  setSelectedAnime,
}: {
  homeSubTab: 'seasons' | 'series';
  setHomeSubTab: (tab: 'seasons' | 'series') => void;
  count: number;
  totalRewatchCount: number;
  averageRating: number;
  seasons: Season[];
  expandedSeasons: Set<string>;
  setExpandedSeasons: (seasons: Set<string>) => void;
  onOpenAddForm: () => void;
  setSelectedAnime: (anime: Anime | null) => void;
}) {
  return (
    <>
      {/* サブタブ */}
      <div className="flex gap-2 md:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setHomeSubTab('seasons')}
          className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
            homeSubTab === 'seasons'
              ? 'bg-[#e879d4] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          クール別
        </button>
        <button
          onClick={() => setHomeSubTab('series')}
          className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
            homeSubTab === 'series'
              ? 'bg-[#e879d4] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          シリーズ
        </button>
      </div>

      {homeSubTab === 'seasons' && (
        <>
          {/* 統計カード */}
          <div 
            className="rounded-2xl p-5 text-white mb-6 relative"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 35%, #e879d4 65%, #f093fb 100%)'
            }}
          >
            {/* オタクタイプ */}
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/50" style={{
                background: 'rgba(255, 255, 255, 0.35)',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                boxShadow: '0 2px 8px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}>
                <span className="text-white text-sm font-semibold">🎵 音響派</span>
              </div>
            </div>
            
            {/* 統計情報 */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black">{count}</p>
                <p className="text-white/80 text-xs mt-1">作品</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black">{totalRewatchCount}</p>
                <p className="text-white/80 text-xs mt-1">周</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black">
                  {averageRating > 0 ? `⭐${averageRating.toFixed(1)}` : '⭐0.0'}
                </p>
                <p className="text-white/80 text-xs mt-1">平均評価</p>
              </div>
            </div>
          </div>

          {/* 追加ボタン */}
          <button 
            onClick={onOpenAddForm}
            className="w-full mb-6 py-4 border-2 border-dashed border-[#e879d4] dark:border-[#e879d4] rounded-2xl text-[#e879d4] dark:text-[#e879d4] font-bold hover:border-[#d45dbf] hover:text-[#d45dbf] hover:bg-[#e879d4]/5 dark:hover:bg-[#e879d4]/5 transition-colors"
          >
            + アニメを追加
          </button>

          {/* アニメ一覧 */}
          {seasons.map((season) => {
            const isExpanded = expandedSeasons.has(season.name);
            const watchedCount = season.animes.filter(a => a.watched).length;
            
            return (
              <div key={season.name} className="mb-6">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedSeasons);
                    if (isExpanded) {
                      newExpanded.delete(season.name);
                    } else {
                      newExpanded.add(season.name);
                    }
                    setExpandedSeasons(newExpanded);
                  }}
                  className="w-full flex items-center justify-between mb-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <h2 className="font-bold text-lg dark:text-white">{season.name}</h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {watchedCount}/{season.animes.length}作品
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {season.animes.map((anime) => (
                      <AnimeCard 
                        key={anime.id} 
                        anime={anime}
                        onClick={() => setSelectedAnime(anime)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {homeSubTab === 'series' && (
        <SeriesView seasons={seasons} setSelectedAnime={setSelectedAnime} />
      )}
    </>
  );
}

// シリーズビューコンポーネント（計算をメモ化）
function SeriesView({ 
  seasons, 
  setSelectedAnime 
}: { 
  seasons: Season[]; 
  setSelectedAnime: (anime: Anime | null) => void;
}) {
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
    
    // シリーズ内を時系列順にソート（seasonNameから判断、または追加順）
    seriesMap.forEach((animes) => {
      animes.sort((a, b) => {
        // 同じシーズン内の順序を保持するため、元の順序を使用
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
      seriesArray: Array.from(seriesMap.entries()),
      standaloneAnimes: standalone,
    };
  }, [seasons]);

  return (
    <div className="space-y-6">
      {/* シリーズ一覧 */}
      {seriesArray.map(([seriesName, animes]) => (
        <div key={seriesName} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold dark:text-white">{seriesName}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              全{animes.length}作品
            </span>
          </div>
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {animes.map((anime) => (
                <div
                  key={anime.id}
                  onClick={() => setSelectedAnime(anime)}
                  className="shrink-0 w-24 cursor-pointer"
                >
                  <AnimeCard anime={anime} onClick={() => setSelectedAnime(anime)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      {/* 単発作品 */}
      {standaloneAnimes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold dark:text-white">単発作品</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              全{standaloneAnimes.length}作品
            </span>
          </div>
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
      
      {seriesArray.length === 0 && standaloneAnimes.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          アニメが登録されていません
        </p>
      )}
    </div>
  );
}
