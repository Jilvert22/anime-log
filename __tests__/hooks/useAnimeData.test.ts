import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnimeData } from '../../app/hooks/useAnimeData';

describe('useAnimeData', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReset();
    vi.mocked(localStorage.setItem).mockReset();
    vi.mocked(localStorage.removeItem).mockReset();
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
});
