'use client';

import type { Review, Anime } from '../../types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AnimeReviewSectionProps {
  animeReviews: Review[];
  loadingReviews: boolean;
  reviewFilter: 'all' | 'overall' | 'episode';
  setReviewFilter: (filter: 'all' | 'overall' | 'episode') => void;
  reviewSort: 'newest' | 'likes' | 'helpful';
  setReviewSort: (sort: 'newest' | 'likes' | 'helpful') => void;
  userSpoilerHidden: boolean;
  setUserSpoilerHidden: (hidden: boolean) => void;
  expandedSpoilerReviews: Set<string>;
  setExpandedSpoilerReviews: (set: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  user: User | null;
  selectedAnime: Anime;
  supabase: SupabaseClient;
  loadReviews: (animeId: number) => Promise<void>;
  setShowReviewModal: (show: boolean) => void;
}

export function AnimeReviewSection({
  animeReviews,
  loadingReviews,
  reviewFilter,
  setReviewFilter,
  reviewSort,
  setReviewSort,
  userSpoilerHidden,
  setUserSpoilerHidden,
  expandedSpoilerReviews,
  setExpandedSpoilerReviews,
  user,
  selectedAnime,
  supabase,
  loadReviews,
  setShowReviewModal,
}: AnimeReviewSectionProps) {
  // フィルタリング
  const filteredReviews = animeReviews.filter(review => {
    if (reviewFilter === 'overall' && review.type !== 'overall') return false;
    if (reviewFilter === 'episode' && review.type !== 'episode') return false;
    if (userSpoilerHidden && review.containsSpoiler) return false;
    return true;
  });

  // ソート
  filteredReviews.sort((a, b) => {
    switch (reviewSort) {
      case 'likes':
        return b.likes - a.likes;
      case 'helpful':
        return b.helpfulCount - a.helpfulCount;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // 話数感想をエピソード別にグループ化
  const episodeReviews = filteredReviews.filter(r => r.type === 'episode');
  const overallReviews = filteredReviews.filter(r => r.type === 'overall');

  const episodeGroups = new Map<number, Review[]>();
  episodeReviews.forEach(review => {
    if (review.episodeNumber) {
      if (!episodeGroups.has(review.episodeNumber)) {
        episodeGroups.set(review.episodeNumber, []);
      }
      episodeGroups.get(review.episodeNumber)!.push(review);
    }
  });

  const ReviewItem = ({ review }: { review: Review }) => {
    const isExpanded = expandedSpoilerReviews.has(review.id);
    const shouldCollapse = review.containsSpoiler && !isExpanded;

    return (
      <div
        className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
          review.containsSpoiler ? 'border-l-4 border-yellow-500' : ''
        }`}
      >
        {/* ネタバレ警告 */}
        {review.containsSpoiler && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-2 rounded mb-2 flex items-center gap-2">
            <span>⚠️</span>
            <span>ネタバレを含む感想です</span>
          </div>
        )}

        {/* ユーザー情報 */}
        <div className="flex items-center gap-2 mb-2">
          {review.userIcon && (review.userIcon.startsWith('http://') || review.userIcon.startsWith('https://') || review.userIcon.startsWith('data:')) ? (
            <img
              src={review.userIcon}
              alt="アイコン"
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const span = document.createElement('span');
                  span.className = 'text-xl';
                  span.textContent = '👤';
                  parent.insertBefore(span, target);
                }
              }}
            />
          ) : (
            <span className="text-xl">{review.userIcon || '👤'}</span>
          )}
          <span className="font-bold text-sm dark:text-white">{review.userName}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
            {new Date(review.createdAt).toLocaleDateString('ja-JP')}
          </span>
        </div>

        {/* 感想本文（折りたたみ可能） */}
        {shouldCollapse ? (
          <button
            onClick={() => {
              const newSet = new Set(expandedSpoilerReviews);
              newSet.add(review.id);
              setExpandedSpoilerReviews(newSet);
            }}
            className="w-full text-left text-sm text-[#e879d4] dark:text-[#e879d4] hover:underline py-2"
          >
            ▶ クリックして展開
          </button>
        ) : (
          <>
            <p className="text-sm dark:text-white mb-3 whitespace-pre-wrap">{review.content}</p>
            {review.containsSpoiler && (
              <button
                onClick={() => {
                  const newSet = new Set(expandedSpoilerReviews);
                  newSet.delete(review.id);
                  setExpandedSpoilerReviews(newSet);
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
              >
                ▲ 折りたたむ
              </button>
            )}
          </>
        )}

        {/* いいね・役に立った */}
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={async () => {
              if (!user) return;

              try {
                const { data: animeData } = await supabase
                  .from('animes')
                  .select('id')
                  .eq('id', selectedAnime.id)
                  .eq('user_id', user.id)
                  .single();

                if (!animeData) return;

                if (review.userLiked) {
                  await supabase
                    .from('review_likes')
                    .delete()
                    .eq('review_id', review.id)
                    .eq('user_id', user.id);
                } else {
                  await supabase
                    .from('review_likes')
                    .insert({
                      review_id: review.id,
                      user_id: user.id,
                    });
                }

                loadReviews(selectedAnime.id);
              } catch (error) {
                console.error('Failed to toggle like:', error);
              }
            }}
            className={`flex items-center gap-1 text-sm ${
              review.userLiked
                ? 'text-red-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span>{review.userLiked ? '❤️' : '🤍'}</span>
            <span>{review.likes}</span>
          </button>
          <button
            onClick={async () => {
              if (!user) return;

              try {
                const { data: animeData } = await supabase
                  .from('animes')
                  .select('id')
                  .eq('id', selectedAnime.id)
                  .eq('user_id', user.id)
                  .single();

                if (!animeData) return;

                if (review.userHelpful) {
                  await supabase
                    .from('review_helpful')
                    .delete()
                    .eq('review_id', review.id)
                    .eq('user_id', user.id);
                } else {
                  await supabase
                    .from('review_helpful')
                    .insert({
                      review_id: review.id,
                      user_id: user.id,
                    });
                }

                loadReviews(selectedAnime.id);
              } catch (error) {
                console.error('Failed to toggle helpful:', error);
              }
            }}
            className={`flex items-center gap-1 text-sm ${
              review.userHelpful
                ? 'text-blue-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span>👍</span>
            <span>{review.helpfulCount}</span>
          </button>

          {/* 自分の感想の場合、編集・削除ボタン */}
          {user && review.userId === user.id && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(true);
                }}
                className="text-xs text-[#e879d4] dark:text-[#e879d4] hover:underline"
              >
                編集
              </button>
              <button
                onClick={async () => {
                  if (!confirm('この感想を削除しますか？')) return;

                  try {
                    await supabase
                      .from('reviews')
                      .delete()
                      .eq('id', review.id);

                    loadReviews(selectedAnime.id);
                  } catch (error) {
                    console.error('Failed to delete review:', error);
                  }
                }}
                className="text-xs text-red-500 hover:underline"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* フィルタとソート */}
      <div className="flex gap-2 mb-4">
        <select
          value={reviewFilter}
          onChange={(e) => setReviewFilter(e.target.value as 'all' | 'overall' | 'episode')}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
        >
          <option value="all">すべて</option>
          <option value="overall">全体感想のみ</option>
          <option value="episode">話数感想のみ</option>
        </select>
        <select
          value={reviewSort}
          onChange={(e) => setReviewSort(e.target.value as 'newest' | 'likes' | 'helpful')}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
        >
          <option value="newest">新着順</option>
          <option value="likes">いいね順</option>
          <option value="helpful">役に立った順</option>
        </select>
      </div>

      {/* ネタバレ非表示設定 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="spoilerHidden"
          checked={userSpoilerHidden}
          onChange={(e) => setUserSpoilerHidden(e.target.checked)}
          className="w-4 h-4 text-[#e879d4] rounded focus:ring-[#e879d4]"
        />
        <label htmlFor="spoilerHidden" className="text-sm text-gray-700 dark:text-gray-300">
          ネタバレを含む感想を非表示
        </label>
      </div>

      {/* 感想投稿ボタン */}
      {user && (
        <button
          onClick={() => {
            setShowReviewModal(true);
          }}
          className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors mb-4"
        >
          + 感想を投稿
        </button>
      )}

      {/* 感想一覧 */}
      {loadingReviews ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#e879d4]"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">読み込み中...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {/* 全体感想 */}
          {overallReviews.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">全体感想</h4>
              <div className="space-y-3">
                {overallReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* 話数感想（エピソード別にグループ化） */}
          {episodeGroups.size > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">話数感想</h4>
              {Array.from(episodeGroups.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([episodeNumber, reviews]) => (
                  <div key={episodeNumber} className="mb-4">
                    <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      第{episodeNumber}話の感想 ({reviews.length}件)
                    </h5>
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          {user ? 'まだ感想がありません。最初の感想を投稿してみましょう！' : 'ログインすると感想を投稿・閲覧できます'}
        </p>
      )}
    </div>
  );
}

