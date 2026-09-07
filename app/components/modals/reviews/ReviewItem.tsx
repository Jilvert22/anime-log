'use client';
import { useRef, useState } from 'react';
import { Heart, UserRound, AlertTriangle, ChevronRight } from 'lucide-react';
import type { Review } from '../../../types';
import type { AnimeReviewSectionProps } from '../AnimeReviewSection';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { UserContentBoundary } from '../../../contexts/ModerationContext';
import { ContentActions } from '../../moderation/ContentActions';
import { setReviewReaction, deleteReview } from '../../../lib/api/reviews';
export function ReviewItem({
  review,
  expandedSpoilerReviews,
  setExpandedSpoilerReviews,
  user,
  selectedAnime,
  loadReviews,
  setShowReviewModal,
}: Pick<
  AnimeReviewSectionProps,
  | 'expandedSpoilerReviews'
  | 'setExpandedSpoilerReviews'
  | 'user'
  | 'selectedAnime'
  | 'loadReviews'
  | 'setShowReviewModal'
> & { review: Review }) {
  const { confirmDialog, showToast } = useFeedback();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  async function react(kind: 'like' | 'helpful', active: boolean) {
    if (!user || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await setReviewReaction(review.id, kind, active, user.id);
      await loadReviews(selectedAnime.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存できませんでした', 'error');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const isExpanded = expandedSpoilerReviews.has(review.id);
  const shouldCollapse = review.containsSpoiler && !isExpanded;

  return (
    <UserContentBoundary userId={review.userId}>
      <div
        className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
          review.containsSpoiler ? 'border-l-4 border-yellow-500' : ''
        }`}
      >
        {/* ネタバレ警告 */}
        {review.containsSpoiler && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-2 rounded mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
            <span>ネタバレを含む感想です</span>
          </div>
        )}

        {/* ユーザー情報 */}
        <div className="flex items-center gap-2 mb-2">
          {review.userIcon &&
          (review.userIcon.startsWith('http://') ||
            review.userIcon.startsWith('https://') ||
            review.userIcon.startsWith('data:')) ? (
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
                  span.textContent = '👤'; // DOM直接操作のonErrorフォールバック(React外のためアイコン化対象外)
                  parent.insertBefore(span, target);
                }
              }}
            />
          ) : review.userIcon ? (
            <span className="text-xl">{review.userIcon}</span>
          ) : (
            <UserRound className="w-6 h-6 text-gray-400" aria-hidden />
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
            <span className="inline-flex items-center gap-1">
              <ChevronRight className="w-4 h-4" aria-hidden />
              クリックして展開
            </span>
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
            disabled={busy || !user}
            onClick={() => void react('like', !review.userLiked)}
            className={`flex items-center gap-1 text-sm ${
              review.userLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${review.userLiked ? 'fill-current' : ''}`} aria-hidden />
            <span>{review.likes}</span>
          </button>
          <button
            disabled={busy || !user}
            onClick={() => void react('helpful', !review.userHelpful)}
            className={`flex items-center gap-1 text-sm ${
              review.userHelpful ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
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
                  if (
                    !(await confirmDialog({
                      message: 'この感想を削除しますか？',
                      danger: true,
                      confirmLabel: '削除',
                    }))
                  )
                    return;

                  try {
                    await deleteReview(review.id, user.id);

                    loadReviews(selectedAnime.id);
                  } catch (error) {
                    showToast(
                      error instanceof Error ? error.message : '削除できませんでした',
                      'error'
                    );
                  }
                }}
                className="text-xs text-red-500 hover:underline"
              >
                削除
              </button>
            </div>
          )}
        </div>
        <ContentActions userId={review.userId} userName={review.userName} reviewId={review.id} />
      </div>
    </UserContentBoundary>
  );
}
