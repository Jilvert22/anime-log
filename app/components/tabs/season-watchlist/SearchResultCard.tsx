'use client';

import Image from 'next/image';
import { Film } from 'lucide-react';
import type { AniListMediaWithStreaming } from '../../../lib/api/annict';
import { formatStartDate } from '../../../utils/animeDate';

// 検索結果カードコンポーネント（クール別一覧と同じスタイル）
export function SearchResultCard({
  anime,
  isAdded,
  onAdd,
  onRemove,
  onCardClick,
}: {
  anime: AniListMediaWithStreaming;
  isAdded: boolean;
  onAdd: () => void;
  onRemove?: () => void;
  onCardClick?: () => void;
}) {
  return (
    <div className="relative group">
      <div className="relative cursor-pointer" onClick={onCardClick}>
        {anime.coverImage?.large ? (
          <Image
            src={anime.coverImage.large}
            alt={anime.title?.native || anime.title?.romaji || ''}
            width={200}
            height={300}
            className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#e879d4] to-[#764ba2] rounded-lg flex items-center justify-center">
            <Film className="w-8 h-8 text-white/60" aria-hidden />
          </div>
        )}
        {anime.isContinuing && (
          <span
            className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded shadow"
            title="前シーズンから継続して放送中の作品"
          >
            継続中
          </span>
        )}
        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
          <span className="text-white text-sm font-medium">詳細を見る</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
        {anime.title?.native || anime.title?.romaji || 'タイトル不明'}
      </p>
      {formatStartDate(anime.startDate) && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
          {formatStartDate(anime.startDate)}
        </p>
      )}
      <div className="mt-1 flex gap-1">
        {isAdded && onRemove ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="flex-1 px-2 py-1 text-xs font-medium rounded transition-colors relative z-10 bg-gray-500 text-white hover:bg-gray-600"
          >
            視聴予定から外す
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }}
            disabled={isAdded}
            className={`w-full px-2 py-1 text-xs font-medium rounded transition-colors relative z-10 ${
              isAdded
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isAdded ? '追加済み' : '視聴予定に追加'}
          </button>
        )}
      </div>
    </div>
  );
}
