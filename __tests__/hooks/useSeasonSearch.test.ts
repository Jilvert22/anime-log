import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSeasonSearch } from '../../app/hooks/useSeasonSearch';
import { insertAnime } from '../../app/lib/api/animes';
import type { Season, User } from '../../app/types';
import type { SupabaseAnimeRow } from '../../app/types';

// insertAnime は実 UUID 行を返す。supabaseToAnime は本物を使う(id マッピングを検証したいため)。
vi.mock('../../app/lib/api/animes', () => ({
  insertAnime: vi.fn(),
}));

const getWatchlistMock = vi.fn().mockResolvedValue([]);
// useStorage は安定参照を返す(毎回新オブジェクトを返すと loadWatchlist の依存が
// 変わり続けて無限再レンダリングになる。実装は memo 済み)。
const stableStorage = { getWatchlist: getWatchlistMock, addToWatchlist: vi.fn() };
vi.mock('../../app/hooks/useStorage', () => ({
  useStorage: () => stableStorage,
}));

vi.mock('../../app/hooks/useAnimeSearchWithStreaming', () => ({
  useAnimeSearchWithStreaming: () => ({ searchBySeason: vi.fn() }),
}));

const showToastMock = vi.fn();
const confirmDialogMock = vi.fn();
vi.mock('../../app/contexts/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: showToastMock, confirmDialog: confirmDialogMock }),
}));

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const fakeUser = { id: 'u1' } as User;

// AniList 検索結果の最小形
const searchResult = {
  id: 12345,
  title: { native: '検索テスト作品' },
  genres: [],
  studios: { nodes: [] },
  coverImage: { large: 'https://example.com/a.jpg' },
  streamingServices: [],
} as unknown as Parameters<ReturnType<typeof useSeasonSearch>['addAnimeFromSearch']>[0];

function renderSeasonSearch(seasons: Season[], setSeasons: (s: Season[]) => void) {
  return renderHook(() =>
    useSeasonSearch({
      allAnimes: seasons.flatMap((s) => s.animes),
      seasons,
      setSeasons,
      user: fakeUser,
      extractSeriesName: () => undefined,
    })
  );
}

describe('useSeasonSearch.addAnimeFromSearch', () => {
  beforeEach(() => {
    vi.mocked(insertAnime).mockReset();
    showToastMock.mockReset();
    confirmDialogMock.mockReset();
    getWatchlistMock.mockClear();
  });

  it('ログイン時、insertAnime が返す実 UUID id で state に反映する(合成 number を保持しない)', async () => {
    // insertAnime は DB の実 UUID 行を返す
    const insertedRow: SupabaseAnimeRow = {
      id: UUID,
      anilist_id: 12345,
      user_id: 'u1',
      season_name: '2025年春',
      title: '検索テスト作品',
      image: 'https://example.com/a.jpg',
      rating: null,
      watched: false,
      rewatch_count: 1,
      tags: null,
      songs: null,
      quotes: null,
      series_name: null,
      studios: null,
      streaming_sites: null,
    };
    vi.mocked(insertAnime).mockResolvedValue(insertedRow);

    const setSeasons = vi.fn();
    const { result } = renderSeasonSearch([], setSeasons);

    // マウント時の loadWatchlist 完了を待つ
    await waitFor(() => expect(getWatchlistMock).toHaveBeenCalled());

    await act(async () => {
      await result.current.addAnimeFromSearch(searchResult, '2025', '春');
    });

    expect(insertAnime).toHaveBeenCalledTimes(1);
    expect(setSeasons).toHaveBeenCalledTimes(1);

    const updatedSeasons = setSeasons.mock.calls[0][0] as Season[];
    const added = updatedSeasons.flatMap((s) => s.animes).find((a) => a.anilistId === 12345);
    expect(added).toBeDefined();
    // 合成 number ではなく DB の実 UUID が入っていること
    expect(added?.id).toBe(UUID);
  });
});
