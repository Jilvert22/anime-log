'use client';

import { useMemo } from 'react';
import type { Anime, Season } from '../../types';
import { availableTags, ratingLabels } from '../../constants';

export function DiscoverTab({
  allAnimes,
  seasons,
}: {
  allAnimes: Anime[];
  seasons: Season[];
}) {
  // 統計データの計算をメモ化
  const totalAnimes = useMemo(() => allAnimes.length, [allAnimes.length]);
  
  const totalRewatchCount = useMemo(
    () => allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0),
    [allAnimes]
  );
  
  const avgRating = useMemo(() => {
    const ratedAnimes = allAnimes.filter(a => a.rating && a.rating > 0);
    return ratedAnimes.length > 0
      ? ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length
      : 0;
  }, [allAnimes]);
  
  // 最も見たクールを計算
  const mostWatchedSeason = useMemo(() => {
    const seasonCounts: { [key: string]: number } = {};
    seasons.forEach(season => {
      seasonCounts[season.name] = season.animes.length;
    });
    return Object.entries(seasonCounts).sort((a, b) => b[1] - a[1])[0];
  }, [seasons]);
  
  // タグの使用頻度
  const { sortedTags, maxTagCount } = useMemo(() => {
    const tagCounts: { [key: string]: number } = {};
    allAnimes.forEach(anime => {
      anime.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return {
      sortedTags: sorted,
      maxTagCount: sorted.length > 0 ? sorted[0][1] : 1,
    };
  }, [allAnimes]);
  
  // 評価分布
  const { ratingCounts, maxRatingCount } = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: allAnimes.filter(a => a.rating === rating).length,
    }));
    return {
      ratingCounts: counts,
      maxRatingCount: Math.max(...counts.map(r => r.count), 1),
    };
  }, [allAnimes]);
  
  // クール別視聴数
  const { seasonAnimeCounts, maxSeasonCount } = useMemo(() => {
    const counts = seasons.map(season => ({
      name: season.name,
      count: season.animes.length,
    }));
    return {
      seasonAnimeCounts: counts,
      maxSeasonCount: Math.max(...counts.map(s => s.count), 1),
    };
  }, [seasons]);
  
  // タグの集計（マイページから移動）
  const mostPopularTag = useMemo(() => {
    const tagCountsForProfile: { [key: string]: number } = {};
    allAnimes.forEach(anime => {
      anime.tags?.forEach(tag => {
        tagCountsForProfile[tag] = (tagCountsForProfile[tag] || 0) + 1;
      });
    });
    const sortedTagsForProfile = Object.entries(tagCountsForProfile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return sortedTagsForProfile[0] ? availableTags.find(t => t.value === sortedTagsForProfile[0][0]) : null;
  }, [allAnimes]);
  
  // 制作会社を実際のアニメデータから集計
  const studios = useMemo(() => {
    const studioCounts: { [key: string]: number } = {};
    allAnimes.forEach(anime => {
      if (anime.studios && Array.isArray(anime.studios)) {
        anime.studios.forEach(studio => {
          if (studio) {
            studioCounts[studio] = (studioCounts[studio] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(studioCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 上位10社
  }, [allAnimes]);
  
  // 傾向テキスト生成
  const tendencyText = useMemo(() => {
    const topTags = sortedTags.slice(0, 2);
    return topTags.length > 0
      ? `あなたは${topTags.map(([tag]) => {
          const tagInfo = availableTags.find(t => t.value === tag);
          return `${tagInfo?.emoji}${tagInfo?.label || tag}`;
        }).join('と')}な作品を好む傾向があります`
      : 'データが不足しています';
  }, [sortedTags]);

  return (
    <div className="space-y-6">
      {/* 視聴統計サマリー（統合版、一番上） */}
      <div className="bg-gradient-to-br from-[#ff6b9d] to-[#ff8a65] rounded-2xl p-5 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📊</span>
                視聴統計サマリー
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">総視聴作品数</p>
                  <p className="text-2xl font-black">{totalAnimes}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">総周回数</p>
                  <p className="text-2xl font-black">{totalRewatchCount}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">平均評価</p>
                  <p className="text-2xl font-black">
                    {avgRating > 0 ? `⭐${avgRating.toFixed(1)}` : '⭐0.0'}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">最も見たクール</p>
                  <p className="text-lg font-bold truncate">
                    {mostWatchedSeason ? mostWatchedSeason[0] : '-'}
                  </p>
                </div>
              </div>
            </div>
      
      {/* あなたの傾向まとめ（サマリーの次） */}
      <div className="bg-gradient-to-br from-[#ff6b9d] to-[#ff8a65] rounded-2xl p-5 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span>✨</span>
                あなたの傾向まとめ
              </h3>
              <p className="text-sm leading-relaxed">{tendencyText}</p>
            </div>

      {/* ジャンル分布 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 dark:text-white flex items-center gap-2">
                <span>🏷️</span>
                ジャンル分布
              </h3>
              {sortedTags.length > 0 ? (
                <div className="space-y-3">
                  {sortedTags.map(([tag, count]) => {
                    const tagInfo = availableTags.find(t => t.value === tag);
                    const percentage = (count / maxTagCount) * 100;
                    const barWidth = Math.round(percentage / 5) * 5; // 5%刻み
                    
                    return (
                      <div key={tag} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium dark:text-white">
                            {tagInfo?.emoji} {tagInfo?.label || tag}
                          </span>
                          <span className="text-sm font-bold text-[#ff6b9d] dark:text-[#ff6b9d]">
                            {Math.round((count / totalAnimes) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                            {count}本
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
              )}
            </div>

      {/* 評価分布 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 dark:text-white flex items-center gap-2">
                <span>⭐</span>
                評価分布
              </h3>
              <div className="space-y-3">
                {ratingCounts.map(({ rating, count }) => {
                  const percentage = (count / maxRatingCount) * 100;
                  const barWidth = Math.round(percentage / 5) * 5;
                  const ratingLabel = ratingLabels[rating];
                  
                  return (
                    <div key={rating} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium dark:text-white">
                          ⭐{rating} {ratingLabel?.label || ''}
                        </span>
                        <span className="text-sm font-bold text-[#ff6b9d] dark:text-[#ff6b9d]">
                          {count}本
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  {ratingCounts.find(r => r.rating === 5)?.count || 0}本の神作、
                  {ratingCounts.find(r => r.rating === 4)?.count || 0}本の名作、
                  {ratingCounts.find(r => r.rating === 3)?.count || 0}本の普通作品
                </p>
              </div>
            </div>

      {/* 視聴ペース */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 dark:text-white flex items-center gap-2">
                <span>📅</span>
                視聴ペース
              </h3>
              {seasonAnimeCounts.length > 0 ? (
                <div className="space-y-3">
                  {seasonAnimeCounts.map(({ name, count }) => {
                    const percentage = (count / maxSeasonCount) * 100;
                    const barWidth = Math.round(percentage / 5) * 5;
                    
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium dark:text-white">{name}</span>
                          <span className="text-sm font-bold text-[#ff6b9d] dark:text-[#ff6b9d]">
                            {count}本
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
              )}
            </div>

      {/* よく見る制作会社（最後） */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 dark:text-white">よく見る制作会社</h3>
              {studios.length > 0 ? (
                <div className="space-y-2">
                  {studios.map((studio) => (
                    <div key={studio.name} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
                      <span className="font-medium dark:text-white">{studio.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{studio.count}作品</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
              )}
            </div>
    </div>
  );
}
