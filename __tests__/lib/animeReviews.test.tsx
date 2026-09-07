import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
const mocks = vi.hoisted(() => ({ from: vi.fn(), row: vi.fn() }));
vi.mock('../../app/lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../../app/lib/api/animes', () => ({ getAnimeRowId: mocks.row }));
import { useAnimeReviews } from '../../app/hooks/useAnimeReviews';
const owner = { id: 'owner' } as User;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.row.mockResolvedValue('anime-uuid');
});
it('UUIDの作品を取得し、感想・ネタバレ・自分のリアクションを維持する', async () => {
  const rows = [
    {
      id: 'review',
      user_id: 'author',
      user_name: '名前',
      type: 'episode',
      episode_number: 2,
      content: '本文',
      contains_spoiler: true,
      likes: 3,
      helpful_count: null,
      created_at: '2026-09-07',
    },
  ];
  const queries: Record<string, ReturnType<typeof chain>> = {};
  function chain(data: unknown) {
    const q = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      in: vi.fn(() => q),
      order: vi.fn(() => q),
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data, error: null }).then(resolve),
    };
    return q;
  }
  mocks.from.mockImplementation(
    (table: string) =>
      (queries[table] = chain(
        table === 'reviews' ? rows : table === 'review_likes' ? [{ review_id: 'review' }] : []
      ))
  );
  const { result } = renderHook(() => useAnimeReviews(owner));
  await act(async () => result.current.loadReviews('anime-uuid'));
  expect(mocks.row).toHaveBeenCalledWith('anime-uuid', 'owner');
  expect(queries.reviews.eq).toHaveBeenCalledWith('anime_id', 'anime-uuid');
  expect(result.current.animeReviews[0]).toMatchObject({
    id: 'review',
    animeId: 'anime-uuid',
    userId: 'author',
    episodeNumber: 2,
    content: '本文',
    containsSpoiler: true,
    likes: 3,
    helpfulCount: 0,
    userLiked: true,
    userHelpful: false,
  });
});
it('未ログインとローカルにしかない作品はDBの感想を照会しない', async () => {
  const { result, rerender } = renderHook(({ user }) => useAnimeReviews(user), {
    initialProps: { user: null as User | null },
  });
  await act(async () => result.current.loadReviews(1));
  expect(mocks.row).not.toHaveBeenCalled();
  rerender({ user: owner });
  mocks.row.mockResolvedValue(null);
  await act(async () => result.current.loadReviews(1));
  expect(mocks.from).not.toHaveBeenCalled();
  expect(result.current.animeReviews).toEqual([]);
});
