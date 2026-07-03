import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnimeData } from '../../app/hooks/useAnimeData';
import { getAnimesByUser } from '../../app/lib/api/animes';
import type { User } from '@supabase/supabase-js';

vi.mock('../../app/lib/api/animes', () => ({
  getAnimesByUser: vi.fn(),
}));

const fakeUser = { id: 'u1' } as User;

describe('useAnimeData', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReset();
    vi.mocked(localStorage.setItem).mockReset();
    vi.mocked(localStorage.removeItem).mockReset();
    vi.mocked(getAnimesByUser).mockReset();
  });

  it('localStorage 読込完了後、記録0件でも ready になる', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const { result } = renderHook(() => useAnimeData(null, false));

    await waitFor(() => expect(result.current.isAnimeDataReady).toBe(true));
    expect(result.current.allAnimes).toEqual([]);
  });

  it('localStorage parse 失敗時も空配列で ready になる', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('{broken json');

    const { result } = renderHook(() => useAnimeData(null, false));

    await waitFor(() => expect(result.current.isAnimeDataReady).toBe(true));
    expect(result.current.seasons).toEqual([]);
  });

  it('localStorage 読込前は ready ではない', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const { result } = renderHook(() => useAnimeData(null, true));

    expect(result.current.isAnimeDataReady).toBe(false);
  });

  it('Supabase 取得失敗時は loadError=true になる', async () => {
    vi.mocked(getAnimesByUser).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useAnimeData(fakeUser, false));

    await waitFor(() => expect(result.current.isAnimeDataReady).toBe(true));
    expect(result.current.loadError).toBe(true);
    expect(result.current.seasons).toEqual([]);
  });

  it('reloadAnimeData() で再取得し、成功すれば loadError が解消する', async () => {
    vi.mocked(getAnimesByUser).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useAnimeData(fakeUser, false));

    await waitFor(() => expect(result.current.loadError).toBe(true));

    // 次回は成功する
    vi.mocked(getAnimesByUser).mockResolvedValue([]);
    act(() => {
      result.current.reloadAnimeData();
    });

    await waitFor(() => expect(result.current.loadError).toBe(false));
    expect(result.current.isAnimeDataReady).toBe(true);
  });
});
