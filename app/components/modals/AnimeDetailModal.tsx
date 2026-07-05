'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Anime, AnimeId, Season, Review } from '../../types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { availableTags, ratingLabels } from '../../constants';
import { AnimeReviewSection } from './AnimeReviewSection';
import { updateAnimeInSeasons } from '../../utils/animeUpdates';
import { addToWatchlist } from '../../lib/api';
import { StreamingBadges } from '../common/StreamingBadges';
import { StreamingUpdateButton } from '../common/StreamingUpdateButton';
import { updateAnimeStreamingInfo } from '../../lib/api/streamingUpdate';
import { updateAnimeFields, deleteAnime } from '../../lib/api/animes';
import { AnimeSongsSection } from './anime-detail/AnimeSongsSection';
import { getOfficialSiteUrl, getAnimeDetail, type AniListMedia } from '../../lib/api/anilist';
import { ExternalLink, X, Film, Plus } from 'lucide-react';
import { logger } from '../../lib/logger';
import { normalizeError } from '../../lib/api/errors';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AnimeDetailModalProps {
  selectedAnime: Anime;
  setSelectedAnime: (anime: Anime | null) => void;
  seasons: Season[];
  setSeasons: (seasons: Season[] | ((prev: Season[]) => Season[])) => void;
  user: User | null;
  supabase: SupabaseClient;
  animeReviews: Review[];
  loadingReviews: boolean;
  loadReviews: (animeId: AnimeId) => Promise<void>;
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
}: AnimeDetailModalProps) {
  const [animeDetailTab, setAnimeDetailTab] = useState<'info' | 'reviews'>('info');
  const { showToast } = useFeedback();
  const [anilistDetail, setAnilistDetail] = useState<AniListMedia | null>(null);

  // 名言追加インラインフォーム
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteCharacter, setNewQuoteCharacter] = useState('');

  // Escキーでモーダルを閉じる
  useEscapeKey(() => setSelectedAnime(null));

  // AniList の作品 ID から詳細情報を取得（公式HPリンク用）。
  // 作品の同一性は anilistId で判断する（id は二重実態で、ログイン時は UUID 文字列のため
  // 数値比較では常に外れ、未ログイン時は合成 number が無関係な AniList 作品を誤取得し得た）。
  useEffect(() => {
    const anilistId = selectedAnime.anilistId;
    if (!anilistId) return; // 手動追加・旧データ（anilistId なし）は公式リンク非表示のまま
    getAnimeDetail(anilistId)
      .then((detail) => {
        if (detail) {
          setAnilistDetail(detail);
        }
      })
      .catch((error) => {
        const normalizedError = normalizeError(error);
        logger.error('AniList詳細情報の取得に失敗しました', normalizedError, 'AnimeDetailModal');
      });
  }, [selectedAnime.anilistId]);

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
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 右上の✖️ボタン（sticky） */}
        <div className="sticky top-2 z-10 flex justify-end mb-2">
          <button
            onClick={() => setSelectedAnime(null)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4 border-b dark:border-gray-700 pb-2">
          <button
            onClick={() => setAnimeDetailTab('info')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              animeDetailTab === 'info'
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            基本情報
          </button>
          <button
            onClick={() => setAnimeDetailTab('reviews')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              animeDetailTab === 'reviews'
                ? 'bg-[#e879d4] text-white'
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
                const isImageUrl =
                  selectedAnime.image &&
                  (selectedAnime.image.startsWith('http://') ||
                    selectedAnime.image.startsWith('https://'));
                return isImageUrl ? (
                  <div className="flex justify-center mb-3">
                    <div className="relative w-32 h-44">
                      <Image
                        src={selectedAnime.image}
                        alt={selectedAnime.title}
                        width={128}
                        height={176}
                        className="object-cover rounded-xl shadow-lg"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<span class="text-6xl">🎬</span>';
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : selectedAnime.image ? (
                  <span className="text-6xl block mb-3">{selectedAnime.image}</span>
                ) : (
                  <Film
                    className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500"
                    aria-hidden
                  />
                );
              })()}
              <h3 className="text-xl font-bold mt-2 dark:text-white">{selectedAnime.title}</h3>
            </div>

            {/* 評価ボタン */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
                評価を選択
              </p>
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={async () => {
                      await handleUpdateAnime(
                        (anime) => ({ ...anime, rating }),
                        async (anime) => {
                          await updateAnimeFields(anime.id, user!.id, { rating });
                        }
                      );
                    }}
                    className={`text-3xl transition-all hover:scale-110 active:scale-95 ${
                      selectedAnime.rating >= rating
                        ? 'text-[#ffd700] drop-shadow-sm'
                        : 'text-gray-400 dark:text-gray-500 opacity-50 hover:opacity-80'
                    }`}
                    style={
                      selectedAnime.rating >= rating
                        ? {}
                        : {
                            textShadow: '0 0 1px rgba(0,0,0,0.2)',
                          }
                    }
                    title={`${rating}つ星`}
                  >
                    {selectedAnime.rating >= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              {selectedAnime.rating > 0 ? (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  {ratingLabels[selectedAnime.rating]?.emoji}{' '}
                  {ratingLabels[selectedAnime.rating]?.label}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-2">
                  評価を選択してください
                </p>
              )}
            </div>

            {/* 周回数編集 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
                周回数
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    const currentCount = selectedAnime.rewatchCount ?? 0;
                    const newCount = Math.max(0, currentCount - 1);
                    await handleUpdateAnime(
                      (anime) => ({ ...anime, rewatchCount: newCount }),
                      async (anime) => {
                        await updateAnimeFields(anime.id, user!.id, { rewatch_count: newCount });
                      }
                    );
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  disabled={(selectedAnime.rewatchCount ?? 0) <= 0}
                >
                  -
                </button>
                <span className="text-2xl font-bold dark:text-white min-w-[60px] text-center">
                  {selectedAnime.rewatchCount ?? 0}周
                </span>
                <button
                  onClick={async () => {
                    const currentCount = selectedAnime.rewatchCount ?? 0;
                    const newCount = Math.min(99, currentCount + 1);
                    await handleUpdateAnime(
                      (anime) => ({ ...anime, rewatchCount: newCount }),
                      async (anime) => {
                        await updateAnimeFields(anime.id, user!.id, { rewatch_count: newCount });
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

            {/* 配信サービス */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium flex-1">
                  配信サービス
                </p>
                {user && (
                  <StreamingUpdateButton
                    onUpdate={async () => {
                      if (!user) return;
                      const result = await updateAnimeStreamingInfo(
                        selectedAnime.id,
                        selectedAnime.title
                      );
                      if (result.success && result.streamingSites) {
                        // アニメ情報を更新
                        await handleUpdateAnime(
                          (anime) => ({
                            ...anime,
                            streamingSites: result.streamingSites,
                            streamingUpdatedAt: new Date().toISOString(),
                          }),
                          async (anime) => {
                            await updateAnimeFields(anime.id, user.id, {
                              streaming_sites: result.streamingSites,
                              streaming_updated_at: new Date().toISOString(),
                            });
                          }
                        );
                      } else if (result.error) {
                        throw new Error(result.error);
                      }
                    }}
                    lastUpdated={
                      selectedAnime.streamingUpdatedAt ||
                      selectedAnime.streaming_updated_at ||
                      undefined
                    }
                    size="sm"
                  />
                )}
              </div>
              {selectedAnime.streamingSites && selectedAnime.streamingSites.length > 0 ? (
                <div className="flex justify-center">
                  <StreamingBadges services={selectedAnime.streamingSites} maxDisplay={5} />
                </div>
              ) : (
                // デバッグ用（開発環境のみ）
                process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-400 text-center">
                    {/* デバッグ: streamingSites = {JSON.stringify(selectedAnime.streamingSites)} */}
                  </div>
                )
              )}
            </div>

            {/* タグ選択 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
                タグ
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableTags.map((tag) => {
                  const isSelected = selectedAnime.tags?.includes(tag.value) ?? false;
                  return (
                    <button
                      key={tag.value}
                      onClick={async () => {
                        const currentTags = selectedAnime.tags ?? [];
                        const newTags = isSelected
                          ? currentTags.filter((t) => t !== tag.value)
                          : [...currentTags, tag.value];
                        await handleUpdateAnime(
                          (anime) => ({ ...anime, tags: newTags }),
                          async (anime) => {
                            await updateAnimeFields(anime.id, user!.id, { tags: newTags });
                          }
                        );
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[#e879d4] text-white dark:bg-indigo-500 shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* シリーズ名編集 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
                シリーズ名
              </p>
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
                        await updateAnimeFields(anime.id, user!.id, { series_name: newSeriesName });
                      }
                    );
                  }}
                  placeholder="シリーズ名を入力（任意）"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
                />
                {selectedAnime.seriesName && (
                  <button
                    onClick={async () => {
                      await handleUpdateAnime(
                        (anime) => ({ ...anime, seriesName: undefined }),
                        async (anime) => {
                          await updateAnimeFields(anime.id, user!.id, { series_name: null });
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

            <AnimeSongsSection
              selectedAnime={selectedAnime}
              user={user}
              handleUpdateAnime={handleUpdateAnime}
              setShowSongModal={setShowSongModal}
            />

            {/* 公式サイトリンク */}
            {anilistDetail &&
              (() => {
                const officialSiteUrl = getOfficialSiteUrl(anilistDetail);
                return officialSiteUrl ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
                      公式サイト
                    </p>
                    <div className="flex justify-center">
                      <a
                        href={officialSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        公式サイト
                      </a>
                    </div>
                  </div>
                ) : null;
              })()}

            {/* 名言 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">名言</p>
                <button
                  onClick={() => setIsAddingQuote((v) => !v)}
                  className="text-xs bg-[#e879d4] text-white px-3 py-1 rounded-lg hover:bg-[#f09fe3] transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                  名言を追加
                </button>
              </div>

              {/* 名言追加インラインフォーム */}
              {isAddingQuote && (
                <div className="mb-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                  <textarea
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    placeholder="セリフを入力"
                    rows={2}
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-800 dark:text-white resize-none"
                  />
                  <input
                    type="text"
                    value={newQuoteCharacter}
                    onChange={(e) => setNewQuoteCharacter(e.target.value)}
                    placeholder="キャラクター名（任意）"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-800 dark:text-white"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsAddingQuote(false);
                        setNewQuoteText('');
                        setNewQuoteCharacter('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={async () => {
                        if (!newQuoteText.trim()) return;
                        const newQuotes = [
                          ...(selectedAnime.quotes || []),
                          {
                            text: newQuoteText.trim(),
                            character: newQuoteCharacter.trim() || undefined,
                          },
                        ];
                        await handleUpdateAnime(
                          (anime) => ({ ...anime, quotes: newQuotes }),
                          async (anime) => {
                            await updateAnimeFields(anime.id, user!.id, { quotes: newQuotes });
                          }
                        );
                        setNewQuoteText('');
                        setNewQuoteCharacter('');
                        setIsAddingQuote(false);
                        showToast('名言を追加しました');
                      }}
                      disabled={!newQuoteText.trim()}
                      className="px-3 py-1.5 text-xs font-bold bg-[#e879d4] text-white rounded-lg hover:bg-[#d45dbf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      追加
                    </button>
                  </div>
                </div>
              )}

              {selectedAnime.quotes && selectedAnime.quotes.length > 0 ? (
                <div className="space-y-2">
                  {selectedAnime.quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-[#e879d4] relative"
                    >
                      <p className="text-sm dark:text-white mb-1">「{quote.text}」</p>
                      {quote.character && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          — {quote.character}
                        </p>
                      )}
                      <button
                        onClick={async () => {
                          const updatedQuotes =
                            selectedAnime.quotes?.filter((_, i) => i !== index) || [];
                          await handleUpdateAnime(
                            (anime) => ({ ...anime, quotes: updatedQuotes }),
                            async (anime) => {
                              await updateAnimeFields(anime.id, user!.id, {
                                quotes: updatedQuotes,
                              });
                            }
                          );
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  名言が登録されていません
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!user) {
                      showToast('ログインが必要です', 'error');
                      return;
                    }

                    // アニメを積みアニメに追加（AniList IDはないので、タイトルと画像で追加）
                    // AniList IDは後で検索できるように、-1を設定（AniList ID未設定のマーカー）
                    try {
                      await addToWatchlist({
                        anilist_id: -1, // AniList ID未設定のマーカー
                        title: selectedAnime.title,
                        image: selectedAnime.image || null,
                      });
                      showToast('積みアニメに追加しました');
                    } catch (error) {
                      const normalizedError = normalizeError(error);
                      logger.error(
                        '積みアニメの追加に失敗しました',
                        normalizedError,
                        'AnimeDetailModal'
                      );
                      showToast('積みアニメの追加に失敗しました', 'error');
                    }
                  }}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  積みアニメに移動
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    // Supabaseから削除（ログイン時のみ）
                    if (user) {
                      try {
                        const isLocalId =
                          typeof selectedAnime.id === 'number' && selectedAnime.id > 1000000;
                        if (!isLocalId) {
                          await deleteAnime(selectedAnime.id, user.id);
                        }
                      } catch (error) {
                        const normalizedError = normalizeError(error);
                        logger.error(
                          'Supabaseからのアニメ削除に失敗しました',
                          normalizedError,
                          'AnimeDetailModal'
                        );
                      }
                    }

                    const updatedSeasons = seasons.map((season) => ({
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
              </div>
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
