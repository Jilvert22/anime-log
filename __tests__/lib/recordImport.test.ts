import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRecordFile, validateBundle } from '../../app/lib/records/importValidation';
import {
  fingerprint,
  mergeGuestRecords,
  planImport,
  prepareBundle,
} from '../../app/lib/records/importPlan';
import {
  readGuestSnapshot,
  saveGuestImport,
  BEFORE_IMPORT_KEY,
} from '../../app/lib/records/importStorage';
import { recordsToJson } from '../../app/lib/records/export';
import type { RecordBundle } from '../../app/lib/records/importValidation';

const manual = { id: 1, title: '手動作品', image: '', rating: 4, watched: true };
const bundle: RecordBundle = {
  seasons: [{ name: '2026年夏', animes: [manual] }],
  watchlist: [
    {
      id: 'watch',
      anilist_id: -1,
      title: '予定作品',
      image: null,
      memo: null,
      created_at: '2026-09-01T00:00:00Z',
      watched_episodes: 7,
      total_episodes: 12,
    },
  ],
};
let data: Map<string, string>;
beforeEach(() => {
  data = new Map([
    ['animeSeasons', JSON.stringify(bundle.seasons)],
    ['anime_watchlist', JSON.stringify(bundle.watchlist)],
  ]);
  vi.mocked(localStorage.getItem).mockImplementation((key) => data.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
    data.set(key, value);
  });
  vi.mocked(localStorage.removeItem).mockImplementation((key) => {
    data.delete(key);
  });
});
describe('ファイル検証', () => {
  it('現在の書き出しを読み込める', () => {
    expect(
      parseRecordFile(recordsToJson(bundle.seasons, bundle.watchlist)).watchlist[0].watched_episodes
    ).toBe(7);
  });
  it.each([
    '[]',
    '{broken',
    '{"format":"other","version":1}',
    '{"format":"animelog-records","version":2}',
  ])('形式が不明なファイルを拒否する: %s', (value) => {
    expect(() => parseRecordFile(value)).toThrow();
  });
  it.each([
    { rating: 9 },
    { id: {} },
    { image: 'javascript:alert(1)' },
    { quotes: [{ text: 12 }] },
    { importKey: 'invalid' },
  ])('不正な作品を拒否する', (change) => {
    expect(() =>
      validateBundle({
        ...bundle,
        seasons: [{ name: '2026年夏', animes: [{ ...manual, ...change }] }],
      })
    ).toThrow();
  });
  it('所有者IDなどの外部指定を取り込まない', () => {
    const result = validateBundle({
      ...bundle,
      watchlist: [{ ...bundle.watchlist[0], user_id: 'another-owner' }],
    });
    expect(result.watchlist[0]).not.toHaveProperty('user_id');
  });
  it('話数の上下関係を検証する', () => {
    expect(() =>
      validateBundle({ ...bundle, watchlist: [{ ...bundle.watchlist[0], total_episodes: 2 }] })
    ).toThrow();
  });
});
describe('追加のみの統合', () => {
  it('同名の手動作品をID違いで区別し、再実行時は新しいローカルIDでも重複させない', async () => {
    const source = await prepareBundle(bundle);
    const existing = await prepareBundle({
      seasons: [{ name: '2026年夏', animes: [{ ...manual, id: 2 }] }],
      watchlist: [],
    });
    const plan = planImport(source, existing);
    expect(plan.animeCount).toBe(1);
    const merged = mergeGuestRecords(existing, plan.additions);
    expect(typeof merged.seasons[0].animes[1].id).toBe('number');
    const again = planImport(source, await prepareBundle(merged));
    expect(again.animeCount + again.watchlistCount).toBe(0);
  });
  it('AniList IDが同じなら既存の評価を残し、同じファイル内の重複も省く', async () => {
    const source = await prepareBundle({
      seasons: [
        {
          name: '2026年夏',
          animes: [
            { ...manual, anilistId: 12 },
            { ...manual, id: 2, anilistId: 12 },
          ],
        },
      ],
      watchlist: [],
    });
    const destination = await prepareBundle({
      seasons: [
        { name: '2026年春', animes: [{ ...manual, id: 'uuid', anilistId: 12, rating: 5 }] },
      ],
      watchlist: [],
    });
    expect(planImport(source, destination)).toMatchObject({ animeCount: 0, skipped: 2 });
    expect(destination.seasons[0].animes[0].rating).toBe(5);
    expect(planImport(source, { seasons: [], watchlist: [] })).toMatchObject({
      animeCount: 1,
      skipped: 1,
    });
  });
  it('空の保存先へUUIDの作品を取り込む場合も新しいnumber IDにする', async () => {
    const source = await prepareBundle({
      seasons: [{ name: '2026年夏', animes: [{ ...manual, id: 'uuid' }] }],
      watchlist: [],
    });
    expect(
      typeof mergeGuestRecords({ seasons: [], watchlist: [] }, source).seasons[0].animes[0].id
    ).toBe('number');
  });
  it('JSONプロパティの順番が違っても同じ指紋になる', async () => {
    expect(await fingerprint({ a: 1, b: 2 })).toBe(await fingerprint({ b: 2, a: 1 }));
  });
});
describe('端末保存の失敗と控え', () => {
  it('確認後に編集された記録を上書きしない', async () => {
    const snapshot = await readGuestSnapshot();
    data.set('animeSeasons', '[]');
    expect(() => saveGuestImport(snapshot, bundle)).toThrow('確認後');
    expect(data.get('animeSeasons')).toBe('[]');
  });
  it('2つ目の保存が失敗したら元に戻し、復元前の控えを残す', async () => {
    const snapshot = await readGuestSnapshot();
    let fail = true;
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
      if (key === 'anime_watchlist' && fail) {
        fail = false;
        throw new Error('full');
      }
      data.set(key, value);
    });
    expect(() => saveGuestImport(snapshot, { seasons: [], watchlist: [] })).toThrow(
      '元の記録に戻しました'
    );
    expect(data.get('animeSeasons')).toBe(snapshot.seasonsRaw);
    expect(data.get('anime_watchlist')).toBe(snapshot.watchlistRaw);
    expect(parseRecordFile(data.get(BEFORE_IMPORT_KEY)!).seasons[0].animes[0].title).toBe(
      '手動作品'
    );
  });
  it('控えすら保存できないときは記録を一切変えない', async () => {
    const snapshot = await readGuestSnapshot();
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error('full');
    });
    expect(() => saveGuestImport(snapshot, { seasons: [], watchlist: [] })).toThrow();
    expect(data.get('animeSeasons')).toBe(snapshot.seasonsRaw);
  });
});
