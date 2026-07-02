/**
 * updateAnimeInSeasons の特性テスト
 *
 * seasons 配列から対象アニメを見つけて updater を適用し、
 * ログイン時のみ Supabase 側も更新する共通ヘルパー。
 * Phase 3 で animes データ層に巻き取る候補なので、現挙動を固定しておく。
 */

import { describe, it, expect, vi } from 'vitest';
import { updateAnimeInSeasons } from '../../app/utils/animeUpdates';
import type { Anime, Season } from '../../app/types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

function anime(id: number, overrides: Partial<Anime> = {}): Anime {
  return { id, title: `作品${id}`, image: '', rating: 3, watched: true, ...overrides };
}

function seasons(): Season[] {
  return [
    { name: '2025春', animes: [anime(1), anime(2)] },
    { name: '2025夏', animes: [anime(3)] },
  ];
}

const supabase = {} as SupabaseClient;
const user = { id: 'u1' } as User;

describe('updateAnimeInSeasons', () => {
  it('対象アニメに updater を適用し、更新後の seasons と anime を返す', async () => {
    const { updatedSeasons, updatedAnime } = await updateAnimeInSeasons(
      2,
      seasons(),
      (a) => ({ ...a, rating: 5 }),
      null,
      supabase
    );

    expect(updatedAnime).toMatchObject({ id: 2, rating: 5 });
    expect(updatedSeasons[0].animes.find((a) => a.id === 2)?.rating).toBe(5);
    // 他のアニメは不変
    expect(updatedSeasons[0].animes.find((a) => a.id === 1)?.rating).toBe(3);
    expect(updatedSeasons[1].animes[0].rating).toBe(3);
  });

  it('対象が存在しなければ updatedAnime は null', async () => {
    const { updatedAnime } = await updateAnimeInSeasons(999, seasons(), (a) => a, null, supabase);
    expect(updatedAnime).toBeNull();
  });

  it('ログイン時 + supabaseUpdater 指定なら updater 結果で呼ばれる', async () => {
    const supabaseUpdater = vi.fn().mockResolvedValue(undefined);
    await updateAnimeInSeasons(
      1,
      seasons(),
      (a) => ({ ...a, rating: 4 }),
      user,
      supabase,
      supabaseUpdater
    );
    expect(supabaseUpdater).toHaveBeenCalledWith(expect.objectContaining({ id: 1, rating: 4 }));
  });

  it('未ログインなら supabaseUpdater は呼ばれない', async () => {
    const supabaseUpdater = vi.fn();
    await updateAnimeInSeasons(1, seasons(), (a) => a, null, supabase, supabaseUpdater);
    expect(supabaseUpdater).not.toHaveBeenCalled();
  });

  it('supabaseUpdater が throw しても seasons 更新結果は返す (握りつぶし)', async () => {
    const supabaseUpdater = vi.fn().mockRejectedValue(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { updatedAnime } = await updateAnimeInSeasons(
      1,
      seasons(),
      (a) => ({ ...a, rating: 5 }),
      user,
      supabase,
      supabaseUpdater
    );
    expect(updatedAnime).toMatchObject({ id: 1, rating: 5 });
  });
});
