/**
 * 配信情報更新 (streamingUpdate) の特性テスト
 *
 * 目的: Phase 2 で updateAnimeStreamingInfo / updateWatchlistStreamingInfo の
 *       重複2関数を updateStreamingInfo(table, id, title) に統合した。
 *       「どのテーブルの・どのカラムを・どんなキーで更新するか」を固定する。
 *
 * 補足: 旧実装にあった「AniList ID → Annict ID マッピング分岐」は
 *       searchAnnictById が常に null を返す仕様で到達不能だったため Phase 2 で削除済み。
 *       現在はタイトルマッチ経路一本。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Annict 層をモック (タイトル検索が1件ヒットする状態)
vi.mock('../../app/lib/api/annict', () => ({
  searchAnnictByTitle: vi.fn().mockResolvedValue([{ programs: { nodes: [] } }]),
  extractStreamingServices: vi.fn().mockReturnValue(['Netflix', 'dアニメストア']),
  extractBroadcastTime: vi.fn().mockReturnValue('金 23:30'),
}));

// Supabase クライアントをモックし、update チェーンを記録する
const eqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
const fromMock = vi.fn().mockReturnValue({ update: updateMock });
vi.mock('../../app/lib/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ from: fromMock }),
}));

import {
  updateAnimeStreamingInfo,
  updateWatchlistStreamingInfo,
} from '../../app/lib/api/streamingUpdate';
import { searchAnnictByTitle } from '../../app/lib/api/annict';

beforeEach(() => {
  fromMock.mockClear();
  updateMock.mockClear();
  eqMock.mockClear();
  vi.mocked(searchAnnictByTitle).mockResolvedValue([{ programs: { nodes: [] } }] as never);
});

describe('updateAnimeStreamingInfo', () => {
  it('animes テーブルを id で更新し streaming_sites を書き込む', async () => {
    const result = await updateAnimeStreamingInfo(123, '呪術廻戦');

    expect(fromMock).toHaveBeenCalledWith('animes');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ streaming_sites: ['Netflix', 'dアニメストア'] })
    );
    expect(eqMock).toHaveBeenCalledWith('id', 123);
    expect(result).toEqual({
      success: true,
      streamingSites: ['Netflix', 'dアニメストア'],
      broadcastTime: '金 23:30',
    });
  });

  it('Annict にヒットしなければ success:false', async () => {
    vi.mocked(searchAnnictByTitle).mockResolvedValue([]);
    const result = await updateAnimeStreamingInfo(123, 'なし');
    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe('updateWatchlistStreamingInfo', () => {
  it('watchlist テーブルを id(文字列) で更新する', async () => {
    const result = await updateWatchlistStreamingInfo('wl-abc', '呪術廻戦');

    expect(fromMock).toHaveBeenCalledWith('watchlist');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ streaming_sites: ['Netflix', 'dアニメストア'] })
    );
    expect(eqMock).toHaveBeenCalledWith('id', 'wl-abc');
    expect(result.success).toBe(true);
  });
});
