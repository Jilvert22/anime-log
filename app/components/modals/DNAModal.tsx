'use client';

import type { Anime } from '../../types';

export function DNAModal({
  show,
  onClose,
  allAnimes,
  favoriteAnimeIds,
  count,
  averageRating,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  favoriteAnimeIds: number[];
  count: number;
  averageRating: number;
}) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DNAカード */}
        <div className="bg-linear-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl p-6 mb-4 shadow-lg">
          {/* タイトル */}
          <div className="text-center mb-4">
            <h2 className="text-white text-xl font-black mb-1">MY ANIME DNA</h2>
            <span className="text-2xl">✨</span>
          </div>
          
          {/* オタクタイプ */}
          <div className="text-center mb-6">
            <p className="text-white text-4xl font-black">
              🎵 音響派
            </p>
          </div>
          
          {/* 統計 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
              <p className="text-white text-2xl font-black">{count}</p>
              <p className="text-white/80 text-xs mt-1">作品</p>
            </div>
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
              <p className="text-white text-2xl font-black">12</p>
              <p className="text-white/80 text-xs mt-1">周</p>
            </div>
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
              <p className="text-white text-2xl font-black">
                {averageRating > 0 ? `${averageRating.toFixed(1)}` : '0.0'}
              </p>
              <p className="text-white/80 text-xs mt-1">平均</p>
            </div>
          </div>
          
          {/* 最推し作品 */}
          <div className="mb-4">
            <p className="text-white/90 text-xs font-medium mb-2 text-center">最推し作品</p>
            <div className="flex justify-center gap-3">
              {(favoriteAnimeIds.length > 0
                ? favoriteAnimeIds
                    .map(id => allAnimes.find(a => a.id === id))
                    .filter((a): a is Anime => a !== undefined)
                    .slice(0, 3)
                : allAnimes
                    .filter(a => a.rating > 0)
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3)
              ).map((anime) => {
                  const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
                  return (
                    <div
                      key={anime.id}
                      className="bg-white/20 backdrop-blur-sm rounded-lg w-16 h-20 flex items-center justify-center overflow-hidden relative"
                    >
                      {isImageUrl ? (
                        <img
                          src={anime.image}
                          alt={anime.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<span class="text-3xl">🎬</span>';
                            }
                          }}
                        />
                      ) : (
                        <span className="text-3xl">{anime.image || '🎬'}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* ロゴ */}
          <div className="text-center pt-2 border-t border-white/20">
            <p className="text-white/80 text-xs font-bold">アニメログ</p>
          </div>
        </div>
        
        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={() => {}}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>保存</span>
          </button>
          <button
            onClick={() => {}}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📤</span>
            <span>シェア</span>
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 dark:text-gray-400 text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
