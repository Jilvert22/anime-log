'use client';
import { RotateCcw, Film } from 'lucide-react';

import { memo, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import type { Anime } from '../types';
import { StarRating } from './StarRating';
import { ratingLabels, availableTags } from '../constants';
import { translateGenre } from '../utils/helpers';

function AnimeCardComponent({ 
  anime, 
  onClick,
  priority = false 
}: { 
  anime: Anime; 
  onClick: () => void;
  priority?: boolean;
}) {
  const rating = ratingLabels[anime.rating];
  const rewatchCount = anime.rewatchCount ?? 0;
  const [imageError, setImageError] = useState(false);
  
  // imageがURLか絵文字かを判定（httpまたはhttpsで始まる場合）
  const isImageUrl = useMemo(
    () => anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://')),
    [anime.image]
  );
  
  // 画像エラー時のフォールバック処理
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-gray-900/50 overflow-hidden cursor-pointer hover:scale-105 hover:shadow-2xl transition-all relative"
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-[#e879d4] to-[#764ba2] relative overflow-hidden rounded-t-2xl">
        {/* 周回数バッジ */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 z-10">
          <RotateCcw className="w-3 h-3 text-white" aria-hidden />
          <span className="text-white text-xs font-bold">{rewatchCount}周</span>
        </div>
        
        {/* 視聴済みチェックマーク */}
        {anime.watched && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center z-10">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
        
        {/* 画像または絵文字を表示 */}
        {isImageUrl && !imageError ? (
          <Image
            src={anime.image}
            alt={anime.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            unoptimized
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {!imageError && anime.image ? (
              <span>{anime.image}</span>
            ) : (
              <Film className="w-10 h-10 text-white/60" aria-hidden />
            )}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate dark:text-white">{anime.title}</p>
        {anime.rating > 0 && (
          <div className="mt-1">
            <StarRating rating={anime.rating} size="text-xs" />
            {rating && (
              <p className="text-xs text-orange-500 dark:text-orange-400 font-bold mt-0.5">
                {rating.emoji} {rating.label}
              </p>
            )}
          </div>
        )}
        {/* タグ表示（最大2個まで） */}
        {anime.tags && anime.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {anime.tags.slice(0, 2).map((tag, index) => {
              const tagInfo = availableTags.find(t => t.value === tag);
              // タグがavailableTagsにない場合は、ジャンル翻訳を試す
              const displayLabel = tagInfo?.label || translateGenre(tag) || tag;
              return (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                >
                  {displayLabel}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// React.memoでメモ化（animeオブジェクトの参照が変わった場合のみ再レンダリング）
export const AnimeCard = memo(AnimeCardComponent);
