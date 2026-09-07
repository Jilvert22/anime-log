'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getAnimeReviews } from '../lib/api/reviews';
import { MODERATION_CHANGED, type ModerationChange } from '../lib/moderation/types';
import type { User } from '@supabase/supabase-js';
import type { AnimeId, Review } from '../types';

export function useAnimeReviews(user: User | null) {
  const owner = user?.id ?? null;
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const request = useRef({ version: 0 });
  const lastAnime = useRef<AnimeId | null>(null);
  const [reviewState, setReviewState] = useState<{ owner: string | null; rows: Review[] }>({
    owner: null,
    rows: [],
  });
  const animeReviews = reviewState.owner === owner ? reviewState.rows : [];
  const [reviewLoadError, setReviewLoadError] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'overall' | 'episode'>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'likes' | 'helpful'>('newest');
  const [userSpoilerHidden, setUserSpoilerHidden] = useState(false);
  const [expandedSpoilerReviews, setExpandedSpoilerReviews] = useState<Set<string>>(new Set());

  const loadReviews = useCallback(
    async (animeId: AnimeId) => {
      const ticket = ++request.current.version;
      lastAnime.current = animeId;
      setReviewLoadError(null);
      if (!user || !animeId) {
        setReviewState({ owner, rows: [] });
        setLoadingReviews(false);
        return;
      }
      setLoadingReviews(true);
      try {
        const rows = await getAnimeReviews(animeId, user);
        if (ticket === request.current.version && currentOwner.current === owner)
          setReviewState({ owner, rows });
      } catch {
        if (ticket === request.current.version && currentOwner.current === owner) {
          setReviewState({ owner, rows: [] });
          setReviewLoadError('感想を読み込めませんでした。もう一度お試しください。');
        }
      } finally {
        if (ticket === request.current.version && currentOwner.current === owner)
          setLoadingReviews(false);
      }
    },
    [user, owner]
  );

  useEffect(() => {
    const lifecycle = request.current;
    lifecycle.version++;
    setReviewState({ owner, rows: [] });
    lastAnime.current = null;
    setLoadingReviews(false);
    setReviewLoadError(null);
    return () => {
      lifecycle.version++;
    };
  }, [owner]);
  useEffect(() => {
    const refresh = (event: Event) => {
      if ((event as CustomEvent<ModerationChange>).detail.ownerId !== owner) return;
      request.current.version++;
      setReviewState({ owner, rows: [] });
      if (lastAnime.current !== null) void loadReviews(lastAnime.current);
    };
    window.addEventListener(MODERATION_CHANGED, refresh);
    return () => window.removeEventListener(MODERATION_CHANGED, refresh);
  }, [owner, loadReviews]);

  return {
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
    loadReviews,
  };
}
