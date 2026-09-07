'use client';

import type { Review, Anime, AnimeId } from '../../types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Spinner } from '../common/Spinner';
import { ReviewItem } from './reviews/ReviewItem';
import { useModeration } from '../../contexts/ModerationContext';

export interface AnimeReviewSectionProps {
  animeReviews: Review[];
  loadingReviews: boolean;
  reviewLoadError?: string | null;
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
  loadReviews: (animeId: AnimeId) => Promise<void>;
  setShowReviewModal: (show: boolean) => void;
}

export function AnimeReviewSection({
  animeReviews,
  loadingReviews,
  reviewLoadError,
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
  loadReviews,
  setShowReviewModal,
}: AnimeReviewSectionProps) {
  const { blockedIds } = useModeration();

  // フィルタリング
  const filteredReviews = animeReviews.filter((review) => {
    if (blockedIds.has(review.userId)) return false;
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
  const episodeReviews = filteredReviews.filter((r) => r.type === 'episode');
  const overallReviews = filteredReviews.filter((r) => r.type === 'overall');

  const episodeGroups = new Map<number, Review[]>();
  episodeReviews.forEach((review) => {
    if (review.episodeNumber) {
      if (!episodeGroups.has(review.episodeNumber)) {
        episodeGroups.set(review.episodeNumber, []);
      }
      episodeGroups.get(review.episodeNumber)!.push(review);
    }
  });

  return (
    <div className="space-y-4">
      {/* フィルタとソート */}
      <div className="flex gap-2 mb-4">
        <select
          value={reviewFilter}
          onChange={(e) => setReviewFilter(e.target.value as 'all' | 'overall' | 'episode')}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
        >
          <option value="all">すべて</option>
          <option value="overall">全体感想のみ</option>
          <option value="episode">話数感想のみ</option>
        </select>
        <select
          value={reviewSort}
          onChange={(e) => setReviewSort(e.target.value as 'newest' | 'likes' | 'helpful')}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
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
          className="w-4 h-4 accent-[#e879d4] rounded focus:ring-[#e879d4]"
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
      {reviewLoadError ? (
        <div role="alert" className="text-sm text-red-600">
          <p>{reviewLoadError}</p>
          <button onClick={() => void loadReviews(selectedAnime.id)} className="underline py-2">
            再試行
          </button>
        </div>
      ) : loadingReviews ? (
        <div className="flex items-center justify-center py-8">
          <Spinner label="読み込み中..." />
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {/* 全体感想 */}
          {overallReviews.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">全体感想</h4>
              <div className="space-y-3">
                {overallReviews.map((review) => (
                  <ReviewItem
                    key={review.id}
                    review={review}
                    {...{
                      expandedSpoilerReviews,
                      setExpandedSpoilerReviews,
                      user,
                      selectedAnime,
                      loadReviews,
                      setShowReviewModal,
                    }}
                  />
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
                        <ReviewItem
                          key={review.id}
                          review={review}
                          {...{
                            expandedSpoilerReviews,
                            setExpandedSpoilerReviews,
                            user,
                            selectedAnime,
                            loadReviews,
                            setShowReviewModal,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          {user
            ? 'まだ感想がありません。最初の感想を投稿してみましょう！'
            : 'ログインすると感想を投稿・閲覧できます'}
        </p>
      )}
    </div>
  );
}
