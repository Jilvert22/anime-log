'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { Film } from 'lucide-react';
import type { Anime } from '../../types';

// サムネイルのみのカード
const ThumbnailCard = memo(function ThumbnailCard({ 
  anime, 
  onClick, 
  selected, 
  onSelect, 
  selectionMode 
}: { 
  anime: Anime; 
  onClick?: (anime: Anime) => void;
  selected: boolean;
  onSelect: (id: number) => void;
  selectionMode: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));

  return (
    <div 
      className={`cursor-pointer group relative ${selected ? 'ring-2 ring-[#e879d4] ring-offset-2 rounded-lg' : ''}`}
      onClick={() => selectionMode ? onSelect(anime.id) : onClick?.(anime)}
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-[#e879d4] to-[#764ba2] rounded-lg overflow-hidden shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 relative">
        {/* 周回数バッジ */}
        {(anime.rewatchCount ?? 0) > 1 && (
          <div className="absolute top-0.5 left-0.5 bg-black/70 rounded-full px-1 py-0.5 z-10">
            <span className="text-white text-[8px] font-bold">{anime.rewatchCount}周</span>
          </div>
        )}
        
        {/* 画像 */}
        {isImageUrl && !imageError ? (
          <Image
            src={anime.image}
            alt={anime.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 20vw, 10vw"
            loading="lazy"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {!imageError && anime.image ? (
              <span>{anime.image}</span>
            ) : (
              <Film className="w-6 h-6 text-white/60" aria-hidden />
            )}
          </div>
        )}
        
        {/* ホバー時のタイトル表示 */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-1">
          <p className="text-white text-[10px] font-medium text-center line-clamp-3">{anime.title}</p>
        </div>
        
        {/* 選択モード時のチェック */}
        {selectionMode && (
          <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-[#e879d4] border-[#e879d4]' : 'border-white bg-black/30'}`}>
            {selected && <span className="text-white text-xs">✓</span>}
          </div>
        )}
      </div>
    </div>
  );
});

// フォルダの型定義
type Folder = {
  id: number;
  name: string;
  animeIds: number[];
};

export function GalleryTab({
  allAnimes,
  setSelectedAnime,
}: {
  allAnimes: Anime[];
  setSelectedAnime: (anime: Anime | null) => void;
}) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [sortType, setSortType] = useState<'rating' | 'rewatch' | 'title'>('rating');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<Set<number>>(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // ソートされたアニメリスト
  const sortedAnimes = useMemo(() => {
    let animes = selectedFolder 
      ? allAnimes.filter(a => selectedFolder.animeIds.includes(a.id))
      : [...allAnimes];
    
    switch (sortType) {
      case 'rating':
        return animes.sort((a, b) => b.rating - a.rating || (b.rewatchCount ?? 0) - (a.rewatchCount ?? 0));
      case 'rewatch':
        return animes.sort((a, b) => (b.rewatchCount ?? 0) - (a.rewatchCount ?? 0));
      case 'title':
        return animes.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
      default:
        return animes;
    }
  }, [allAnimes, sortType, selectedFolder]);

  const toggleSelection = useCallback((animeId: number) => {
    setSelectedAnimeIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(animeId)) {
        newSelected.delete(animeId);
      } else {
        newSelected.add(animeId);
      }
      return newSelected;
    });
  }, []);

  const createFolder = useCallback(() => {
    if (newFolderName.trim() && selectedAnimeIds.size > 0) {
      const newFolder: Folder = {
        id: Date.now(),
        name: newFolderName.trim(),
        animeIds: Array.from(selectedAnimeIds),
      };
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateFolder(false);
      setSelectionMode(false);
      setSelectedAnimeIds(new Set());
    }
  }, [newFolderName, selectedAnimeIds]);

  const deleteFolder = useCallback((folderId: number) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (selectedFolder?.id === folderId) {
      setSelectedFolder(null);
    }
  }, [selectedFolder]);

  const cancelCreateFolder = useCallback(() => {
    setShowCreateFolder(false);
    setSelectionMode(false);
    setSelectedAnimeIds(new Set());
    setNewFolderName('');
  }, []);

  // アニメクリックハンドラーをuseCallbackでメモ化
  const handleAnimeClick = useCallback((anime: Anime) => {
    setSelectedAnime(anime);
  }, [setSelectedAnime]);

  return (
    <>
      {/* フォルダ一覧 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            !selectedFolder
              ? 'bg-[#e879d4] text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          すべて ({allAnimes.length})
        </button>
        
        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => setSelectedFolder(folder)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedFolder?.id === folder.id
                ? 'bg-[#e879d4] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {folder.name} ({folder.animeIds.length})
            {selectedFolder?.id === folder.id && (
              <span 
                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                className="text-white/70 hover:text-white"
              >
                ×
              </span>
            )}
          </button>
        ))}
        
        <button
          onClick={() => { setShowCreateFolder(true); setSelectionMode(true); }}
          className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          + フォルダ作成
        </button>
      </div>

      {/* フォルダ作成モード */}
      {showCreateFolder && (
        <div className="bg-[#e879d4]/10 dark:bg-[#e879d4]/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">フォルダに入れる作品を選択してください</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="フォルダ名"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
            />
            <button
              onClick={createFolder}
              disabled={!newFolderName.trim() || selectedAnimeIds.size === 0}
              className="px-4 py-2 bg-[#e879d4] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d45dbf] transition-colors"
            >
              作成 ({selectedAnimeIds.size}作品)
            </button>
            <button
              onClick={cancelCreateFolder}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* コントロールバー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">並び替え:</span>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as 'rating' | 'rewatch' | 'title')}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
          >
            <option value="rating">評価順</option>
            <option value="rewatch">周回数順</option>
            <option value="title">タイトル順</option>
          </select>
        </div>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {sortedAnimes.length}作品
        </span>
      </div>

      {/* ギャラリーグリッド */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {sortedAnimes.map(anime => (
            <ThumbnailCard
              key={anime.id}
              anime={anime}
              onClick={handleAnimeClick}
              selected={selectedAnimeIds.has(anime.id)}
              onSelect={toggleSelection}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      </div>

      {/* 作品がない場合 */}
      {sortedAnimes.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {selectedFolder ? 'このフォルダには作品がありません' : 'アニメが登録されていません'}
        </p>
      )}
    </>
  );
}

