'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef } from 'react';
import type { Anime, Season, User, SupabaseAnimeRow, AniListSearchResult } from '../../types';
import { AnimeCard } from '../AnimeCard';

// タブコンポーネントを動的インポート（初期表示タブ以外）
const GalleryTab = dynamic(() => import('./GalleryTab').then(mod => ({ default: mod.GalleryTab })), {
  ssr: false,
  loading: () => <div className="animate-pulse text-center py-8">読み込み中...</div>,
});

const WatchlistTab = dynamic(() => import('./WatchlistTab').then(mod => ({ default: mod.WatchlistTab })), {
  ssr: false,
  loading: () => <div className="animate-pulse text-center py-8">読み込み中...</div>,
});

const SeasonWatchlistTab = dynamic(() => import('./SeasonWatchlistTab'), {
  ssr: false,
  loading: () => <div className="animate-pulse text-center py-8">読み込み中...</div>,
});
import { isNextSeason } from '../../utils/helpers';
import { useAnimeDataContext } from '../../contexts/AnimeDataContext';
import { useCountAnimation } from '../../hooks/useCountAnimation';
import { SeriesView } from './SeriesView';
import { SearchResultsSection } from './SearchResultsSection';
import { YearHeader, SeasonHeader } from './SeasonHeaders';
import { useSeasonSearch } from '../../hooks/useSeasonSearch';
import { useYearSeasonData } from '../../hooks/useYearSeasonData';
import type { FilterType } from '../../hooks/useYearSeasonData';
import { useExpansionControl } from '../../hooks/useExpansionControl';

