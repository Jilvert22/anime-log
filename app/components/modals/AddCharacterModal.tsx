'use client';

import { useState, useEffect } from 'react';
import type { Anime, FavoriteCharacter } from '../../types';
import { characterCategories, characterPresetTags } from '../../constants';

export function AddCharacterModal({
  show,
  onClose,
  allAnimes,
  editingCharacter,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  editingCharacter: FavoriteCharacter | null;
  onSave: (character: FavoriteCharacter) => void;
}) {
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterAnimeId, setNewCharacterAnimeId] = useState<number | null>(null);
  const [newCharacterImage, setNewCharacterImage] = useState('👤');
  const [newCharacterCategory, setNewCharacterCategory] = useState('');
  const [newCharacterTags, setNewCharacterTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');

  useEffect(() => {
    if (editingCharacter) {
      setNewCharacterName(editingCharacter.name);
      setNewCharacterAnimeId(editingCharacter.animeId);
      setNewCharacterImage(editingCharacter.image);
      setNewCharacterCategory(editingCharacter.category);
      setNewCharacterTags(editingCharacter.tags || []);
      setNewCustomTag('');
    } else {
      setNewCharacterName('');
      setNewCharacterAnimeId(null);
      setNewCharacterImage('👤');
      setNewCharacterCategory('');
      setNewCharacterTags([]);
      setNewCustomTag('');
    }
  }, [editingCharacter, show]);

  if (!show) return null;

  const handleSave = () => {
    if (newCharacterName.trim() && newCharacterAnimeId) {
      const selectedAnime = allAnimes.find(a => a.id === newCharacterAnimeId);
      if (selectedAnime) {
        if (editingCharacter) {
          // 編集
          const updatedCharacter: FavoriteCharacter = {
            ...editingCharacter,
            name: newCharacterName.trim(),
            animeId: newCharacterAnimeId,
            animeName: selectedAnime.title,
            image: newCharacterImage,
            category: newCharacterCategory,
            tags: newCharacterTags,
          };
          onSave(updatedCharacter);
        } else {
          // 新規追加
          const newCharacter: FavoriteCharacter = {
            id: Date.now(),
            name: newCharacterName.trim(),
            animeId: newCharacterAnimeId,
            animeName: selectedAnime.title,
            image: newCharacterImage,
            category: newCharacterCategory,
            tags: newCharacterTags,
          };
          onSave(newCharacter);
        }
        onClose();
      }
    }
  };

  const handleClose = () => {
    onClose();
    setNewCharacterName('');
    setNewCharacterAnimeId(null);
    setNewCharacterImage('👤');
    setNewCharacterCategory('');
    setNewCharacterTags([]);
    setNewCustomTag('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {editingCharacter ? '推しを編集' : '推しを追加'}
        </h2>
        
        {/* キャラ名入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            キャラ名
          </label>
          <input
            type="text"
            value={newCharacterName}
            onChange={(e) => setNewCharacterName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
            placeholder="キャラクター名"
          />
        </div>

        {/* アニメ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アニメ
          </label>
          <select
            value={newCharacterAnimeId || ''}
            onChange={(e) => setNewCharacterAnimeId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
          >
            <option value="">選択してください</option>
            {allAnimes.map((anime) => (
              <option key={anime.id} value={anime.id}>
                {anime.title}
              </option>
            ))}
          </select>
        </div>

        {/* アイコン選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アイコン
          </label>
          <div className="grid grid-cols-8 gap-2">
            {['👤', '👻', '🧝', '🎸', '👑', '🦄', '🌟', '💫', '⚡', '🔥', '💕', '❤️', '🎭', '🛡️', '😇', '🤡', '💀', '🎪', '🎨', '🎯', '🎬', '🎮'].map((icon) => (
              <button
                key={icon}
                onClick={() => setNewCharacterImage(icon)}
                className={`text-3xl p-2 rounded-lg transition-all ${
                  newCharacterImage === icon
                    ? 'bg-[#e879d4]/20 dark:bg-[#e879d4]/20 ring-2 ring-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* カテゴリ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            カテゴリ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {characterCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => setNewCharacterCategory(category.value)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  newCharacterCategory === category.value
                    ? 'bg-[#e879d4] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.emoji} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* タグ選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            タグ
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {characterPresetTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (newCharacterTags.includes(tag)) {
                    setNewCharacterTags(newCharacterTags.filter(t => t !== tag));
                  } else {
                    setNewCharacterTags([...newCharacterTags, tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  newCharacterTags.includes(tag)
                    ? 'bg-[#e879d4] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          {/* カスタムタグ追加 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCustomTag}
              onChange={(e) => setNewCustomTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newCustomTag.trim() && !newCharacterTags.includes(newCustomTag.trim())) {
                  setNewCharacterTags([...newCharacterTags, newCustomTag.trim()]);
                  setNewCustomTag('');
                }
              }}
              className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
              placeholder="新しいタグを入力してEnter"
            />
          </div>
          
          {/* 選択中のタグ表示 */}
          {newCharacterTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {newCharacterTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-[#e879d4]/20 dark:bg-[#e879d4]/20 text-[#e879d4] dark:text-[#e879d4] px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                  <button
                    onClick={() => setNewCharacterTags(newCharacterTags.filter((_, i) => i !== index))}
                    className="hover:text-red-500"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!newCharacterName.trim() || !newCharacterAnimeId}
            className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingCharacter ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
