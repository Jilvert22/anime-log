/**
 * AniList API の特性テスト (characterization test)
 *
 * 目的: Phase 2 で「旧 app/lib/anilist.ts」と「新 app/lib/api/anilist.ts」を
 *       1本に統合する前に、両実装の現挙動を固定する。
 *       仕様の正しさではなく「統合で挙動を変えていないこと」を検証する網。
 *
 * このファイルの最下部 describe('新旧実装の差分') が Phase 2 の統合仕様書を兼ねる:
 *   統合後の1本は「両者のフィールドの和集合」を満たすこと。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as oldApi from '../../app/lib/anilist';
import * as newApi from '../../app/lib/api/anilist';
import type { AniListMedia } from '../../app/lib/anilist';

// --- fetch モックのユーティリティ ------------------------------------------

/** 旧実装は response.json()、新実装は response.text() を使うため両対応の Response を返す */
function makeResponse(payload: unknown) {
  const body = JSON.stringify(payload);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => JSON.parse(body),
    text: async () => body,
  } as Response;
}

/** 直近の fetch 呼び出しから GraphQL クエリ文字列を取り出す */
function lastQuery(fetchMock: ReturnType<typeof vi.fn>): string {
  const call = fetchMock.mock.calls.at(-1);
  const init = call?.[1] as RequestInit;
  return JSON.parse(init.body as string).query as string;
}

/** externalLinks { ... } ブロックの中身だけを抜き出す (type: ANIME 等の誤検出を防ぐ) */
function externalLinksBlock(query: string): string {
  return query.match(/externalLinks\s*(?:\([^)]*\))?\s*\{([^}]*)\}/)?.[1] ?? '';
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --- getBroadcastInfo (新旧で完全一致) --------------------------------------

describe('getBroadcastInfo — 新旧同一実装', () => {
  // airingAt は Unix 秒。JST(UTC+9) に変換した曜日(0=日)と HH:mm を返す。
  const cases: Array<[string, AniListMedia, { day: number | null; time: string | null }]> = [
    [
      'UTC 金14:30 → JST 金23:30 (同日)',
      {
        nextAiringEpisode: { airingAt: 1743777000, timeUntilAiring: 0, episode: 1 },
      } as AniListMedia,
      { day: 5, time: '23:30' },
    ],
    [
      'UTC 金16:00 → JST 土01:00 (日跨ぎの繰り上げ)',
      {
        nextAiringEpisode: { airingAt: 1743782400, timeUntilAiring: 0, episode: 1 },
      } as AniListMedia,
      { day: 6, time: '01:00' },
    ],
    [
      'nextAiringEpisode が無ければ airingSchedule にフォールバック',
      {
        airingSchedule: { nodes: [{ airingAt: 1743777000, timeUntilAiring: 0, episode: 1 }] },
      } as AniListMedia,
      { day: 5, time: '23:30' },
    ],
    ['放送情報が皆無なら null', {} as AniListMedia, { day: null, time: null }],
    // 既知の癖: airingAt=0 は falsy 判定で null 扱い (統合時に意図せず変えないこと)
    [
      'airingAt=0 は null 扱い (現状の癖)',
      { nextAiringEpisode: { airingAt: 0, timeUntilAiring: 0, episode: 1 } } as AniListMedia,
      { day: null, time: null },
    ],
  ];

  it.each(cases)('%s', (_label, input, expected) => {
    expect(oldApi.getBroadcastInfo(input)).toEqual(expected);
    // 新実装も同一の結果を返すこと
    expect(newApi.getBroadcastInfo(input)).toEqual(expected);
  });
});

// --- getOfficialSiteUrl (旧のみに存在。統合後も残すこと) ----------------------

describe('getOfficialSiteUrl — 旧のみ (Phase 2で統合先へ移設)', () => {
  const base = { title: { native: null, romaji: null }, coverImage: null } as AniListMedia;

  it('type === INFO のリンクを優先', () => {
    const media = {
      ...base,
      externalLinks: [
        { site: 'Twitter', url: 'https://t', type: 'SOCIAL' },
        { site: 'x', url: 'https://info', type: 'INFO' },
      ],
    } as AniListMedia;
    expect(oldApi.getOfficialSiteUrl(media)).toBe('https://info');
  });

  it('site === "Official Site" でも拾う', () => {
    const media = {
      ...base,
      externalLinks: [{ site: 'Official Site', url: 'https://official' }],
    } as AniListMedia;
    expect(oldApi.getOfficialSiteUrl(media)).toBe('https://official');
  });

  it('該当リンクが無ければ siteUrl にフォールバック', () => {
    const media = { ...base, externalLinks: [], siteUrl: 'https://anilist' } as AniListMedia;
    expect(oldApi.getOfficialSiteUrl(media)).toBe('https://anilist');
  });

  it('何も無ければ null', () => {
    expect(oldApi.getOfficialSiteUrl(base)).toBeNull();
  });
});

