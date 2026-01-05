'use client';

import { useState, useCallback } from 'react';
import type { AniListMediaWithStreaming } from '../../lib/api/annict';
import { isNextSeason } from '../../utils/helpers';
import { WatchlistDetailSheet } from '../modals/WatchlistDetailSheet';
import { getAnimeDetail, type AniListMedia } from '../../lib/anilist';

interface SearchResultsSectionProps {
  searchResults: AniListMediaWithStreaming[];
  seasonKey: string;
  expandedSeasons: Set<string>;
  setExpandedSeasons: (seasons: Set<string>) => void;
  expandedSeasonSearches: Set<string>;
  setExpandedSeasonSearches: (searches: Set<string>) => void;
  addedToWatchlistIds: Set<number>;
  addAnimeFromSearch: (result: AniListMediaWithStreaming, year: string, season: string) => Promise<void>;
  addToWatchlistFromSearch: (result: AniListMediaWithStreaming, year?: string, season?: string) => Promise<void>;
  addToNextSeasonWatchlist: (result: AniListMediaWithStreaming) => Promise<void>;
  year: string;
  season: string;
}

export function SearchResultsSection({
  searchResults,
  seasonKey,
  expandedSeasons,
  setExpandedSeasons,
  expandedSeasonSearches,
  setExpandedSeasonSearches,
  addedToWatchlistIds,
  addAnimeFromSearch,
  addToWatchlistFromSearch,
  addToNextSeasonWatchlist,
  year,
  season,
}: SearchResultsSectionProps) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [selectedAnimeMedia, setSelectedAnimeMedia] = useState<AniListMedia | AniListMediaWithStreaming | null>(null);
  
  const handleClose = useCallback(() => {
    const newExpandedSeasons = new Set(expandedSeasons);
    newExpandedSeasons.delete(seasonKey);
    setExpandedSeasons(newExpandedSeasons);
    const newExpandedSearches = new Set(expandedSeasonSearches);
    newExpandedSearches.delete(seasonKey);
    setExpandedSeasonSearches(newExpandedSearches);
  }, [seasonKey, expandedSeasons, setExpandedSeasons, expandedSeasonSearches, setExpandedSeasonSearches]);

  return (
    <div className="relative">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {searchResults.length}件の作品が見つかりました
          </p>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-[#e879d4] text-white text-xs font-medium rounded-lg hover:bg-[#f09fe3] transition-colors shadow-md"
          >
            閉じる
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
        {searchResults.map((result: AniListMediaWithStreaming) => {
          const anilistId = result?.id;
          const isValidId = anilistId && typeof anilistId === 'number' && !isNaN(anilistId);
          const isLoading = loadingIds.has(anilistId);
          const title = result?.title?.native || result?.title?.romaji || result?.title?.english || 'タイトル不明';
          const imageUrl = result?.coverImage?.large || result?.coverImage?.medium;
          
          // 無効なIDの場合はスキップ
          if (!isValidId) {
            console.warn('Invalid anime data:', result);
            return null;
          }

          return (
            <div
              key={anilistId}
              className="relative group"
            >
              {imageUrl ? (
                <button
                  onClick={async () => {
                    try {
                      const detail = await getAnimeDetail(anilistId);
                      if (detail) {
                        setSelectedAnimeMedia({ ...result, ...detail } as AniListMediaWithStreaming);
                      } else {
                        setSelectedAnimeMedia(result);
                      }
                    } catch (error) {
                      console.error('アニメ詳細の取得に失敗しました:', error);
                      setSelectedAnimeMedia(result);
                    }
                  }}
                  className="w-full aspect-[2/3] overflow-hidden rounded-lg"
                >
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </button>
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#e879d4] to-[#764ba2] rounded-lg flex items-center justify-center text-4xl">
                  🎬
                </div>
              )}
              <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                {title}
              </p>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isLoading) return;
                  
                  console.log('Add anime clicked:', { anilistId, title, result });
                  setLoadingIds(prev => new Set(prev).add(anilistId));
                  try {
                    await addAnimeFromSearch(result, year, season);
                  } catch (error) {
                    console.error('アニメの追加に失敗しました:', error);
                  } finally {
                    setLoadingIds(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(anilistId);
                      return newSet;
                    });
                  }
                }}
                disabled={isLoading}
                className="mt-2 w-full px-2 py-1 text-xs font-medium bg-[#e879d4] text-white rounded hover:bg-[#d45dbf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '追加中...' : '追加'}
              </button>
              <div className="mt-1 space-y-1">
                {addedToWatchlistIds.has(anilistId) ? (
                  <button
                    disabled
                    className="w-full px-2 py-1 text-xs font-medium bg-gray-400 text-white rounded cursor-not-allowed"
                  >
                  積みアニメに追加済み
                  </button>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isLoading) return;
                      
                      console.log('Add to watchlist clicked:', { anilistId, title, result });
                      setLoadingIds(prev => new Set(prev).add(anilistId));
                      try {
                        await addToWatchlistFromSearch(result, year, season);
                      } catch (error) {
                        console.error('積みアニメへの追加に失敗しました:', error);
                      } finally {
                        setLoadingIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(anilistId);
                          return newSet;
                        });
                      }
                    }}
                    disabled={isLoading}
                    className="w-full px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '追加中...' : '積みアニメに追加'}
                  </button>
                )}
                {(() => {
                  // 検索結果のアニメが来期シーズンかどうかを判定
                  const seasonYear = parseInt(year, 10);
                  const seasonEnum = season as 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
                  const isNext = isNextSeason(seasonYear, seasonEnum);
                  
                  if (!isNext) return null;
                  
                  return (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isLoading) return;
                        
                        console.log('Add to next season watchlist clicked:', { anilistId, title, result });
                        setLoadingIds(prev => new Set(prev).add(anilistId));
                        try {
                          await addToNextSeasonWatchlist(result);
                        } catch (error) {
                          console.error('来期積みアニメへの追加に失敗しました:', error);
                        } finally {
                          setLoadingIds(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(anilistId);
                            return newSet;
                          });
                        }
                      }}
                      disabled={isLoading}
                      className="w-full px-2 py-1 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '追加中...' : '視聴予定に追加'}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      {/* 検索結果エリアの右下にstickyで「閉じる」ボタン */}
      <div className="sticky bottom-4 flex justify-end z-10">
        <button
          onClick={handleClose}
          className="bg-gray-800 dark:bg-slate-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-slate-600 transition-colors"
        >
          閉じる
        </button>
      </div>

      {/* 詳細情報ボトムシート */}
      <WatchlistDetailSheet
        item={null}
        animeMedia={selectedAnimeMedia}
        onClose={() => {
          setSelectedAnimeMedia(null);
        }}
        onUpdate={async () => {
          // 検索結果の場合は更新不要
        }}
      />
    </div>
  );
}

