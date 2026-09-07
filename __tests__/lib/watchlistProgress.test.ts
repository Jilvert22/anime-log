import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextProgress, validateProgress } from '../../app/lib/watchlist/progress';
import { LocalStorageService } from '../../app/lib/storage/localStorageService';

let saved: string;
beforeEach(() => {
  saved = JSON.stringify([
    { id: 'a', anilist_id: -1, title: '手動1', watched_episodes: 7, total_episodes: 12 },
    { id: 'b', anilist_id: -1, title: '手動2' },
  ]);
  vi.mocked(localStorage.getItem).mockImplementation(() => saved);
  vi.mocked(localStorage.setItem).mockImplementation((_key, value) => {
    saved = value;
  });
});
describe('話数', () => {
  it.each([-1, 1.5, NaN, Infinity, 100001])('不正な観た話数 %s を拒否する', (watched) => {
    expect(() => validateProgress({ watched_episodes: watched, total_episodes: null })).toThrow();
  });
  it('全話数を超えて増やさない。未定なら増やせる', () => {
    expect(() => nextProgress({ watched_episodes: 12, total_episodes: 12 })).toThrow();
    expect(nextProgress({ watched_episodes: 12, total_episodes: null }).watched_episodes).toBe(13);
  });
  it('同じセンチネルの手動作品を行IDで区別し、最終話でも自動完了にしない', async () => {
    const service = new LocalStorageService();
    const result = await service.saveWatchlistProgress(
      'a',
      { watched_episodes: 12, total_episodes: 12 },
      { watched_episodes: 7, total_episodes: 12 }
    );
    expect(result.status).toBe('watching');
    expect((await service.getWatchlist())[1].watched_episodes).toBeUndefined();
  });
  it('別のタブで進めた話数を古い表示で上書きしない', async () => {
    const service = new LocalStorageService();
    await expect(
      service.saveWatchlistProgress(
        'a',
        { watched_episodes: 8, total_episodes: 12 },
        { watched_episodes: 6, total_episodes: 12 }
      )
    ).rejects.toThrow();
    expect(JSON.parse(saved)[0].watched_episodes).toBe(7);
  });
  it('容量不足時は成功を返さず、元のデータを維持する', async () => {
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    await expect(
      new LocalStorageService().saveWatchlistProgress(
        'a',
        { watched_episodes: 8, total_episodes: 12 },
        { watched_episodes: 7, total_episodes: 12 }
      )
    ).rejects.toThrow();
    expect(JSON.parse(saved)[0].watched_episodes).toBe(7);
  });
  it('壊れたデータを空の記録として書き直さない', async () => {
    saved = '{broken';
    await expect(new LocalStorageService().getWatchlist()).rejects.toThrow();
    expect(saved).toBe('{broken');
  });
});
