'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Anime, Season } from '../../types';
import { supabase } from '../../lib/supabase';

export function SongModal({
  show,
  onClose,
  selectedAnime: initialSelectedAnime,
  setSelectedAnime: setSelectedAnimeParent,
  allAnimes,
  seasons,
  setSeasons,
  user,
  initialSongType,
  initialSongTitle,
  initialSongArtist,
}: {
  show: boolean;
  onClose: () => void;
  selectedAnime: Anime | null;
  setSelectedAnime: (anime: Anime | null) => void;
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  initialSongType: 'op' | 'ed' | null;
  initialSongTitle: string;
  initialSongArtist: string;
}) {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(initialSelectedAnime);
  const [songType, setSongType] = useState<'op' | 'ed' | null>(initialSongType);
  const [newSongTitle, setNewSongTitle] = useState(initialSongTitle);
  const [newSongArtist, setNewSongArtist] = useState(initialSongArtist);

  if (!show) return null;

  const handleClose = () => {
    onClose();
    setSelectedAnime(null);
    setSongType(null);
    setNewSongTitle('');
    setNewSongArtist('');
    setSelectedAnimeParent(null);
  };

  const handleSubmit = async () => {
    if (newSongTitle.trim() && newSongArtist.trim() && songType && selectedAnime) {
      const newSong = {
        title: newSongTitle.trim(),
        artist: newSongArtist.trim(),
        rating: 0,
        isFavorite: false,
      };
      
      const updatedSeasons = seasons.map(season => ({
        ...season,
        animes: season.animes.map((anime) =>
          anime.id === selectedAnime.id
            ? {
                ...anime,
                songs: {
                  ...anime.songs,
                  [songType]: newSong,
                },
              }
            : anime
        ),
      }));
      
      // Supabaseを更新（ログイン時のみ）
      if (user) {
        try {
          const updatedSongs = {
            ...selectedAnime.songs,
            [songType]: newSong,
          };
          const { error } = await supabase
            .from('animes')
            .update({ songs: updatedSongs })
            .eq('id', selectedAnime.id)
            .eq('user_id', user.id);
          
          if (error) throw error;
        } catch (error) {
          console.error('Failed to save anime song to Supabase:', error);
        }
      }
      
      setSeasons(updatedSeasons);
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {songType ? `${songType === 'op' ? 'OP' : 'ED'}を登録` : '主題歌を追加'}
        </h2>
        
        {/* アニメ選択（selectedAnimeがない場合） */}
        {!selectedAnime && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              アニメ
            </label>
            <select
              onChange={(e) => {
                const anime = allAnimes.find(a => a.id === Number(e.target.value));
                if (anime) {
                  setSelectedAnime(anime);
                  setSelectedAnimeParent(anime);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            >
              <option value="">選択してください</option>
              {allAnimes.map((anime) => (
                <option key={anime.id} value={anime.id}>
                  {anime.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* アニメ表示（selectedAnimeがある場合） */}
        {selectedAnime && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">アニメ</p>
            <p className="font-bold dark:text-white">{selectedAnime.title}</p>
            <button
              onClick={() => {
                setSelectedAnime(null);
                setSelectedAnimeParent(null);
              }}
              className="text-xs text-[#ffc2d1] dark:text-[#ffc2d1] mt-1"
            >
              変更
            </button>
          </div>
        )}

        {/* タイプ選択（songTypeがない場合） */}
        {selectedAnime && !songType && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              タイプ
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSongType('op')}
                className="flex-1 px-4 py-2 rounded-xl font-bold transition-colors bg-orange-500 text-white hover:bg-orange-600"
              >
                OP
              </button>
              <button
                onClick={() => setSongType('ed')}
                className="flex-1 px-4 py-2 rounded-xl font-bold transition-colors bg-blue-500 text-white hover:bg-blue-600"
              >
                ED
              </button>
            </div>
          </div>
        )}

        {/* タイプ表示（songTypeがある場合） */}
        {songType && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">タイプ</p>
            <p className="font-bold dark:text-white">{songType.toUpperCase()}</p>
            <button
              onClick={() => setSongType(null)}
              className="text-xs text-[#ffc2d1] dark:text-[#ffc2d1] mt-1"
            >
              変更
            </button>
          </div>
        )}
        
        {/* 曲名入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            曲名
          </label>
          <input
            type="text"
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            placeholder="曲名を入力"
          />
        </div>

        {/* アーティスト名入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アーティスト名
          </label>
          <input
            type="text"
            value={newSongArtist}
            onChange={(e) => setNewSongArtist(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            placeholder="アーティスト名を入力"
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
            onClick={handleSubmit}
            disabled={!newSongTitle.trim() || !newSongArtist.trim() || !songType || !selectedAnime}
            className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
}
