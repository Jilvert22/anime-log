'use client';

import { useState, useEffect } from 'react';
import type { Anime, EvangelistList } from '../../types';

export function CreateListModal({
  show,
  onClose,
  allAnimes,
  editingList,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  editingList: EvangelistList | null;
  onSave: (list: { title: string; description: string; animeIds: number[] }) => void;
}) {
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);

  useEffect(() => {
    if (editingList) {
      setNewListTitle(editingList.title);
      setNewListDescription(editingList.description || '');
      setSelectedAnimeIds(editingList.animeIds);
    } else {
      setNewListTitle('');
      setNewListDescription('');
      setSelectedAnimeIds([]);
    }
  }, [editingList, show]);

  if (!show) return null;

  const handleSave = () => {
    if (newListTitle.trim() && selectedAnimeIds.length > 0) {
      onSave({
        title: newListTitle.trim(),
        description: newListDescription.trim(),
        animeIds: selectedAnimeIds,
      });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {editingList ? 'リストを編集' : '新しいリストを作成'}
        </h2>
        
        {/* タイトル入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            タイトル
          </label>
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b9d] dark:bg-gray-700 dark:text-white"
            placeholder="初心者におすすめ5選"
          />
        </div>

        {/* 説明入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            説明
          </label>
          <textarea
            value={newListDescription}
            onChange={(e) => setNewListDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b9d] dark:bg-gray-700 dark:text-white"
            placeholder="アニメ入門にぴったり"
            rows={3}
          />
        </div>

        {/* アニメ選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アニメを選択
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allAnimes.map((anime) => (
              <label
                key={anime.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAnimeIds.includes(anime.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAnimeIds([...selectedAnimeIds, anime.id]);
                    } else {
                      setSelectedAnimeIds(selectedAnimeIds.filter(id => id !== anime.id));
                    }
                  }}
                  className="w-4 h-4 text-[#ff6b9d] rounded focus:ring-[#ff6b9d]"
                />
                <span className="text-sm dark:text-white">{anime.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!newListTitle.trim() || selectedAnimeIds.length === 0}
            className="flex-1 bg-[#ff6b9d] text-white py-3 rounded-xl font-bold hover:bg-[#ff8a65] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingList ? '更新' : '作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
