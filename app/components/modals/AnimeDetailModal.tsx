'use client';

import { useState } from 'react';
import type { Anime, Season, Review } from '../../types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { availableTags, ratingLabels } from '../../constants';
import { AnimeReviewSection } from './AnimeReviewSection';
import { updateAnimeInSeasons } from '../../utils/animeUpdates';

interface AnimeDetailModalProps {
  selectedAnime: Anime;
  setSelectedAnime: (anime: Anime | null) => void;
  seasons: Season[];
  setSeasons: (seasons: Season[] | ((prev: Season[]) => Season[])) => void;
  user: User | null;
  supabase: SupabaseClient;
  animeReviews: Review[];
  loadingReviews: boolean;
  loadReviews: (animeId: number) => Promise<void>;
  reviewFilter: 'all' | 'overall' | 'episode';
  setReviewFilter: (filter: 'all' | 'overall' | 'episode') => void;
  reviewSort: 'newest' | 'likes' | 'helpful';
  setReviewSort: (sort: 'newest' | 'likes' | 'helpful') => void;
  userSpoilerHidden: boolean;
  setUserSpoilerHidden: (hidden: boolean) => void;
  expandedSpoilerReviews: Set<string>;
  setExpandedSpoilerReviews: (set: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setShowReviewModal: (show: boolean) => void;
  setShowSongModal: (show: boolean) => void;
  setSongType: (type: 'op' | 'ed' | null) => void;
  setNewSongTitle: (title: string) => void;
  setNewSongArtist: (artist: string) => void;
}

export function AnimeDetailModal({
  selectedAnime,
  setSelectedAnime,
  seasons,
  setSeasons,
  user,
  supabase,
  animeReviews,
  loadingReviews,
  loadReviews,
  reviewFilter,
  setReviewFilter,
  reviewSort,
  setReviewSort,
  userSpoilerHidden,
  setUserSpoilerHidden,
  expandedSpoilerReviews,
  setExpandedSpoilerReviews,
  setShowReviewModal,
  setShowSongModal,
  setSongType,
  setNewSongTitle,
  setNewSongArtist,
}: AnimeDetailModalProps) {
  const [animeDetailTab, setAnimeDetailTab] = useState<'info' | 'reviews'>('info');

  const handleUpdateAnime = async (
    updater: (anime: Anime) => Anime,
    supabaseUpdater?: (anime: Anime) => Promise<void>
  ) => {
    const { updatedSeasons, updatedAnime } = await updateAnimeInSeasons(
      selectedAnime.id,
      seasons,
      updater,
      user,
      supabase,
      supabaseUpdater
    );

    setSeasons(updatedSeasons);
    if (updatedAnime) {
      setSelectedAnime(updatedAnime);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedAnime(null)}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4 border-b dark:border-gray-700 pb-2">
          <button
            onClick={() => setAnimeDetailTab('info')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              animeDetailTab === 'info'
                ? 'bg-[#ffc2d1] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            基本情報
          </button>
          <button
            onClick={() => setAnimeDetailTab('reviews')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              animeDetailTab === 'reviews'
                ? 'bg-[#ffc2d1] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            感想
          </button>
        </div>

        {/* 基本情報タブ */}
        {animeDetailTab === 'info' && (
          <>
            <div className="text-center mb-4">
              {(() => {
                const isImageUrl = selectedAnime.image && (selectedAnime.image.startsWith('http://') || selectedAnime.image.startsWith('https://'));
                return isImageUrl ? (
                  <div className="flex justify-center mb-3">
                    <img
                      src={selectedAnime.image}
                      alt={selectedAnime.title}
                      className="w-32 h-44 object-cover rounded-xl shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-6xl">🎬</span>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-6xl block mb-3">{selectedAnime.image || '🎬'}</span>
                );
              })()}
              <h3 className="text-xl font-bold mt-2 dark:text-white">{selectedAnime.title}</h3>
            </div>

            {/* 評価ボタン */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">評価を選択</p>
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={async () => {
                      await handleUpdateAnime(
                        (anime) => ({ ...anime, rating }),
                        async (anime) => {
                          const { error } = await supabase
                            .from('animes')
                            .update({ rating })
                            .eq('id', anime.id)
                            .eq('user_id', user!.id);
                          if (error) throw error;
                        }
                      );
                    }}
                    className={`text-3xl transition-all hover:scale-110 active:scale-95 ${
                      selectedAnime.rating >= rating
                        ? 'text-[#ffd966] drop-shadow-sm'
                        : 'text-gray-300 opacity-30 hover:opacity-50'
                    }`}
                    title={`${rating}つ星`}
                  >
                    {selectedAnime.rating >= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              {selectedAnime.rating > 0 ? (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  {ratingLabels[selectedAnime.rating]?.emoji} {ratingLabels[selectedAnime.rating]?.label}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-2">
                  評価を選択してください
                </p>
              )}
            </div>

            {/* 周回数編集 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">周回数</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    const currentCount = selectedAnime.rewatchCount ?? 0;
                    const newCount = Math.max(0, currentCount - 1);
                    await handleUpdateAnime(
                      (anime) => ({ ...anime, rewatchCount: newCount }),
                      async (anime) => {
                        const { error } = await supabase
                          .from('animes')
                          .update({ rewatch_count: newCount })
                          .eq('id', anime.id)
                          .eq('user_id', user!.id);
                        if (error) throw error;
                      }
                    );
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  disabled={(selectedAnime.rewatchCount ?? 0) <= 0}
                >
                  -
                </button>
                <span className="text-2xl font-bold dark:text-white min-w-[60px] text-center">
                  {(selectedAnime.rewatchCount ?? 0)}周
                </span>
                <button
                  onClick={async () => {
                    const currentCount = selectedAnime.rewatchCount ?? 0;
                    const newCount = Math.min(99, currentCount + 1);
                    await handleUpdateAnime(
                      (anime) => ({ ...anime, rewatchCount: newCount }),
                      async (anime) => {
                        const { error } = await supabase
                          .from('animes')
                          .update({ rewatch_count: newCount })
                          .eq('id', anime.id)
                          .eq('user_id', user!.id);
                        if (error) throw error;
                      }
                    );
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  disabled={(selectedAnime.rewatchCount ?? 0) >= 99}
                >
                  +
                </button>
              </div>
            </div>

            {/* タグ選択 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">タグ</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableTags.map((tag) => {
                  const isSelected = selectedAnime.tags?.includes(tag.value) ?? false;
                  return (
                    <button
                      key={tag.value}
                      onClick={async () => {
                        const currentTags = selectedAnime.tags ?? [];
                        const newTags = isSelected
                          ? currentTags.filter(t => t !== tag.value)
                          : [...currentTags, tag.value];
                        await handleUpdateAnime(
                          (anime) => ({ ...anime, tags: newTags }),
                          async (anime) => {
                            const { error } = await supabase
                              .from('animes')
                              .update({ tags: newTags })
                              .eq('id', anime.id)
                              .eq('user_id', user!.id);
                            if (error) throw error;
                          }
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#ffc2d1] text-white dark:bg-indigo-500'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* シリーズ名編集 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">シリーズ名</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedAnime.seriesName || ''}
                  onChange={(e) => {
                    const newSeriesName = e.target.value.trim() || undefined;
                    setSelectedAnime({ ...selectedAnime, seriesName: newSeriesName });
                  }}
                  onBlur={async () => {
                    const newSeriesName = selectedAnime.seriesName?.trim() || undefined;
                    await handleUpdateAnime(
                      (anime) => ({ ...anime, seriesName: newSeriesName }),
                      async (anime) => {
                        const { error } = await supabase
                          .from('animes')
                          .update({ series_name: newSeriesName })
                          .eq('id', anime.id)
                          .eq('user_id', user!.id);
                        if (error) throw error;
                      }
                    );
                  }}
                  placeholder="シリーズ名を入力（任意）"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white text-sm"
                />
                {selectedAnime.seriesName && (
                  <button
                    onClick={async () => {
                      await handleUpdateAnime(
                        (anime) => ({ ...anime, seriesName: undefined }),
                        async (anime) => {
                          const { error } = await supabase
                            .from('animes')
                            .update({ series_name: null })
                            .eq('id', anime.id)
                            .eq('user_id', user!.id);
                          if (error) throw error;
                        }
                      );
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                同じシリーズ名を持つアニメがグループ化されます
              </p>
            </div>

            {/* 主題歌セクション - 簡略化版（完全版は後で追加） */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center font-medium">主題歌</p>
              {/* OP */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">OP</p>
                  {!selectedAnime.songs?.op && (
                    <button
                      onClick={() => {
                        setSongType('op');
                        setNewSongTitle('');
                        setNewSongArtist('');
                        setShowSongModal(true);
                      }}
                      className="text-xs bg-[#ffc2d1] text-white px-3 py-1 rounded-lg hover:bg-[#ffb07c] transition-colors"
                    >
                      + 登録
                    </button>
                  )}
                </div>
                {selectedAnime.songs?.op && (
                  <div className="bg-linear-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{selectedAnime.songs.op.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedAnime.songs.op.artist}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await handleUpdateAnime(
                            (anime) => ({
                              ...anime,
                              songs: {
                                ...anime.songs,
                                op: anime.songs?.op
                                  ? { ...anime.songs.op, isFavorite: !anime.songs.op.isFavorite }
                                  : undefined,
                              },
                            }),
                            async (anime) => {
                              if (anime.songs?.op) {
                                const updatedSongs = {
                                  ...anime.songs,
                                  op: { ...anime.songs.op, isFavorite: !anime.songs.op.isFavorite },
                                };
                                const { error } = await supabase
                                  .from('animes')
                                  .update({ songs: updatedSongs })
                                  .eq('id', anime.id)
                                  .eq('user_id', user!.id);
                                if (error) throw error;
                              }
                            }
                          );
                        }}
                        className="text-xl"
                      >
                        {selectedAnime.songs.op.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={async () => {
                            await handleUpdateAnime(
                              (anime) => ({
                                ...anime,
                                songs: {
                                  ...anime.songs,
                                  op: anime.songs?.op
                                    ? { ...anime.songs.op, rating }
                                    : undefined,
                                },
                              }),
                              async (anime) => {
                                if (anime.songs?.op) {
                                  const updatedSongs = {
                                    ...anime.songs,
                                    op: { ...anime.songs.op, rating },
                                  };
                                  const { error } = await supabase
                                    .from('animes')
                                    .update({ songs: updatedSongs })
                                    .eq('id', anime.id)
                                    .eq('user_id', user!.id);
                                  if (error) throw error;
                                }
                              }
                            );
                          }}
                          className={`text-sm ${
                            (selectedAnime.songs?.op?.rating ?? 0) >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        await handleUpdateAnime(
                          (anime) => ({
                            ...anime,
                            songs: {
                              ...anime.songs,
                              op: undefined,
                            },
                          }),
                          async (anime) => {
                            const updatedSongs = {
                              ...anime.songs,
                              op: undefined,
                            };
                            const { error } = await supabase
                              .from('animes')
                              .update({ songs: updatedSongs })
                              .eq('id', anime.id)
                              .eq('user_id', user!.id);
                            if (error) throw error;
                          }
                        );
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>

              {/* ED */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ED</p>
                  {!selectedAnime.songs?.ed && (
                    <button
                      onClick={() => {
                        setSongType('ed');
                        setNewSongTitle('');
                        setNewSongArtist('');
                        setShowSongModal(true);
                      }}
                      className="text-xs bg-[#ffc2d1] text-white px-3 py-1 rounded-lg hover:bg-[#ffb07c] transition-colors"
                    >
                      + 登録
                    </button>
                  )}
                </div>
                {selectedAnime.songs?.ed && (
                  <div className="bg-linear-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{selectedAnime.songs.ed.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedAnime.songs.ed.artist}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await handleUpdateAnime(
                            (anime) => ({
                              ...anime,
                              songs: {
                                ...anime.songs,
                                ed: anime.songs?.ed
                                  ? { ...anime.songs.ed, isFavorite: !anime.songs.ed.isFavorite }
                                  : undefined,
                              },
                            }),
                            async (anime) => {
                              if (anime.songs?.ed) {
                                const updatedSongs = {
                                  ...anime.songs,
                                  ed: { ...anime.songs.ed, isFavorite: !anime.songs.ed.isFavorite },
                                };
                                const { error } = await supabase
                                  .from('animes')
                                  .update({ songs: updatedSongs })
                                  .eq('id', anime.id)
                                  .eq('user_id', user!.id);
                                if (error) throw error;
                              }
                            }
                          );
                        }}
                        className="text-xl"
                      >
                        {selectedAnime.songs.ed.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={async () => {
                            await handleUpdateAnime(
                              (anime) => ({
                                ...anime,
                                songs: {
                                  ...anime.songs,
                                  ed: anime.songs?.ed
                                    ? { ...anime.songs.ed, rating }
                                    : undefined,
                                },
                              }),
                              async (anime) => {
                                if (anime.songs?.ed) {
                                  const updatedSongs = {
                                    ...anime.songs,
                                    ed: { ...anime.songs.ed, rating },
                                  };
                                  const { error } = await supabase
                                    .from('animes')
                                    .update({ songs: updatedSongs })
                                    .eq('id', anime.id)
                                    .eq('user_id', user!.id);
                                  if (error) throw error;
                                }
                              }
                            );
                          }}
                          className={`text-sm ${
                            (selectedAnime.songs?.ed?.rating ?? 0) >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        await handleUpdateAnime(
                          (anime) => ({
                            ...anime,
                            songs: {
                              ...anime.songs,
                              ed: undefined,
                            },
                          }),
                          async (anime) => {
                            const updatedSongs = {
                              ...anime.songs,
                              ed: undefined,
                            };
                            const { error } = await supabase
                              .from('animes')
                              .update({ songs: updatedSongs })
                              .eq('id', anime.id)
                              .eq('user_id', user!.id);
                            if (error) throw error;
                          }
                        );
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 名言 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">名言</p>
                <button
                  onClick={async () => {
                    const newQuoteText = prompt('セリフを入力してください:');
                    if (newQuoteText) {
                      const newQuoteCharacter = prompt('キャラクター名（任意）:') || undefined;
                      const newQuotes = [...(selectedAnime.quotes || []), { text: newQuoteText, character: newQuoteCharacter }];
                      await handleUpdateAnime(
                        (anime) => ({ ...anime, quotes: newQuotes }),
                        async (anime) => {
                          const { error } = await supabase
                            .from('animes')
                            .update({ quotes: newQuotes })
                            .eq('id', anime.id)
                            .eq('user_id', user!.id);
                          if (error) throw error;
                        }
                      );
                    }
                  }}
                  className="text-xs bg-[#ffc2d1] text-white px-3 py-1 rounded-lg hover:bg-[#ffb07c] transition-colors"
                >
                  + 名言を追加
                </button>
              </div>

              {selectedAnime.quotes && selectedAnime.quotes.length > 0 ? (
                <div className="space-y-2">
                  {selectedAnime.quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-[#ffc2d1]-500 relative"
                    >
                      <p className="text-sm dark:text-white mb-1">「{quote.text}」</p>
                      {quote.character && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">— {quote.character}</p>
                      )}
                      <button
                        onClick={async () => {
                          const updatedQuotes = selectedAnime.quotes?.filter((_, i) => i !== index) || [];
                          await handleUpdateAnime(
                            (anime) => ({ ...anime, quotes: updatedQuotes }),
                            async (anime) => {
                              const { error } = await supabase
                                .from('animes')
                                .update({ quotes: updatedQuotes })
                                .eq('id', anime.id)
                                .eq('user_id', user!.id);
                              if (error) throw error;
                            }
                          );
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">名言が登録されていません</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Supabaseから削除（ログイン時のみ）
                  if (user) {
                    try {
                      const isLocalId = selectedAnime.id > 1000000;
                      if (!isLocalId) {
                        const { error } = await supabase
                          .from('animes')
                          .delete()
                          .eq('id', selectedAnime.id)
                          .eq('user_id', user.id);
                        if (error) throw error;
                      }
                    } catch (error) {
                      console.error('Failed to delete anime from Supabase:', error);
                    }
                  }

                  const updatedSeasons = seasons.map(season => ({
                    ...season,
                    animes: season.animes.filter((anime) => anime.id !== selectedAnime.id),
                  }));
                  setSeasons(updatedSeasons);
                  setSelectedAnime(null);
                }}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                削除
              </button>
              <button
                onClick={() => setSelectedAnime(null)}
                className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors"
              >
                閉じる
              </button>
            </div>
          </>
        )}

        {/* 感想タブ */}
        {animeDetailTab === 'reviews' && (
          <AnimeReviewSection
            animeReviews={animeReviews}
            loadingReviews={loadingReviews}
            reviewFilter={reviewFilter}
            setReviewFilter={setReviewFilter}
            reviewSort={reviewSort}
            setReviewSort={setReviewSort}
            userSpoilerHidden={userSpoilerHidden}
            setUserSpoilerHidden={setUserSpoilerHidden}
            expandedSpoilerReviews={expandedSpoilerReviews}
            setExpandedSpoilerReviews={setExpandedSpoilerReviews}
            user={user}
            selectedAnime={selectedAnime}
            supabase={supabase}
            loadReviews={loadReviews}
            setShowReviewModal={setShowReviewModal}
          />
        )}
      </div>
    </div>
  );
}

