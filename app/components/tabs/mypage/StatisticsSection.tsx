'use client';

import { useState, useMemo } from 'react';
import type { Anime, Season } from '../../../types';
import { availableTags, ratingLabels } from '../../../constants';
import { translateGenre } from '../../../utils/helpers';

interface StatisticsSectionProps {
  allAnimes: Anime[];
  seasons: Season[];
}

interface StatCardProps {
  value: number | string;
  label: string;
  gradient: string; // CSS linear-gradient文字列
  small?: boolean;
}

function StatCard({ value, label, gradient, small }: StatCardProps) {
  return (
    <div 
      className="p-3 rounded-xl text-center shadow-lg flex flex-col items-center justify-center"
      style={{
        background: gradient
      }}
    >
      <div className="font-bold text-white font-mixed text-2xl">
        {value}
      </div>
      <div className="text-white/70 text-sm mt-0.5 font-mixed">{label}</div>
    </div>
  );
}

export default function StatisticsSection({ allAnimes, seasons }: StatisticsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // サマリー統計の計算
  const stats = useMemo(() => {
    const totalAnimes = allAnimes.length;
    const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0);
    const ratedAnimes = allAnimes.filter(a => a.rating && a.rating > 0);
    const avgRating = ratedAnimes.length > 0 
      ? ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length
      : 0;
    
    // 最も見たクールの計算
    const seasonCounts: { [key: string]: number } = {};
    seasons.forEach(season => {
      seasonCounts[season.name] = season.animes.length;
    });
    const mostWatchedSeason = Object.entries(seasonCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';

    return { totalAnimes, totalRewatchCount, avgRating, mostWatchedSeason };
  }, [allAnimes, seasons]);

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
      .slice(0, 10);
  }, [allAnimes]);

  // 傾向テキスト生成
  const tendencyText = useMemo(() => {
    const topTags = sortedTags.slice(0, 2);
    return topTags.length > 0
      ? `あなたは${topTags.map(([tag]) => {
          const tagInfo = availableTags.find(t => t.value === tag);
          if (tagInfo) {
            return tagInfo.label;
          }
          const translatedTag = translateGenre(tag);
          return translatedTag || tag;
        }).join('と')}な作品を好む傾向があります`
      : 'データが不足しています';
  }, [sortedTags]);

  return (
    <div className="bg-white dark:bg-gray-800/40 rounded-2xl p-5 backdrop-blur shadow-md">
      {/* ヘッダー */}
      <h2 className="text-lg font-bold mb-4 text-[#6b5b6e] dark:text-white font-mixed">
        統計・傾向
      </h2>

      {/* サマリーカード（常時表示） */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatCard 
          value={stats.totalAnimes} 
          label="作品" 
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
        />
        <StatCard 
          value={stats.totalRewatchCount} 
          label="周回" 
          gradient="linear-gradient(135deg, #764ba2 0%, #e879d4 100%)" 
        />
        <StatCard 
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'} 
          label="平均" 
          gradient="linear-gradient(135deg, #e879d4 0%, #f093fb 100%)" 
        />
        <StatCard 
          value={stats.mostWatchedSeason} 
          label="最多" 
          gradient="linear-gradient(135deg, #f093fb 0%, #667eea 100%)" 
        />
      </div>

      {/* 展開ボタン */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-mixed"
      >
        {isExpanded ? '閉じる' : '詳細を見る'}
        <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* 展開コンテンツ */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isExpanded ? 'max-h-[3000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-4">
          {/* あなたの傾向まとめ */}
          <div 
            className="rounded-xl p-5 text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 35%, #e879d4 65%, #f093fb 100%)'
            }}
          >
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 font-mixed">
              <span>✨</span>
              あなたの傾向まとめ
            </h3>
            <p className="text-sm leading-relaxed font-mixed">{tendencyText}</p>
          </div>

          {/* ジャンル分布 */}
          {sortedTags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white flex items-center gap-2 font-mixed">
                <span>🏷️</span>
                ジャンル分布
              </h3>
              <div className="space-y-3">
                {sortedTags.map(([tag, count]) => {
                  const tagInfo = availableTags.find(t => t.value === tag);
                  const percentage = (count / maxTagCount) * 100;
                  const barWidth = Math.round(percentage / 5) * 5;
                  
                  return (
                    <div key={tag} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#6b5b6e] dark:text-white font-mixed">
                          {tagInfo?.label || tag}
                        </span>
                        <span className="text-sm font-bold text-[#e879d4] dark:text-[#e879d4] font-mixed">
                          {Math.round((count / allAnimes.length) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right font-mixed">
                          {count}本
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 評価分布 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white flex items-center gap-2 font-mixed">
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
                      <span className="text-sm font-medium text-[#6b5b6e] dark:text-white font-mixed">
                        ⭐{rating} {ratingLabel?.label || ''}
                      </span>
                      <span className="text-sm font-bold text-[#e879d4] dark:text-[#e879d4] font-mixed">
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
          </div>

          {/* 視聴ペース */}
          {seasonAnimeCounts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white flex items-center gap-2 font-mixed">
                <span>📅</span>
                視聴ペース
              </h3>
              <div className="space-y-3">
                {seasonAnimeCounts.map(({ name, count }) => {
                  const percentage = (count / maxSeasonCount) * 100;
                  const barWidth = Math.round(percentage / 5) * 5;
                  
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#6b5b6e] dark:text-white font-mixed">{name}</span>
                        <span className="text-sm font-bold text-[#e879d4] dark:text-[#e879d4] font-mixed">
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
            </div>
          )}

          {/* よく見る制作会社 */}
          {studios.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white font-mixed">よく見る制作会社</h3>
              <div className="space-y-2">
                {studios.map((studio) => (
                  <div key={studio.name} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
                    <span className="font-medium text-[#6b5b6e] dark:text-white font-mixed">{studio.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-mixed">{studio.count}作品</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
