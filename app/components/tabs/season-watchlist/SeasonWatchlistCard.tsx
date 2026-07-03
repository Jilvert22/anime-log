'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Film } from 'lucide-react';
import type { WatchlistItem } from '../../../lib/storage/types';
import {
  getNextWatchlistStatus,
  getWatchlistStatusLabel,
  getWatchlistStatusColor,
  type WatchlistStatus,
} from '../../../lib/watchlist/status';
import { formatStartDate } from '../../../utils/animeDate';

// 視聴予定アニメカード
export function SeasonWatchlistCard({
  item,
  onStatusChange,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onCardClick,
}: {
  item: WatchlistItem;
  onStatusChange: (anilistId: number, newStatus: WatchlistStatus) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onCardClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl =
    item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'));

  const handleStatusChange = () => {
    const nextStatus = getNextWatchlistStatus(item.status);
    if (nextStatus && item.anilist_id) {
      onStatusChange(item.anilist_id, nextStatus);
    }
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      return;
    }

    // カードをタップしたら詳細画面を開く
    if (onCardClick) {
      onCardClick();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden group relative cursor-pointer ${isSelected ? 'ring-2 ring-[#e879d4]' : ''}`}
      onClick={handleCardClick}
    >
      {/* 選択モード時のチェックボックス */}
      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-gray-300 accent-[#e879d4] focus:ring-[#e879d4] cursor-pointer"
          />
        </div>
      )}

      <div className="aspect-[3/4] bg-gradient-to-br from-[#e879d4] to-[#764ba2] relative">
        {isImageUrl && !imageError && item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 20vw"
            loading="lazy"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-white/60" aria-hidden />
          </div>
        )}

        {/* ステータスバッジ */}
        {item.status && (
          <div
            className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${getWatchlistStatusColor(item.status)}`}
          >
            {getWatchlistStatusLabel(item.status)}
          </div>
        )}

        {/* 継続中バッジ (前シーズンから継続して放送中) */}
        {item.isContinuing && (
          <div
            className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-bold text-white bg-purple-600 shadow"
            title="前シーズンから継続して放送中の作品"
          >
            継続中
          </div>
        )}

        {/* ホバー時の「詳細を表示」テキスト（デスクトップ用、選択モード時は非表示） */}
        {!isSelectionMode && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none md:pointer-events-none">
            <span className="text-white text-sm font-medium">詳細を表示</span>
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2">
          {item.title}
        </p>
        {/* 放送情報表示 */}
        {item.broadcast_day !== null && item.broadcast_day !== undefined && item.broadcast_time ? (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {(() => {
              const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
              return `${dayNames[item.broadcast_day]} ${item.broadcast_time}`;
            })()}
          </p>
        ) : null}
        {formatStartDate(item.start_date) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatStartDate(item.start_date)}
          </p>
        )}
        {item.memo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.memo}</p>
        )}
      </div>
    </div>
  );
}
