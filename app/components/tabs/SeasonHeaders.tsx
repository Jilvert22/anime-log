'use client';

import { memo, useMemo } from 'react';
import type { Anime } from '../../types';

interface YearHeaderProps {
  year: string;
  animes: Anime[];
  isExpanded: boolean;
  onToggle: () => void;
}

export const YearHeader = memo(function YearHeader({ 
  year, 
  animes, 
  isExpanded, 
  onToggle 
}: YearHeaderProps) {
  const stats = useMemo(() => {
    const total = animes.length;
    const godTier = animes.filter(a => a.rating === 5).length;
    const avgRating = animes.length > 0 
      ? (animes.reduce((sum, a) => sum + a.rating, 0) / animes.length).toFixed(1)
      : '0.0';
    return { total, godTier, avgRating };
  }, [animes]);

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="font-bold text-xl dark:text-white">{year}年</span>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-bold" style={{ color: '#764ba2' }}>{stats.total}</span> 作品
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          平均 <span className="font-bold text-orange-500">{stats.avgRating}</span>
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          神作 <span className="font-bold" style={{ color: '#e879d4' }}>{stats.godTier}</span>
        </span>
      </div>
    </button>
  );
});

interface SeasonHeaderProps {
  season: string;
  animes: Anime[];
  isExpanded: boolean;
  onToggle: () => void;
  isEmpty?: boolean;
  onSearch?: () => void;
}

export const SeasonHeader = memo(function SeasonHeader({ 
  season, 
  animes, 
  isExpanded, 
  onToggle,
  isEmpty,
  onSearch
}: SeasonHeaderProps) {
  const stats = useMemo(() => {
    const total = animes.length;
    const godTier = animes.filter(a => a.rating === 5).length;
    const avgRating = animes.length > 0 
      ? (animes.reduce((sum, a) => sum + a.rating, 0) / animes.length).toFixed(1)
      : '0.0';
    return { total, godTier, avgRating };
  }, [animes]);

  // 季節名に月の範囲を追加
  const getSeasonWithMonths = (seasonName: string): string => {
    const monthRanges: { [key: string]: string } = {
      '冬': '1~3月',
      '春': '4~6月',
      '夏': '7~9月',
      '秋': '10~12月',
    };
    const months = monthRanges[seasonName] || '';
    return months ? `${seasonName} (${months})` : seasonName;
  };

  return (
    <div className={`w-full ml-4 ${isEmpty ? 'border border-dashed border-gray-300 dark:border-gray-600 rounded-lg' : ''}`}>
      <div className={`flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
        isEmpty ? '' : ''
      }`}>
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {isExpanded ? '▼' : '▶'}
            </span>
            <span className={`font-medium ${isEmpty ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {getSeasonWithMonths(season)}
              {isEmpty && <span className="ml-2 text-xs">(未登録)</span>}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            {isEmpty ? (
              <span className="text-gray-400 dark:text-gray-500 text-xs">作品を検索</span>
            ) : (
              <>
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium" style={{ color: '#764ba2' }}>{stats.total}</span> 作品
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  平均 <span className="font-medium text-orange-500">{stats.avgRating}</span>
                </span>
                {stats.godTier > 0 && (
                  <span className="text-gray-500 dark:text-gray-400">
                    神作 <span className="font-medium" style={{ color: '#e879d4' }}>{stats.godTier}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </button>
        {!isEmpty && onSearch && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSearch();
            }}
            className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            検索
          </button>
        )}
      </div>
      
    </div>
  );
});

