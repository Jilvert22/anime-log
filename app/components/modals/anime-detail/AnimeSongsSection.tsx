'use client';

import { Heart, Star } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Anime } from '../../../types';
import { updateAnimeFields } from '../../../lib/api/animes';

type SongType = 'op' | 'ed';

// OP/ED で異なるのはキーと背景グラデーションのみ。それ以外は完全に同一。
const GRADIENT: Record<SongType, string> = {
  op: 'from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
  ed: 'from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30',
};

/**
 * アニメ詳細モーダルの主題歌 (OP/ED) セクション。
 * 旧 AnimeDetailModal 内にベタ書きされていた OP/ED の重複ブロックを、
 * songType でパラメータ化した単一の SongRow に集約した。
 */
export function AnimeSongsSection({
  selectedAnime,
  user,
  handleUpdateAnime,
  setShowSongModal,
}: {
  selectedAnime: Anime;
  user: User | null;
  handleUpdateAnime: (
    updater: (anime: Anime) => Anime,
    supabaseUpdater?: (anime: Anime) => Promise<void>
  ) => Promise<void>;
  setShowSongModal: (show: boolean) => void;
}) {
  // 曲の1フィールドを更新する共通ハンドラ (isFavorite/rating)。
  const updateSongField = (
    type: SongType,
    changes: Partial<{ isFavorite: boolean; rating: number }>
  ) =>
    handleUpdateAnime(
      (anime) => ({
        ...anime,
        songs: {
          ...anime.songs,
          [type]: anime.songs?.[type] ? { ...anime.songs[type]!, ...changes } : undefined,
        },
      }),
      async (anime) => {
        const song = anime.songs?.[type];
        if (song) {
          const updatedSongs = { ...anime.songs, [type]: { ...song, ...changes } };
          await updateAnimeFields(anime.id, user!.id, { songs: updatedSongs });
        }
      }
    );

  const removeSong = (type: SongType) =>
    handleUpdateAnime(
      (anime) => ({ ...anime, songs: { ...anime.songs, [type]: undefined } }),
      async (anime) => {
        const updatedSongs = { ...anime.songs, [type]: undefined };
        await updateAnimeFields(anime.id, user!.id, { songs: updatedSongs });
      }
    );

  const renderRow = (type: SongType) => {
    const song = selectedAnime.songs?.[type];
    return (
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">{type.toUpperCase()}</p>
          {!song && (
            <button
              onClick={() => setShowSongModal(true)}
              className="text-xs bg-[#e879d4] text-white px-3 py-1 rounded-lg hover:bg-[#f09fe3] transition-colors"
            >
              + 登録
            </button>
          )}
        </div>
        {song && (
          <div className={`bg-gradient-to-r ${GRADIENT[type]} rounded-lg p-3`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="font-bold text-sm dark:text-white">{song.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{song.artist}</p>
              </div>
              <button
                onClick={() => updateSongField(type, { isFavorite: !song.isFavorite })}
                className="text-xl"
              >
                <Heart
                  className={`w-5 h-5 ${song.isFavorite ? 'fill-[#e879d4] text-[#e879d4]' : 'text-gray-400'}`}
                  aria-hidden
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateSongField(type, { rating })}
                  className={`text-sm ${
                    (song.rating ?? 0) >= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" aria-hidden />
                </button>
              ))}
            </div>
            <button
              onClick={() => removeSong(type)}
              className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
            >
              削除
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center font-medium">
        主題歌
      </p>
      {renderRow('op')}
      {renderRow('ed')}
    </div>
  );
}
