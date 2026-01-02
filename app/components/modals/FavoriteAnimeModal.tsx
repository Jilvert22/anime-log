'use client';

import type { Anime } from '../../types';
import { StarRating } from '../StarRating';

export function FavoriteAnimeModal({
  show,
  onClose,
  allAnimes,
  favoriteAnimeIds,
  setFavoriteAnimeIds,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  favoriteAnimeIds: number[];
  setFavoriteAnimeIds: (ids: number[]) => void;
  onSave?: () => void;
}) {
  if (!show) return null;

  const handleSave = () => {
    // useFavoriteAnimeフックのuseEffectが自動的にlocalStorageに保存するため、
    // ここでのlocalStorage.setItemは不要（二重保存を避ける）
    // ただし、念のため明示的に保存する
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
      } catch (e) {
        console.error('Failed to save favoriteAnimeIds', e);
      }
    }
    if (onSave) {
      onSave();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">最推し作品を選択（最大5作品）</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allAnimes.map((anime) => {
            const isSelected = favoriteAnimeIds.includes(anime.id);
            return (
              <button
                key={anime.id}
                onClick={() => {
                  if (isSelected) {
                    setFavoriteAnimeIds(favoriteAnimeIds.filter(id => id !== anime.id));
                  } else {
                    if (favoriteAnimeIds.length < 5) {
                      setFavoriteAnimeIds([...favoriteAnimeIds, anime.id]);
                    } else {
                      alert('最大5作品まで選択できます');
                    }
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-[#e879d4] bg-[#e879d4]/10 dark:bg-[#e879d4]/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#e879d4]'
                }`}
              >
                <div className="w-12 h-16 rounded overflow-hidden shrink-0">
                  {anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://')) ? (
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64"><rect fill="%23ddd" width="48" height="64"/></svg>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <span className="text-2xl">{anime.image || '🎬'}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm dark:text-white">{anime.title}</p>
                  {anime.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={anime.rating} size="text-sm" />
                    </div>
                  )}
                </div>
                {isSelected && (
                  <span className="text-[#e879d4] text-xl">✓</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            閉じる
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
