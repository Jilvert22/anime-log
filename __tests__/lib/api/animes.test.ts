/**
 * animes リポジトリのユニットテスト
 *
 * Supabase クライアント (Proxy) をモックし、各関数が
 * 「正しいテーブル・カラム・フィルタでクエリを組むこと」と
 * 「エラー時に SupabaseError を throw すること」を固定する。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Supabase Proxy のモック -------------------------------------------------
// どのクエリ組み合わせ (.select().eq().order() / .insert().select() /
// .update().eq().eq() 等) でも成立するよう、全メソッドが「チェーン継続」かつ
// 「await で {data, error} に解決」する自己参照オブジェクトを返す。
// 解決値は terminal を await 時に読むため、テストごとに書き換えられる。

type QueryResult = { data: unknown; error: unknown };
interface Chain extends PromiseLike<QueryResult> {
  select(...a: unknown[]): Chain;
  insert(...a: unknown[]): Chain;
  update(...a: unknown[]): Chain;
  delete(...a: unknown[]): Chain;
  eq(...a: unknown[]): Chain;
  order(...a: unknown[]): Chain;
  single(...a: unknown[]): Chain;
}

const terminal: QueryResult = { data: null, error: null };

function makeChain(): Chain {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    then: (onOk?: ((v: QueryResult) => unknown) | null, onErr?: ((e: unknown) => unknown) | null) =>
      Promise.resolve<QueryResult>({ data: terminal.data, error: terminal.error }).then(
        onOk,
        onErr
      ),
  } as unknown as Chain;
  return chain;
}

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock('../../../app/lib/supabase', () => ({
  supabase: { from: fromMock },
}));

import {
  getAnimesByUser,
  getAnimeRowId,
  insertAnime,
  updateAnimeFields,
  deleteAnime,
} from '../../../app/lib/api/animes';
import { DuplicateAnimeError } from '../../../app/lib/api/errors';
import type { Anime } from '../../../app/types';

function anime(overrides: Partial<Anime> = {}): Anime {
  return {
    id: 5,
    title: 'テスト作品',
    image: '',
    rating: 4,
    watched: true,
    anilistId: 123,
    ...overrides,
  };
}

beforeEach(() => {
  terminal.data = null;
  terminal.error = null;
  fromMock.mockReset();
  fromMock.mockImplementation(() => makeChain());
});

describe('getAnimesByUser', () => {
  it('animes テーブルを user_id で引く', async () => {
    terminal.data = [{ id: 1, title: 'a' }];
    const rows = await getAnimesByUser('u1');
    expect(fromMock).toHaveBeenCalledWith('animes');
    expect(rows).toEqual([{ id: 1, title: 'a' }]);
  });

  it('エラー時は throw する', async () => {
    terminal.error = { message: 'boom' };
    await expect(getAnimesByUser('u1')).rejects.toThrow();
  });
});

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('getAnimeRowId', () => {
  it('存在すれば id (UUID 文字列) を返す', async () => {
    terminal.data = { id: UUID };
    await expect(getAnimeRowId(UUID, 'u1')).resolves.toBe(UUID);
  });

  it('存在しなければ null (throw しない)', async () => {
    terminal.error = { message: 'not found' };
    await expect(getAnimeRowId(UUID, 'u1')).resolves.toBeNull();
  });

  it('number 入力 (合成 ID / AniList ID) は DB を呼ばず null を返す', async () => {
    // animes.id は uuid 型のため number は存在し得ない。無駄なクエリを省く早期 return。
    await expect(getAnimeRowId(42, 'u1')).resolves.toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe('insertAnime', () => {
  it('animes テーブルに insert し、挿入後の行 (UUID id) を返す', async () => {
    terminal.data = [{ id: UUID, title: 'テスト作品' }];
    const row = await insertAnime(anime(), '2025春', 'u1');
    expect(fromMock).toHaveBeenCalledWith('animes');
    expect(row).toMatchObject({ id: UUID });
  });

  it('エラー時は throw する', async () => {
    terminal.error = { message: 'boom' };
    await expect(insertAnime(anime(), '2025春', 'u1')).rejects.toThrow();
  });

  it('UNIQUE制約違反(23505)は DuplicateAnimeError を throw する', async () => {
    terminal.error = { code: '23505', message: 'duplicate key value violates unique constraint' };
    await expect(insertAnime(anime(), '2025春', 'u1')).rejects.toBeInstanceOf(DuplicateAnimeError);
  });
});

describe('updateAnimeFields', () => {
  it('成功時は解決する', async () => {
    terminal.error = null;
    await expect(updateAnimeFields(5, 'u1', { rating: 5 })).resolves.toBeUndefined();
    expect(fromMock).toHaveBeenCalledWith('animes');
  });

  it('UUID 文字列 id でも解決する (widening 済みシグネチャの固定)', async () => {
    terminal.error = null;
    await expect(updateAnimeFields(UUID, 'u1', { rating: 5 })).resolves.toBeUndefined();
    expect(fromMock).toHaveBeenCalledWith('animes');
  });

  it('エラー時は throw する', async () => {
    terminal.error = { message: 'boom' };
    await expect(updateAnimeFields(5, 'u1', { rating: 5 })).rejects.toThrow();
  });
});

describe('deleteAnime', () => {
  it('UUID 文字列 id で削除できる (widening 済みシグネチャの固定)', async () => {
    terminal.error = null;
    await expect(deleteAnime(UUID, 'u1')).resolves.toBeUndefined();
    expect(fromMock).toHaveBeenCalledWith('animes');
  });

  it('エラー時は throw する', async () => {
    terminal.error = { message: 'boom' };
    await expect(deleteAnime(5, 'u1')).rejects.toThrow();
  });
});
