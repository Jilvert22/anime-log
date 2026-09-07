import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from '../../app/lib/storage/localStorageService';
import type { WatchlistItem } from '../../app/lib/storage/types';

let saved: string | null;
const service = new LocalStorageService();
const item: WatchlistItem = {
  id: 'first',
  anilist_id: 123,
  title: '作品',
  image: null,
  memo: 'メモ',
  created_at: '2026-09-01T00:00:00Z',
  status: 'watching',
};

beforeEach(() => {
  saved = JSON.stringify([item]);
  vi.mocked(localStorage.getItem).mockImplementation(() => saved);
  vi.mocked(localStorage.setItem).mockImplementation((_key, value) => {
    saved = value;
  });
});

describe('既存の積みアニメ保存の特性', () => {
  it('同じ作品を別のクールへ追加すると既存の記録を移動する', async () => {
    await service.addToWatchlist({
      anilist_id: 123,
      title: '作品',
      season_year: 2026,
      season: 'FALL',
    });
    expect(await service.getWatchlist()).toEqual([
      expect.objectContaining({ id: 'first', memo: 'メモ', season_year: 2026, season: 'FALL' }),
    ]);
  });
  it('手動追加のセンチネルが同じでも複数作品を保存できる', async () => {
    await service.addToWatchlist({ anilist_id: -1, title: '手動1' });
    await service.addToWatchlist({ anilist_id: -1, title: '手動2' });
    expect((await service.getWatchlist()).map((row) => row.title)).toEqual([
      '作品',
      '手動1',
      '手動2',
    ]);
  });
  it('一括ステータス更新は行IDで指定した作品だけに適用する', async () => {
    saved = JSON.stringify([item, { ...item, id: 'second', anilist_id: 456 }]);
    await service.updateWatchlistItemsStatus(['first'], 'completed');
    expect((await service.getWatchlist()).map((row) => row.status)).toEqual([
      'completed',
      'watching',
    ]);
  });
});
