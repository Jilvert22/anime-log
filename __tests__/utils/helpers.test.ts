import { describe, it, expect } from 'vitest';
import { extractSeriesName, getSeasonName, supabaseToAnime } from '../../app/utils/helpers';
import type { SupabaseAnimeRow } from '../../app/types';

function row(overrides: Partial<SupabaseAnimeRow> = {}): SupabaseAnimeRow {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    anilist_id: 123,
    user_id: 'u1',
    season_name: '2025年春',
    title: 'テスト作品',
    image: null,
    rating: null,
    watched: false,
    rewatch_count: 0,
    tags: null,
    songs: null,
    quotes: null,
    series_name: null,
    studios: null,
    streaming_sites: null,
    ...overrides,
  };
}

describe('extractSeriesName', () => {
  it('シリーズ名を正しく抽出する', () => {
    expect(extractSeriesName('進撃の巨人 Season 3')).toBe('進撃の巨人');
    expect(extractSeriesName('進撃の巨人 The Final Season')).toBe('進撃の巨人');
  });

  it('シリーズ名がない場合はそのまま返す', () => {
    expect(extractSeriesName('ぼっち・ざ・ろっく！')).toBe('ぼっち・ざ・ろっく！');
  });

  it('第2期などのパターンを処理する', () => {
    expect(extractSeriesName('鬼滅の刃 第2期')).toBe('鬼滅の刃');
  });
});

describe('getSeasonName', () => {
  it('年とクォーターからシーズン名を生成する', () => {
    expect(getSeasonName(2024, 1)).toBe('2024年冬');
    expect(getSeasonName(2024, 2)).toBe('2024年春');
    expect(getSeasonName(2024, 3)).toBe('2024年夏');
    expect(getSeasonName(2024, 4)).toBe('2024年秋');
  });
});

// AnimeId 二重実態の特性テスト: Supabase 行 → ドメイン型の id マッピングを固定する
describe('supabaseToAnime', () => {
  it('row.id の UUID 文字列をそのまま anime.id に入れる', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(supabaseToAnime(row({ id: uuid })).id).toBe(uuid);
  });

  it('row.id が欠落していれば 0 (falsy) にフォールバックする', () => {
    // insertAnime のフォールバック行 (id なし) 経由でのみ発生。0 は loadReviews のガードで弾かれる
    expect(supabaseToAnime(row({ id: undefined })).id).toBe(0);
  });

  it('anilist_id が null なら anilistId は undefined になる', () => {
    expect(supabaseToAnime(row({ anilist_id: null })).anilistId).toBeUndefined();
  });
});