export function HomeTab({
  homeSubTab,
  setHomeSubTab,
  expandedYears,
  setExpandedYears,
  onOpenAddForm,
  setSelectedAnime,
  user,
  extractSeriesName,
  getSeasonName,
  animeToSupabase,
  supabaseToAnime,
}: {
  homeSubTab: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season';
  setHomeSubTab: (tab: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season') => void;
  expandedYears: Set<string>;
  setExpandedYears: (years: Set<string>) => void;
  onOpenAddForm: () => void;
  setSelectedAnime: (anime: Anime | null) => void;
  user: User | null;
  extractSeriesName: (title: string) => string | undefined;
  getSeasonName: (season: string) => string;
  animeToSupabase: (anime: Anime, seasonName: string, userId: string) => SupabaseAnimeRow;
  supabaseToAnime: (row: SupabaseAnimeRow) => Anime;
}) {
  // Contextからアニメデータを取得
  const {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
  } = useAnimeDataContext();
  
  // カウントアニメーションを計算
  const count = useCountAnimation(allAnimes.length);

  // 年・季節データのロジックをフックから取得
  const {
    filter,
    setFilter,
    showAllSeasons,
    setShowAllSeasons,
    showUnregisteredOnly,
    setShowUnregisteredOnly,
    yearSeasonData,
    filteredStats,
    filterAnime,
  } = useYearSeasonData({
    seasons,
    allAnimes,
  });

  // 検索関連のロジックをフックから取得
  const {
    seasonSearchResults,
    setSeasonSearchResults,
    loadingSeasons,
    expandedSeasonSearches,
    setExpandedSeasonSearches,
    searchSeasonAnimes,
    handleSeasonSearch,
    addAnimeFromSearch,
    addToWatchlistFromSearch,
    addToNextSeasonWatchlist,
    addedToWatchlistIds,
  } = useSeasonSearch({
    allAnimes,
    seasons,
    setSeasons,
    user,
    extractSeriesName,
    animeToSupabase,
  });

  // 展開/折りたたみ関連のロジックをフックから取得
  const {
    expandAll,
    collapseAll,
    isAllExpanded,
    toggleYear,
    toggleSeason,
  } = useExpansionControl({
    yearSeasonData,
    expandedYears,
    setExpandedYears,
    expandedSeasons,
    setExpandedSeasons,
    seasonSearchResults,
    loadingSeasons,
    searchSeasonAnimes,
    setExpandedSeasonSearches,
  });

  // タブ切り替えハンドラーをメモ化
  const handleTabChange = useCallback((tabId: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season') => {
    setHomeSubTab(tabId);
  }, [setHomeSubTab]);

  // アニメ選択ハンドラーをメモ化
  const handleAnimeClick = useCallback((anime: Anime) => {
    setSelectedAnime(anime);
  }, [setSelectedAnime]);

  // LCP要素の優先読み込み用カウンター（最初の6枚にpriorityを設定）
  // コンポーネントの再レンダリング時にリセットされるため、各レンダリングで最初の6枚にpriorityを設定
  const priorityImageCountRef = useRef(0);
  const PRIORITY_IMAGE_LIMIT = 6;
  
  // レンダリング開始時にカウンターをリセット
  priorityImageCountRef.current = 0;

  return (
    <>
      {/* サブタブ */}
      <div className="flex gap-2 md:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'seasons', label: 'クール別' },
          { id: 'watchlist', label: '積みアニメ' },
          { id: 'current-season', label: '来期視聴予定' },
          { id: 'series', label: 'シリーズ' },
          { id: 'gallery', label: 'ギャラリー' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof homeSubTab)}
            className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
              homeSubTab === tab.id
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
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

          {/* コントロールバー */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <button 
              onClick={onOpenAddForm}
              className="py-3 px-6 border-2 border-dashed border-[#e879d4] rounded-xl text-[#e879d4] font-bold hover:border-[#d45dbf] hover:text-[#d45dbf] hover:bg-[#e879d4]/5 transition-colors"
            >
              + アニメを追加
            </button>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* フィルター */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
              >
                <option value="all">すべて</option>
                <option value="unrated">未評価</option>
                <option value="unwatched">周回未登録</option>
              </select>
              
              {/* 未登録のクールも含めて表示するトグル */}
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllSeasons}
                  onChange={(e) => {
                    setShowAllSeasons(e.target.checked);
                    if (!e.target.checked) {
                      setShowUnregisteredOnly(false);
                    }
                  }}
                  className="w-4 h-4 text-[#e879d4] rounded focus:ring-[#e879d4]"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  未登録のクールも含めて表示
                </span>
              </label>
              
              {/* 未登録シーズンのみ表示トグル */}
              {showAllSeasons && (
                <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnregisteredOnly}
                    onChange={(e) => setShowUnregisteredOnly(e.target.checked)}
                    className="w-4 h-4 text-[#e879d4] rounded focus:ring-[#e879d4]"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    未登録シーズンのみ表示
                  </span>
                </label>
              )}
              
              {/* 全展開/全折りたたみ（上部ヘッダーに移動） */}
              <button
                onClick={isAllExpanded ? collapseAll : expandAll}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                {isAllExpanded ? '全て折りたたむ' : '全て展開'}
              </button>
            </div>
          </div>

          {/* フィルター適用中の表示 */}
          {filter !== 'all' && (
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {filteredStats.count} / {filteredStats.totalCount} 作品を表示中
            </div>
          )}

          {/* 年別リスト */}
          <div className="space-y-3 relative">
            {yearSeasonData.map(({ year, seasons: yearSeasons, allAnimes }) => (
              <div key={year} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <YearHeader
                  year={year}
                  animes={allAnimes}
                  isExpanded={expandedYears.has(year)}
                  onToggle={() => toggleYear(year)}
                />
                
                {expandedYears.has(year) && (
                  <div className="px-2 pb-3 space-y-2">
                    {yearSeasons.map(({ season, animes }) => {
                      const seasonKey = `${year}-${season}`;
                      const isEmpty = animes.length === 0;
                      const isExpanded = expandedSeasons.has(seasonKey);
                      const searchResults = seasonSearchResults.get(seasonKey) || [];
                      const isLoading = loadingSeasons.has(seasonKey);
                      const isSearchExpanded = expandedSeasonSearches.has(seasonKey);
                      
                      return (
                        <div key={seasonKey}>
                          <SeasonHeader
                            season={season}
                            animes={animes}
                            isExpanded={isExpanded}
                            onToggle={() => toggleSeason(year, season)}
                            isEmpty={isEmpty}
                            onSearch={!isEmpty ? () => handleSeasonSearch(year, season) : undefined}
                          />
                          
                          {isExpanded && (
                            <>
                              {/* 登録済み作品の表示 */}
                              {animes.length > 0 && (
                                <>
                                  <div className="ml-8 mt-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-2">
                                    {animes.map((anime, index) => {
                                      const shouldPriority = priorityImageCountRef.current < PRIORITY_IMAGE_LIMIT;
                                      if (shouldPriority) {
                                        priorityImageCountRef.current += 1;
                                      }
                                      return (
                                        <AnimeCard 
                                          key={anime.id && typeof anime.id === 'number' && !isNaN(anime.id) ? anime.id : `anime-${year}-${season}-${index}`} 
                                          anime={anime}
                                          onClick={() => handleAnimeClick(anime)}
                                          priority={shouldPriority}
                                        />
                                      );
                                    })}
                                  </div>
                                  
                                  {/* 登録済みクールの検索結果表示 */}
                                  {isSearchExpanded && (
                                    <div className="ml-8 mt-4 px-2">
                                      {searchResults.length > 0 ? (
                                        <SearchResultsSection
                                          searchResults={searchResults}
                                          seasonKey={seasonKey}
                                          expandedSeasons={expandedSeasons}
                                          setExpandedSeasons={setExpandedSeasons}
                                          expandedSeasonSearches={expandedSeasonSearches}
                                          setExpandedSeasonSearches={setExpandedSeasonSearches}
                                          addedToWatchlistIds={addedToWatchlistIds}
                                          addAnimeFromSearch={addAnimeFromSearch}
                                          addToWatchlistFromSearch={addToWatchlistFromSearch}
                                          addToNextSeasonWatchlist={addToNextSeasonWatchlist}
                                          year={year}
                                          season={season}
                                        />
                                      ) : (
                                        <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                          このクールの他の作品が見つかりませんでした
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* 未登録シーズンの検索結果表示 */}
                              {isEmpty && (
                                <div className="ml-8 mt-2 px-2">
                                  {isLoading ? (
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                      作品を検索中...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                    <SearchResultsSection
                                      searchResults={searchResults}
                                      seasonKey={seasonKey}
                                      expandedSeasons={expandedSeasons}
                                      setExpandedSeasons={setExpandedSeasons}
                                      expandedSeasonSearches={expandedSeasonSearches}
                                      setExpandedSeasonSearches={setExpandedSeasonSearches}
                                      addedToWatchlistIds={addedToWatchlistIds}
                                      addAnimeFromSearch={addAnimeFromSearch}
                                      addToWatchlistFromSearch={addToWatchlistFromSearch}
                                      addToNextSeasonWatchlist={addToNextSeasonWatchlist}
                                      year={year}
                                      season={season}
                                    />
                                  ) : (
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                      作品が見つかりませんでした
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 作品がない場合 */}
          {yearSeasonData.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {filter !== 'all' ? '該当する作品がありません' : 'アニメが登録されていません'}
            </p>
          )}
        </>
      )}

      {homeSubTab === 'series' && (
        <SeriesView seasons={seasons} setSelectedAnime={setSelectedAnime} onOpenAddForm={onOpenAddForm} />
      )}

      {homeSubTab === 'gallery' && (
        <GalleryTab
          allAnimes={allAnimes}
          setSelectedAnime={setSelectedAnime}
        />
      )}

      {homeSubTab === 'watchlist' && (
        <WatchlistTab
          setSelectedAnime={setSelectedAnime}
          onOpenAddForm={onOpenAddForm}
          user={user}
          seasons={seasons}
          setSeasons={setSeasons}
          expandedSeasons={expandedSeasons}
          setExpandedSeasons={setExpandedSeasons}
        />
      )}

      {homeSubTab === 'current-season' && (
        <SeasonWatchlistTab />
      )}
    </>
  );
}