// --- searchAnime (新旧で挙動差あり) -----------------------------------------

describe('searchAnime — 現挙動の固定', () => {
  it('旧: 成功時に media 配列を返す', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [{ id: 1 }] } } }));
    await expect(oldApi.searchAnime('鬼滅')).resolves.toEqual([{ id: 1 }]);
  });

  it('新: 成功時に media 配列を返す', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [{ id: 1 }] } } }));
    await expect(newApi.searchAnime('鬼滅')).resolves.toEqual([{ id: 1 }]);
  });

  it('旧新とも: API エラー時は空配列 (握りつぶし)', async () => {
    fetchMock.mockResolvedValue(makeResponse({ errors: [{ message: 'boom' }] }));
    await expect(oldApi.searchAnime('x')).resolves.toEqual([]);
    await expect(newApi.searchAnime('x')).resolves.toEqual([]);
  });
});

// --- searchAnimeBySeason (新旧で挙動差あり) ----------------------------------

describe('searchAnimeBySeason — 現挙動の固定', () => {
  const ok = {
    data: {
      Page: { media: [{ id: 1 }], pageInfo: { total: 1, currentPage: 1, hasNextPage: false } },
    },
  };

  it('旧新とも: media と pageInfo を返す', async () => {
    fetchMock.mockResolvedValue(makeResponse(ok));
    await expect(oldApi.searchAnimeBySeason('SPRING', 2025)).resolves.toEqual({
      media: [{ id: 1 }],
      pageInfo: { total: 1, currentPage: 1, hasNextPage: false },
    });
    fetchMock.mockResolvedValue(makeResponse(ok));
    await expect(newApi.searchAnimeBySeason('SPRING', 2025)).resolves.toEqual({
      media: [{ id: 1 }],
      pageInfo: { total: 1, currentPage: 1, hasNextPage: false },
    });
  });
});

// --- 新旧実装の差分 = Phase 2 の統合仕様書 -----------------------------------
//
// ここで「現状ズレている点」をコードとして固定する。Phase 2 の統合では
// 各テストの意図(和集合)を満たすよう1本化し、下記のアサーションを
// 「統合後の1実装」に対して通るよう書き換える。

describe('新旧差分 (Phase 2で和集合に統合すること)', () => {
  it('差分1: searchAnime の externalLinks.type は旧のみ取得 → 統合後も残す', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [] } } }));
    await oldApi.searchAnime('x');
    expect(externalLinksBlock(lastQuery(fetchMock))).toContain('type');

    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [] } } }));
    await newApi.searchAnime('x');
    // 現状: 新は type を取っていない (これが失われている挙動)
    expect(externalLinksBlock(lastQuery(fetchMock))).not.toContain('type');
  });

  it('差分2: searchAnimeBySeason の status/startDate/endDate は新のみ取得 → 統合後も残す', async () => {
    const ok = makeResponse({ data: { Page: { media: [], pageInfo: {} } } });

    fetchMock.mockResolvedValue(ok);
    await oldApi.searchAnimeBySeason('SPRING', 2025);
    const oldQ = lastQuery(fetchMock);
    // 現状: 旧は継続判定に必要な status/startDate/endDate を取れていない
    expect(oldQ).not.toContain('status');
    expect(oldQ).not.toContain('startDate');

    fetchMock.mockResolvedValue(ok);
    await newApi.searchAnimeBySeason('SPRING', 2025);
    const newQ = lastQuery(fetchMock);
    expect(newQ).toContain('status');
    expect(newQ).toContain('startDate');
    expect(newQ).toContain('endDate');
  });

  it('差分3: 新 searchAnime は空文字クエリを通信せず即 [] (旧は通信する)', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [] } } }));
    await expect(newApi.searchAnime('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled(); // 新はショートサーキット

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [] } } }));
    await oldApi.searchAnime('   ');
    expect(fetchMock).toHaveBeenCalled(); // 旧は通信する
  });
});
