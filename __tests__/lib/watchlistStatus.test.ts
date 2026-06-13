import { describe, it, expect } from 'vitest';
import {
  WATCHLIST_STATUSES,
  WATCHLIST_STATUS_OPTIONS,
  getNextWatchlistStatus,
  getWatchlistStatusLabel,
  getWatchlistStatusColor,
} from '../../app/lib/watchlist/status';

describe('getNextWatchlistStatus', () => {
  it('planned → watching', () => {
    expect(getNextWatchlistStatus('planned')).toBe('watching');
  });
  it('watching → completed', () => {
    expect(getNextWatchlistStatus('watching')).toBe('completed');
  });
  it('completed → null（完了後はループを止める）', () => {
    expect(getNextWatchlistStatus('completed')).toBeNull();
  });
  it('null/undefined → watching', () => {
    expect(getNextWatchlistStatus(null)).toBe('watching');
    expect(getNextWatchlistStatus(undefined)).toBe('watching');
  });
});

describe('getWatchlistStatusLabel', () => {
  it('各ステータスの日本語ラベル', () => {
    expect(getWatchlistStatusLabel('planned')).toBe('視聴予定');
    expect(getWatchlistStatusLabel('watching')).toBe('視聴中');
    expect(getWatchlistStatusLabel('completed')).toBe('視聴完了');
  });
  it('未設定（null/undefined）は「未設定」', () => {
    expect(getWatchlistStatusLabel(null)).toBe('未設定');
    expect(getWatchlistStatusLabel(undefined)).toBe('未設定');
  });
});

describe('getWatchlistStatusColor', () => {
  it('各ステータスのTailwind色クラス', () => {
    expect(getWatchlistStatusColor('planned')).toBe('bg-blue-500');
    expect(getWatchlistStatusColor('watching')).toBe('bg-yellow-500');
    expect(getWatchlistStatusColor('completed')).toBe('bg-green-500');
  });
  it('未設定はグレー', () => {
    expect(getWatchlistStatusColor(null)).toBe('bg-gray-500');
  });
});

describe('WATCHLIST_STATUS_OPTIONS', () => {
  it('表示順は 視聴予定 → 視聴中 → 視聴完了', () => {
    expect(WATCHLIST_STATUS_OPTIONS.map((o) => o.status)).toEqual([
      'planned',
      'watching',
      'completed',
    ]);
    expect(WATCHLIST_STATUS_OPTIONS).toEqual([
      { status: 'planned', label: '視聴予定', color: 'bg-blue-500' },
      { status: 'watching', label: '視聴中', color: 'bg-yellow-500' },
      { status: 'completed', label: '視聴完了', color: 'bg-green-500' },
    ]);
  });
  it('WATCHLIST_STATUSES と件数が一致', () => {
    expect(WATCHLIST_STATUS_OPTIONS).toHaveLength(WATCHLIST_STATUSES.length);
  });
});
