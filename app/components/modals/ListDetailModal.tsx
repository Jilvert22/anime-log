'use client';

import type { EvangelistList, Anime } from '../../types';

interface ListDetailModalProps {
  selectedList: EvangelistList;
  setSelectedList: (list: EvangelistList | null) => void;
  allAnimes: Anime[];
  setSelectedAnime: (anime: Anime | null) => void;
  setEditingList: (list: EvangelistList | null) => void;
  setShowCreateListModal: (show: boolean) => void;
  evangelistLists: EvangelistList[];
  setEvangelistLists: (lists: EvangelistList[]) => void;
}

export function ListDetailModal({
  selectedList,
  setSelectedList,
  allAnimes,
  setSelectedAnime,
  setEditingList,
  setShowCreateListModal,
  evangelistLists,
  setEvangelistLists,
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
                  className="bg-gradient-to-br from-[#ff6b9d] to-[#ff8a65] rounded-xl p-3 text-white text-center cursor-pointer hover:scale-105 transition-transform"
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
            onClick={async () => {
              if (navigator.share) {
                try {
                  const animeTitles = selectedList.animeIds
                    .map(id => allAnimes.find(a => a.id === id)?.title)
                    .filter(Boolean)
                    .join('、');
                  
                  await navigator.share({
                    title: selectedList.title,
                    text: `${selectedList.description}\n\n${animeTitles}`,
                  });
                } catch (error) {
                  console.error('Share failed:', error);
                }
              } else {
                // フォールバック: テキストをクリップボードにコピー
                const animeTitles = selectedList.animeIds
                  .map(id => allAnimes.find(a => a.id === id)?.title)
                  .filter(Boolean)
                  .join('、');
                const shareText = `${selectedList.title}\n${selectedList.description}\n\n${animeTitles}`;
                await navigator.clipboard.writeText(shareText);
                alert('リストをクリップボードにコピーしました');
              }
            }}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            📤 シェア
          </button>
          <button
            onClick={() => {
              setEditingList(selectedList);
              setSelectedList(null);
              setShowCreateListModal(true);
            }}
            className="flex-1 bg-[#ff6b9d] text-white py-3 rounded-xl font-bold hover:bg-[#ff8a65] transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => {
              setEvangelistLists(evangelistLists.filter(list => list.id !== selectedList.id));
              setSelectedList(null);
            }}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
          >
            削除
          </button>
        </div>
        
        <button
          onClick={() => setSelectedList(null)}
          className="w-full mt-3 text-gray-500 dark:text-gray-400 text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

