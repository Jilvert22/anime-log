'use client';
import { Pencil, Trash2, Heart } from 'lucide-react';

import { useState } from 'react';
import type { Anime, Season, User, SupabaseClientType } from '../../types';
import { StarRating } from '../StarRating';
import { useFeedback } from '../../contexts/FeedbackContext';

export function MusicTab({
  allAnimes,
  seasons,
  setSeasons,
  setSelectedAnime,
  setShowSongModal,
  user,
  supabase,
}: {
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  setSelectedAnime: (anime: Anime | null) => void;
  setShowSongModal: (show: boolean) => void;
  user: User | null;
  supabase: SupabaseClientType;
}) {
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicFilterType, setMusicFilterType] = useState<'all' | 'op' | 'ed' | 'artist'>('all');
  const [selectedArtistForFilter, setSelectedArtistForFilter] = useState<string | null>(null);
  const { confirmDialog } = useFeedback();

  // すべての曲を取得
  const allSongs: Array<{
    title: string;
    artist: string;
    rating: number;
    isFavorite: boolean;
    animeTitle: string;
    type: 'op' | 'ed';
    animeId: number;
  }> = [];

  allAnimes.forEach((anime) => {
    if (anime.songs?.op) {
      allSongs.push({
        ...anime.songs.op,
        animeTitle: anime.title,
        type: 'op',
        animeId: anime.id,
      });
    }
    if (anime.songs?.ed) {
      allSongs.push({
        ...anime.songs.ed,
        animeTitle: anime.title,
        type: 'ed',
        animeId: anime.id,
      });
    }
  });

  // フィルタリング
  const filteredSongs = allSongs.filter((song) => {
    // 検索クエリでフィルタ
    if (
      musicSearchQuery &&
      !song.title.toLowerCase().includes(musicSearchQuery.toLowerCase()) &&
      !song.artist.toLowerCase().includes(musicSearchQuery.toLowerCase()) &&
      !song.animeTitle.toLowerCase().includes(musicSearchQuery.toLowerCase())
    ) {
      return false;
    }

    // タイプでフィルタ
    if (musicFilterType === 'op' && song.type !== 'op') return false;
    if (musicFilterType === 'ed' && song.type !== 'ed') return false;

    // アーティストでフィルタ
    if (
      musicFilterType === 'artist' &&
      selectedArtistForFilter &&
      song.artist !== selectedArtistForFilter
    ) {
      return false;
    }

    return true;
  });

  // お気に入り曲
  const favoriteSongs = filteredSongs.filter((song) => song.isFavorite);

  // 高評価TOP10（フィルタ後）
  const topRatedSongs = [...filteredSongs].sort((a, b) => b.rating - a.rating).slice(0, 10);

  // よく聴くアーティスト
  const artistCounts: { [key: string]: number } = {};
  allSongs.forEach((song) => {
    artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // ユニークなアーティストリスト
  const uniqueArtists = Array.from(new Set(allSongs.map((s) => s.artist))).sort();

  return (
    <div className="space-y-6">
      {/* ヘッダーと追加ボタン */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold dark:text-white">主題歌</h2>
        <button
          onClick={() => {
            setSelectedAnime(null);
            setShowSongModal(true);
          }}
          className="text-sm bg-[#e879d4] text-white px-4 py-2 rounded-lg hover:bg-[#f09fe3] transition-colors"
        >
          + 主題歌を追加
        </button>
      </div>

      {/* 検索・フィルタ */}
      {allSongs.length > 0 && (
        <div className="space-y-3">
          {/* 検索バー */}
          <input
            type="text"
            value={musicSearchQuery}
            onChange={(e) => setMusicSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
            placeholder="曲名、アーティスト、アニメで検索..."
          />

          {/* フィルタボタン */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => {
                setMusicFilterType('all');
                setSelectedArtistForFilter(null);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                musicFilterType === 'all'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => {
                setMusicFilterType('op');
                setSelectedArtistForFilter(null);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                musicFilterType === 'op'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              OP
            </button>
            <button
              onClick={() => {
                setMusicFilterType('ed');
                setSelectedArtistForFilter(null);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                musicFilterType === 'ed'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ED
            </button>
            <button
              onClick={() => {
                setMusicFilterType('artist');
                setSelectedArtistForFilter(null);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                musicFilterType === 'artist'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              アーティスト別
            </button>
          </div>

          {/* アーティスト選択（アーティスト別フィルタ時） */}
          {musicFilterType === 'artist' && (
            <select
              value={selectedArtistForFilter || ''}
              onChange={(e) => setSelectedArtistForFilter(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
            >
              <option value="">アーティストを選択...</option>
              {uniqueArtists.map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* お気に入り曲 */}
      {favoriteSongs.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">お気に入り曲</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {favoriteSongs.map((song, index) => {
              const anime = allAnimes.find((a) => a.id === song.animeId);
              return (
                <div
                  key={index}
                  className={`shrink-0 w-48 rounded-xl p-4 text-white shadow-lg relative group ${
                    song.type === 'op'
                      ? 'bg-linear-to-br from-orange-500 to-red-500'
                      : 'bg-linear-to-br from-blue-500 to-purple-600'
                  }`}
                >
                  {/* 編集・削除ボタン */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => {
                        setSelectedAnime(anime || null);
                        setShowSongModal(true);
                      }}
                      className="bg-blue-500 text-white p-1 rounded-lg hover:bg-blue-600 transition-colors"
                      title="編集"
                    >
                      <Pencil className="w-4 h-4" aria-hidden />
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          await confirmDialog({
                            message: `${song.title}を削除しますか？`,
                            danger: true,
                            confirmLabel: '削除',
                          })
                        ) {
                          const updatedSongs = {
                            ...anime?.songs,
                            [song.type]: undefined,
                          };

                          const updatedSeasons = seasons.map((season) => ({
                            ...season,
                            animes: season.animes.map((a) =>
                              a.id === song.animeId
                                ? {
                                    ...a,
                                    songs: updatedSongs,
                                  }
                                : a
                            ),
                          }));

                          // Supabaseを更新（ログイン時のみ）
                          if (user && anime) {
                            try {
                              const { error } = await supabase
                                .from('animes')
                                .update({ songs: updatedSongs })
                                .eq('id', song.animeId)
                                .eq('user_id', user.id);

                              if (error) throw error;
                            } catch (error) {
                              console.error('Supabaseでの曲の削除に失敗しました:', error);
                            }
                          }

                          setSeasons(updatedSeasons);
                        }
                      }}
                      className="bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
                      {song.type.toUpperCase()}
                    </span>
                    <Heart className="w-5 h-5 fill-white text-white" aria-hidden />
                  </div>
                  <p className="font-bold text-sm mb-1">{song.title}</p>
                  <p className="text-xs text-white/80 mb-2">{song.artist}</p>
                  <p className="text-xs text-white/70">{song.animeTitle}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <StarRating rating={song.rating} size="text-sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 高評価TOP10 */}
      {filteredSongs.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">高評価 TOP10</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
            {topRatedSongs.length > 0 ? (
              topRatedSongs.map((song, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-3 border-b dark:border-gray-700 last:border-0"
                >
                  <span className="text-2xl font-black text-gray-300 dark:text-gray-600 w-8">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-sm dark:text-white">{song.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {song.artist} / {song.animeTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {song.type.toUpperCase()}
                    </span>
                    <StarRating rating={song.rating} size="text-sm" />
                    {song.isFavorite && (
                      <Heart className="w-4 h-4 fill-[#e879d4] text-[#e879d4]" aria-hidden />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                検索結果がありません
              </p>
            )}
          </div>
        </div>
      )}

      {/* よく聴くアーティスト */}
      <div>
        <h2 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">
          よく聴くアーティスト
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          {topArtists.length > 0 ? (
            topArtists.map(([artist, count], index) => (
              <button
                key={artist}
                onClick={() => {
                  setMusicFilterType('artist');
                  setSelectedArtistForFilter(artist);
                }}
                className="w-full flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-gray-300 dark:text-gray-600 w-6">
                    {index + 1}
                  </span>
                  <span className="font-bold dark:text-white">{artist}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{count}曲</span>
              </button>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              アーティストが登録されていません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
