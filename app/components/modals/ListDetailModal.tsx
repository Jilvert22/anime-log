'use client';

import type { EvangelistList, Anime } from '../../types';

interface ListDetailModalProps {
  selectedList: EvangelistList;
  setSelectedList: (list: EvangelistList | null) => void;
  allAnimes: Anime[];
  setSelectedAnime: (anime: Anime | null) => void;
  setEditingList: (list: EvangelistList | null) => void;
  setShowCreateListModal: (show: boolean) => void;
}

export function ListDetailModal({
  selectedList,
  setSelectedList,
  allAnimes,
  setSelectedAnime,
  setEditingList,
  setShowCreateListModal,
}: ListDetailModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedList(null)}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2 dark:text-white">{selectedList.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedList.description}</p>
        
        {/* アニメ一覧 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {selectedList.animeIds.length}作品
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {selectedList.animeIds.map((animeId) => {
              const anime = allAnimes.find(a => a.id === animeId);
              if (!anime) return null;
              const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
              return (
                <div
                  key={animeId}
                  onClick={() => {
                    setSelectedAnime(anime);
                    setSelectedList(null);
                  }}
                  className="bg-linear-to-br from-[#ffc2d1] to-[#ffb07c] rounded-xl p-3 text-white text-center cursor-pointer hover:scale-105 transition-transform"
                >
                  {isImageUrl ? (
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="w-full h-16 object-cover rounded mb-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-3xl mb-1">🎬</div><p class="text-xs font-bold truncate">' + anime.title + '</p>';
                        }
                      }}
                    />
                  ) : (
                    <div className="text-3xl mb-1">{anime.image}</div>
                  )}
                  <p className="text-xs font-bold truncate">{anime.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingList(selectedList);
              setSelectedList(null);
              setShowCreateListModal(true);
            }}
            className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => setSelectedList(null)}
            className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

