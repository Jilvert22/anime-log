import { describe, it, expect } from 'vitest';
import {
  isContinuingAnime,
  getStartSeason,
  seasonFromMonth,
  seasonIndex,
} from '../../app/utils/continuingAnime';
import type { AniListMedia } from '../../app/lib/anilist';

// テスト用のミニファクトリ — AniListMedia の必須フィールドだけ埋める
function media(overrides: Partial<AniListMedia> = {}): AniListMedia {
  return {
    id: 1,
    title: { native: 'テスト', romaji: 'test' },
    coverImage: null,
    seasonYear: 2025,
    season: 'SPRING',
    genres: [],
    studios: null,
    ...overrides,
  };
}

describe('seasonFromMonth', () => {
  it('月からシーズンを推定する', () => {
    expect(seasonFromMonth(1)).toBe('WINTER');
    expect(seasonFromMonth(4)).toBe('SPRING');
    expect(seasonFromMonth(7)).toBe('SUMMER');
    expect(seasonFromMonth(10)).toBe('FALL');
  });
});

describe('seasonIndex', () => {
  it('時系列で大小が決まる', () => {
    expect(seasonIndex(2025, 'SPRING')).toBeLessThan(seasonIndex(2025, 'SUMMER'));
    expect(seasonIndex(2025, 'FALL')).toBeLessThan(seasonIndex(2026, 'WINTER'));
  });
});

describe('getStartSeason', () => {
  it('season/seasonYearがあればそちらを優先', () => {
    expect(getStartSeason(media({ seasonYear: 2025, season: 'SPRING' }))).toEqual({
      year: 2025,
      season: 'SPRING',
    });
  });

  it('startDateからの推定にフォールバック', () => {
    expect(
      getStartSeason(
        media({ seasonYear: null, season: null, startDate: { year: 2025, month: 7 } })
      )
    ).toEqual({ year: 2025, season: 'SUMMER' });
  });

  it('両方なければ null', () => {
    expect(getStartSeason(media({ seasonYear: null, season: null }))).toBeNull();
  });
});

describe('isContinuingAnime', () => {
  const target = { year: 2025, season: 'SUMMER' as const };

  describe('継続中と判定すべきケース', () => {
    it('episodes >= 14 で前シーズン開始', () => {
      const m = media({ seasonYear: 2025, season: 'SPRING', episodes: 24, status: 'RELEASING' });
      expect(isContinuingAnime(m, target)).toBe(true);
    });

    it('フリーレン (28話, 2023年秋開始) は 2024年冬に継続中', () => {
      const frieren = media({
        seasonYear: 2023,
        season: 'FALL',
        episodes: 28,
        status: 'FINISHED',
        startDate: { year: 2023, month: 9 },
        endDate: { year: 2024, month: 3 },
      });
      expect(isContinuingAnime(frieren, { year: 2024, season: 'WINTER' })).toBe(true);
    });

    it('episodes が null でも前シーズン開始 & RELEASING なら継続扱い', () => {
      const m = media({
        seasonYear: 2025,
        season: 'SPRING',
        episodes: null,
        status: 'RELEASING',
      });
      expect(isContinuingAnime(m, target)).toBe(true);
    });
  });

  describe('継続中ではないケース', () => {
    it('target と同じシーズン開始の通常1クール作品は新規 (false)', () => {
      const m = media({ seasonYear: 2025, season: 'SUMMER', episodes: 12, status: 'RELEASING' });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('未来シーズン開始 (まだ始まってない) は false', () => {
      const m = media({ seasonYear: 2025, season: 'FALL', episodes: 24, status: 'NOT_YET_RELEASED' });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('前シーズン開始でも episodes=12 で FINISHED なら通常1クール (false)', () => {
      const m = media({
        seasonYear: 2025,
        season: 'SPRING',
        episodes: 12,
        status: 'FINISHED',
        endDate: { year: 2025, month: 6 },
      });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('開始情報が一切ない作品は false', () => {
      const m = media({ seasonYear: null, season: null });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    // v2 (2026-07-01) 過剰検知修正の回帰防止
    it('12話 RELEASING の前期作品は1クール扱い (false)', () => {
      const m = media({ seasonYear: 2025, season: 'SPRING', episodes: 12, status: 'RELEASING' });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('13話 RELEASING の前期作品も1クール扱い (false)', () => {
      const m = media({ seasonYear: 2025, season: 'SPRING', episodes: 13, status: 'RELEASING' });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('episodes:null + NOT_YET_RELEASED は継続扱いしない (前期開始でも未開始)', () => {
      const m = media({
        seasonYear: 2025,
        season: 'SPRING',
        episodes: null,
        status: 'NOT_YET_RELEASED',
      });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('episodes:null + FINISHED は継続扱いしない (過去作品)', () => {
      const m = media({
        seasonYear: 2025,
        season: 'SPRING',
        episodes: null,
        status: 'FINISHED',
      });
      expect(isContinuingAnime(m, target)).toBe(false);
    });

    it('SPRING開始24話 (2クール) は SUMMER で継続するが FALL では終了済み', () => {
      // 24話 ≒ 2クール → SPRING+SUMMER で完結。FALLには継続しない
      const m = media({ seasonYear: 2025, season: 'SPRING', episodes: 24, status: 'FINISHED' });
      expect(isContinuingAnime(m, { year: 2025, season: 'SUMMER' })).toBe(true);
      expect(isContinuingAnime(m, { year: 2025, season: 'FALL' })).toBe(false);
    });

    it('SPRING開始39話 (3クール) は FALLまで継続、WINTERでは終了', () => {
      // 39話 ≒ 3クール → SPRING+SUMMER+FALL で完結
      const m = media({ seasonYear: 2025, season: 'SPRING', episodes: 39, status: 'RELEASING' });
      expect(isContinuingAnime(m, { year: 2025, season: 'SUMMER' })).toBe(true);
      expect(isContinuingAnime(m, { year: 2025, season: 'FALL' })).toBe(true);
      expect(isContinuingAnime(m, { year: 2026, season: 'WINTER' })).toBe(false);
    });

    it('フリーレン (28話, FALL開始, 翌春3月終了) は WINTER まで継続、SPRINGでは終了', () => {
      // endDate=2024/3 (WINTER) があるので、話数推定よりこちらが優先される
      const frieren = media({
        seasonYear: 2023,
        season: 'FALL',
        episodes: 28,
        status: 'FINISHED',
        startDate: { year: 2023, month: 9 },
        endDate: { year: 2024, month: 3 },
      });
      expect(isContinuingAnime(frieren, { year: 2024, season: 'WINTER' })).toBe(true);
      expect(isContinuingAnime(frieren, { year: 2024, season: 'SPRING' })).toBe(false);
      expect(isContinuingAnime(frieren, { year: 2024, season: 'SUMMER' })).toBe(false);
    });

    it('endDate 不明の長期作品は話数推定にフォールバック', () => {
      // 39話, endDate不明 → ceil(39/13)=3クール推定 → start+2 までtrue
      const m = media({
        seasonYear: 2025,
        season: 'SPRING',
        episodes: 39,
        status: 'RELEASING',
        endDate: null,
      });
      expect(isContinuingAnime(m, { year: 2025, season: 'SUMMER' })).toBe(true);
      expect(isContinuingAnime(m, { year: 2025, season: 'FALL' })).toBe(true);
      expect(isContinuingAnime(m, { year: 2026, season: 'WINTER' })).toBe(false);
    });
  });
});
