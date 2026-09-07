import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn(), auth: vi.fn() }));
vi.mock('../../../app/lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../../../app/lib/api/auth', () => ({ requireAuth: mocks.auth }));
import { saveWatchlistProgress } from '../../../app/lib/api/watchlistProgress';

function query(result: { data: unknown; error: unknown }) {
  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    or: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}
const current = { watched_episodes: 7, total_episodes: 12 };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ id: 'owner' });
});

describe('アカウントの視聴進捗', () => {
  it('行と所有者、表示時点の話数で条件付き更新し、認証した所有者以外を対象にしない', async () => {
    const chain = query({ data: { id: 'row', watched_episodes: 8 }, error: null });
    mocks.from.mockReturnValue(chain);
    await saveWatchlistProgress('row', { watched_episodes: 8, total_episodes: 12 }, current);
    expect(chain.eq.mock.calls).toEqual([
      ['id', 'row'],
      ['user_id', 'owner'],
      ['watched_episodes', 7],
      ['total_episodes', 12],
    ]);
    expect(chain.or).toHaveBeenCalledWith('status.is.null,status.neq.completed');
  });
  it('全話数未設定をSQLのNULLとして比較する', async () => {
    const chain = query({ data: { id: 'row' }, error: null });
    mocks.from.mockReturnValue(chain);
    await saveWatchlistProgress(
      'row',
      { watched_episodes: 1, total_episodes: null },
      { watched_episodes: 0, total_episodes: null }
    );
    expect(chain.is).toHaveBeenCalledWith('total_episodes', null);
  });
  it('認証失敗時には更新しない', async () => {
    mocks.auth.mockRejectedValue(new Error('ログインが必要です'));
    await expect(saveWatchlistProgress('row', current, current)).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: null },
    { data: null, error: { code: 'PGRST116' } },
    { data: null, error: { code: '42703' } },
  ])('削除済み・競合・未適用DBを保存成功として扱わない', async (result) => {
    mocks.from.mockReturnValue(query(result));
    await expect(saveWatchlistProgress('row', current, current)).rejects.toThrow('再読み込み');
  });
});
