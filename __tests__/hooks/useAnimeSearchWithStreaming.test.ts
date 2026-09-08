import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchAnime, searchAnimeBySeason } from '../../app/lib/api/anilist';
import { searchAnnictByTitle } from '../../app/lib/api/annict';
import {
  ANIME_SEARCH_ERROR,
  useAnimeSearchWithStreaming,
} from '../../app/hooks/useAnimeSearchWithStreaming';

vi.mock('../../app/lib/api/anilist', () => ({
  searchAnime: vi.fn(),
  searchAnimeBySeason: vi.fn(),
}));
vi.mock('../../app/lib/api/annict', () => ({
  searchAnnictByTitle: vi.fn(),
  searchAnnictBySeason: vi.fn().mockResolvedValue([]),
  formatAnnictSeason: vi.fn().mockReturnValue('2026-summer'),
  mergeWithAnnictData: vi.fn(async (items) => items),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(searchAnnictByTitle).mockResolvedValue([]);
});

describe('検索障害からの復帰', () => {
  it('障害を0件としてキャッシュせず、同じ検索を再試行できる', async () => {
    vi.mocked(searchAnime).mockRejectedValueOnce(new Error('403')).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAnimeSearchWithStreaming());
    await act(async () => {
      await expect(result.current.searchByTitle('retry-title')).rejects.toThrow();
    });
    expect(result.current.error).toBe(ANIME_SEARCH_ERROR);
    expect(result.current.isLoading).toBe(false);
    await act(async () => {
      await expect(result.current.searchByTitle('retry-title')).resolves.toEqual([]);
    });
    expect(searchAnime).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('正常な0件のキャッシュへ戻ったときも前のエラーを消す', async () => {
    vi.mocked(searchAnime).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useAnimeSearchWithStreaming());
    await act(async () => {
      await result.current.searchByTitle('empty-cache');
    });
    await act(async () => {
      await expect(result.current.searchByTitle('failed-other')).rejects.toThrow();
    });
    expect(result.current.error).toBeTruthy();
    await act(async () => {
      await result.current.searchByTitle('empty-cache');
    });
    expect(searchAnime).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('Annictの補助情報だけの失敗では作品検索を止めない', async () => {
    vi.mocked(searchAnime).mockResolvedValueOnce([]);
    vi.mocked(searchAnnictByTitle).mockRejectedValueOnce(new Error('unavailable'));
    const { result } = renderHook(() => useAnimeSearchWithStreaming());
    await act(async () => {
      await expect(result.current.searchByTitle('optional-streaming')).resolves.toEqual([]);
    });
    expect(result.current.error).toBeNull();
  });

  it('クール検索の障害もキャッシュせず再試行する', async () => {
    vi.mocked(searchAnimeBySeason).mockRejectedValueOnce(new Error('403'));
    const { result } = renderHook(() => useAnimeSearchWithStreaming());
    await act(async () => {
      await expect(result.current.searchBySeason('SUMMER', 2026, 2)).rejects.toThrow();
    });
    expect(result.current.error).toBe(ANIME_SEARCH_ERROR);
    vi.mocked(searchAnimeBySeason).mockResolvedValue({
      media: [],
      pageInfo: { total: 0, currentPage: 2, hasNextPage: false },
    });
    await act(async () => {
      await result.current.searchBySeason('SUMMER', 2026, 2);
    });
    expect(searchAnimeBySeason).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });
});
