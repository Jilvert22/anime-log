'use client';

import { useState, useEffect } from 'react';
import type { Anime, VoiceActor } from '../../types';

export function AddVoiceActorModal({
  show,
  onClose,
  allAnimes,
  editingVoiceActor,
  voiceActors,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  editingVoiceActor: VoiceActor | null;
  voiceActors: VoiceActor[];
  onSave: (voiceActor: VoiceActor) => void;
}) {
  const [newVoiceActorName, setNewVoiceActorName] = useState('');
  const [newVoiceActorImage, setNewVoiceActorImage] = useState('🎤');
  const [newVoiceActorAnimeIds, setNewVoiceActorAnimeIds] = useState<number[]>([]);
  const [newVoiceActorNotes, setNewVoiceActorNotes] = useState('');

  useEffect(() => {
    if (editingVoiceActor) {
      setNewVoiceActorName(editingVoiceActor.name);
      setNewVoiceActorImage(editingVoiceActor.image);
      setNewVoiceActorAnimeIds(editingVoiceActor.animeIds);
      setNewVoiceActorNotes(editingVoiceActor.notes || '');
    } else {
      setNewVoiceActorName('');
      setNewVoiceActorImage('🎤');
      setNewVoiceActorAnimeIds([]);
      setNewVoiceActorNotes('');
    }
  }, [editingVoiceActor, show]);

  if (!show) return null;

  const handleSave = () => {
    if (newVoiceActorName.trim()) {
      const animeNames = newVoiceActorAnimeIds
        .map(id => allAnimes.find(a => a.id === id)?.title)
        .filter(Boolean) as string[];

      if (editingVoiceActor) {
        // 編集
        const updatedVoiceActor: VoiceActor = {
          ...editingVoiceActor,
          name: newVoiceActorName.trim(),
          image: newVoiceActorImage,
          animeIds: newVoiceActorAnimeIds,
          animeNames: animeNames,
          notes: newVoiceActorNotes.trim() || undefined,
        };
        onSave(updatedVoiceActor);
      } else {
        // 新規追加
        const maxId = voiceActors.length > 0 ? Math.max(...voiceActors.map(va => va.id)) : 0;
        const newVoiceActor: VoiceActor = {
          id: maxId + 1,
          name: newVoiceActorName.trim(),
          image: newVoiceActorImage,
          animeIds: newVoiceActorAnimeIds,
          animeNames: animeNames,
          notes: newVoiceActorNotes.trim() || undefined,
        };
        onSave(newVoiceActor);
      }
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
    setNewVoiceActorName('');
    setNewVoiceActorImage('🎤');
    setNewVoiceActorAnimeIds([]);
    setNewVoiceActorNotes('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md lg:max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {editingVoiceActor ? '声優を編集' : '声優を追加'}
        </h2>
        
        {/* 声優名入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            声優名
          </label>
          <input
            type="text"
            value={newVoiceActorName}
            onChange={(e) => setNewVoiceActorName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            placeholder="声優名"
          />
        </div>

        {/* アイコン選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アイコン
          </label>
          <div className="grid grid-cols-8 gap-2">
            {['🎤', '🎭', '🎪', '🎨', '🎯', '🎮', '🎸', '🎵', '🎹', '🎧', '🎺', '🎷', '👤', '⭐', '💫', '✨'].map((icon) => (
              <button
                key={icon}
                onClick={() => setNewVoiceActorImage(icon)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  newVoiceActorImage === icon
                    ? 'bg-[#ffc2d1]/20 dark:bg-[#ffc2d1]/20 ring-2 ring-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* 出演アニメ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            出演アニメ（複数選択可）
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-xl p-2 space-y-1">
            {allAnimes.length > 0 ? (
              allAnimes.map((anime) => (
                <label
                  key={anime.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={newVoiceActorAnimeIds.includes(anime.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewVoiceActorAnimeIds([...newVoiceActorAnimeIds, anime.id]);
                      } else {
                        setNewVoiceActorAnimeIds(newVoiceActorAnimeIds.filter(id => id !== anime.id));
                      }
                    }}
                    className="w-4 h-4 text-[#ffc2d1] rounded focus:ring-[#ffc2d1]"
                  />
                  <span className="text-sm dark:text-white">{anime.title}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">アニメが登録されていません</p>
            )}
          </div>
        </div>

        {/* メモ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            メモ（任意）
          </label>
          <textarea
            value={newVoiceActorNotes}
            onChange={(e) => setNewVoiceActorNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            placeholder="メモを入力..."
            rows={3}
          />
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
            disabled={!newVoiceActorName.trim()}
            className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingVoiceActor ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
