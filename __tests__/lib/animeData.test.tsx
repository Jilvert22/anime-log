import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

const mock = vi.hoisted(() => ({ getAnimes: vi.fn() }));
vi.mock('../../app/lib/api/animes', () => ({ getAnimesByUser: mock.getAnimes }));
import { useAnimeData } from '../../app/hooks/useAnimeData';

const guest = [
  {
    name: '2026年夏',
    animes: [{ id: 10001, title: '端末の作品', image: '', rating: 4, watched: true }],
  },
];
const owner = { id: 'owner-a' } as User;
let data: Map<string, string>;
beforeEach(() => {
  data = new Map([['animeSeasons', JSON.stringify(guest)]]);
  vi.mocked(localStorage.getItem).mockImplementation((key) => data.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
    data.set(key, value);
  });
  vi.mocked(localStorage.removeItem).mockImplementation((key) => {
    data.delete(key);
  });
  mock.getAnimes.mockReset().mockResolvedValue([]);
});

describe('アニメデータ読み込みの特性', () => {
  it('ゲストの記録と評価を読み込み、変更を保存する', async () => {
    const { result } = renderHook(() => useAnimeData(null, false));
    await waitFor(() => expect(result.current.isAnimeDataReady).toBe(true));
    expect(result.current.averageRating).toBe(4);
    act(() =>
      result.current.setSeasons([{ ...guest[0], animes: [{ ...guest[0].animes[0], rating: 5 }] }])
    );
    await waitFor(() => expect(JSON.parse(data.get('animeSeasons')!)[0].animes[0].rating).toBe(5));
  });
  it('アカウントの読み込み失敗は再試行できる', async () => {
    mock.getAnimes.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useAnimeData(owner, false));
    await waitFor(() => expect(result.current.loadError).toBe(true));
    act(() => result.current.reloadAnimeData());
    await waitFor(() => expect(result.current.loadError).toBe(false));
    await waitFor(() => expect(mock.getAnimes).toHaveBeenCalledTimes(2));
  });
});

it('アカウントからゲストへ戻ると端末の記録を維持し、UUIDの記録を書き込まない', async () => {
  mock.getAnimes.mockResolvedValue([
    {
      id: 'account-row',
      user_id: owner.id,
      season_name: '2026年夏',
      title: '非公開の作品',
      rating: 5,
      watched: true,
    },
  ]);
  const { result, rerender } = renderHook(
    ({ user }: { user: User | null }) => useAnimeData(user, false),
    { initialProps: { user: owner as User | null } }
  );
  await waitFor(() => expect(result.current.allAnimes[0]?.title).toBe('非公開の作品'));
  rerender({ user: null });
  expect(result.current.allAnimes.some((anime) => anime.title === '非公開の作品')).toBe(false);
  await waitFor(() => expect(result.current.allAnimes[0]?.title).toBe('端末の作品'));
  expect(JSON.parse(data.get('animeSeasons')!)).toEqual(guest);
});
it('アカウント切替後に遅れて到着する取得結果を捨てる', async () => {
  let resolve!: (value: unknown[]) => void;
  mock.getAnimes.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { result, rerender } = renderHook(
    ({ user }: { user: User | null }) => useAnimeData(user, false),
    { initialProps: { user: owner as User | null } }
  );
  rerender({ user: null });
  await act(async () => {
    resolve([{ id: 'late', title: '別アカウント', season_name: '2026年夏' }]);
  });
  expect(result.current.allAnimes[0]?.title).toBe('端末の作品');
});
it('小さいIDをサンプルと決めつけて削除せず、最後の作品の削除も保存する', async () => {
  data.set(
    'animeSeasons',
    JSON.stringify([{ ...guest[0], animes: [{ ...guest[0].animes[0], id: 1 }] }])
  );
  const { result } = renderHook(() => useAnimeData(null, false));
  await waitFor(() => expect(result.current.allAnimes[0]?.id).toBe(1));
  act(() => result.current.setSeasons([]));
  await waitFor(() => expect(data.get('animeSeasons')).toBe('[]'));
});
it('壊れたJSONを空配列で上書きしない', async () => {
  data.set('animeSeasons', '{broken');
  const { result } = renderHook(() => useAnimeData(null, false));
  await waitFor(() => expect(result.current.loadError).toBe(true));
  expect(data.get('animeSeasons')).toBe('{broken');
});
it('容量不足の保存失敗を通知し、未保存の記録を画面に残す', async () => {
  const { result } = renderHook(() => useAnimeData(null, false));
  await waitFor(() => expect(result.current.isAnimeDataReady).toBe(true));
  vi.mocked(localStorage.setItem).mockImplementation(() => {
    throw new Error('full');
  });
  act(() =>
    result.current.setSeasons([{ ...guest[0], animes: [{ ...guest[0].animes[0], rating: 5 }] }])
  );
  await waitFor(() => expect(result.current.saveError).toBe(true));
  expect(result.current.allAnimes[0].rating).toBe(5);
  expect(JSON.parse(data.get('animeSeasons')!)[0].animes[0].rating).toBe(4);
});
it('読み込み中の空配列を先に保存しない', () => {
  const { result } = renderHook(() => useAnimeData(null, true));
  expect(result.current.isAnimeDataReady).toBe(false);
  expect(JSON.parse(data.get('animeSeasons')!)).toEqual(guest);
});
