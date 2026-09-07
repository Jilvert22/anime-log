import { describe, expect, it } from 'vitest';
import { buildRecap, recapYears } from '../../app/lib/records/recap';
import { recordsToCsv, recordsToJson } from '../../app/lib/records/export';
import { parseTab } from '../../app/lib/navigation';
import type { Anime, Season } from '../../app/types';

const anime = (overrides: Partial<Anime> = {}): Anime => ({
  id: 1234,
  title: '作品',
  image: '',
  rating: 0,
  watched: true,
  ...overrides,
});
describe('年別の作品棚', () => {
  it('分類クールが一致する年だけを扱い、未分類を当年とみなさない', () => {
    const seasons: Season[] = [
      { name: '2026年春', animes: [anime({ anilistId: 12, rating: 4 })] },
      { name: '2026年夏', animes: [anime({ id: 'uuid', anilistId: 12, rating: 5 })] },
      { name: '2025年冬', animes: [anime({ rating: 1 })] },
      { name: '未分類', animes: [anime({ rating: 1 })] },
    ];
    expect(recapYears(seasons)).toEqual([2026, 2025]);
    expect(buildRecap(seasons, 2026)).toMatchObject({ count: 1, average: 5 });
    expect(buildRecap(seasons, 2027)).toMatchObject({ count: 0, average: null });
  });
  it('手動追加は同名でも別IDなら別作品、未評価は平均に含めない', () => {
    const recap = buildRecap(
      [{ name: '2026年秋', animes: [anime(), anime({ id: '1234', rating: 4 })] }],
      2026
    );
    expect(recap.count).toBe(2);
    expect(recap.average).toBe(4);
    expect(recap.favorites).toHaveLength(1);
  });
});
describe('記録の書き出し', () => {
  it('CSVは数式文字列と引用符・改行を安全に扱う', () => {
    const csv = recordsToCsv(
      [{ name: '2026年夏', animes: [anime({ title: '=HYPERLINK("example")\n次の行' })] }],
      []
    );
    expect(csv).toContain('"\'=HYPERLINK(""example"")\n次の行"');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
  it('JSONに話数とメモを残し、watchlist所有者IDを含めない', () => {
    const record = {
      id: 'row',
      user_id: 'private-owner',
      anilist_id: -1,
      title: '手動',
      image: null,
      memo: '感想',
      created_at: '',
      watched_episodes: 7,
      total_episodes: 12,
    };
    const output = JSON.parse(recordsToJson([], [record]));
    expect(output.version).toBe(1);
    expect(output.watchlist[0]).toMatchObject({
      memo: '感想',
      watched_episodes: 7,
      total_episodes: 12,
    });
    expect(output.watchlist[0]).not.toHaveProperty('user_id');
  });
});
it('タブのURLは許可値のみ受け入れ、旧ショートカットも維持する', () => {
  expect(parseTab('watching')).toBe('watching');
  expect(parseTab('watchlist')).toBe('watchlist');
  expect(parseTab('mypage')).toBe('mypage');
  expect(parseTab('https://example.com')).toBe('seasons');
});
