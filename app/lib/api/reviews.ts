'use client';
import { supabase } from '../supabase';
import { requireAuth } from './auth';
import { getAnimeRowId } from './animes';
import { SupabaseError, ValidationError, AuthenticationError } from './errors';
import { INPUT_LIMITS, validateLength, throwIfInvalid } from '../validation';
import type { Anime, AnimeId, Review } from '../../types';
export async function getAnimeReviews(animeId: AnimeId, user: { id: string }): Promise<Review[]> {
  const animeUuid = await getAnimeRowId(animeId, user.id);
  if (!animeUuid) return [];
  // レビューを取得
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('anime_id', animeUuid)
    .order('created_at', { ascending: false });

  if (reviewsError)
    throw new SupabaseError('感想を取得できませんでした', reviewsError.code, reviewsError);

  // 現在のユーザーがいいね/役に立ったを押したか確認
  if (reviewsData && reviewsData.length > 0) {
    const reviewIds = reviewsData.map((r) => r.id);

    // いいね情報を取得
    const { data: likesData, error: likesError } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds)
      .eq('user_id', user.id);

    // 役に立った情報を取得
    const { data: helpfulData, error: helpfulError } = await supabase
      .from('review_helpful')
      .select('review_id')
      .in('review_id', reviewIds)
      .eq('user_id', user.id);

    if (likesError || helpfulError)
      throw new SupabaseError(
        'リアクションを取得できませんでした',
        (likesError || helpfulError)?.code,
        likesError || helpfulError
      );
    const likedReviewIds = new Set(likesData?.map((l) => l.review_id) || []);
    const helpfulReviewIds = new Set(helpfulData?.map((h) => h.review_id) || []);

    const reviews: Review[] = reviewsData.map((r) => ({
      id: r.id,
      animeId: animeId,
      userId: r.user_id,
      userName: r.user_name,
      userIcon: r.user_icon,
      type: r.type as 'overall' | 'episode',
      episodeNumber: r.episode_number || undefined,
      content: r.content,
      containsSpoiler: r.contains_spoiler,
      spoilerHidden: r.spoiler_hidden,
      likes: r.likes || 0,
      helpfulCount: r.helpful_count || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userLiked: likedReviewIds.has(r.id),
      userHelpful: helpfulReviewIds.has(r.id),
    }));

    return reviews;
  } else {
    return [];
  }
}

export async function setReviewReaction(
  reviewId: string,
  kind: 'like' | 'helpful',
  active: boolean,
  expectedOwner: string
): Promise<void> {
  const user = await requireAuth();
  if (user.id !== expectedOwner)
    throw new AuthenticationError('アカウントが変わりました。再読み込みしてください');
  const table = kind === 'like' ? 'review_likes' : 'review_helpful';
  const { error } = active
    ? await supabase.from(table).insert({ review_id: reviewId, user_id: user.id })
    : await supabase.from(table).delete().eq('review_id', reviewId).eq('user_id', user.id);
  if (error) throw new SupabaseError('リアクションを保存できませんでした', error.code, error);
}
export async function deleteReview(reviewId: string, expectedOwner: string): Promise<void> {
  const user = await requireAuth();
  if (user.id !== expectedOwner)
    throw new AuthenticationError('アカウントが変わりました。再読み込みしてください');
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id);
  if (error) throw new SupabaseError('感想を削除できませんでした', error.code, error);
}
export async function createReview(input: {
  anime: Anime;
  expectedOwner: string;
  userName: string;
  userIcon: string | null;
  type: 'overall' | 'episode';
  episode?: number;
  content: string;
  containsSpoiler: boolean;
}): Promise<void> {
  throwIfInvalid(validateLength(input.content, '感想', INPUT_LIMITS.reviewContent));
  if (
    !input.content.trim() ||
    (input.type === 'episode' &&
      (!Number.isSafeInteger(input.episode) || input.episode! < 1 || input.episode! > 2147483647))
  )
    throw new ValidationError('感想と正しい話数を入力してください');
  const user = await requireAuth();
  if (user.id !== input.expectedOwner)
    throw new AuthenticationError('アカウントが変わりました。再読み込みしてください');
  const animeUuid = await getAnimeRowId(input.anime.id, user.id);
  if (!animeUuid) throw new ValidationError('作品を保存してから感想を投稿してください');
  const { error } = await supabase.from('reviews').insert({
    anime_id: animeUuid,
    anilist_id: input.anime.anilistId ?? null,
    anime_title: input.anime.title,
    user_id: user.id,
    user_name: input.userName,
    user_icon: input.userIcon,
    type: input.type,
    episode_number: input.type === 'episode' ? input.episode : null,
    content: input.content.trim(),
    contains_spoiler: input.containsSpoiler,
  });
  if (error) throw new SupabaseError('感想を投稿できませんでした', error.code, error);
}
