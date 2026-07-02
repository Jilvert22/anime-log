/**
 * AniList API の特性テスト (characterization test)
 *
 * Phase 2 で旧 app/lib/anilist.ts と新 app/lib/api/anilist.ts を1本に統合した。
 * 統合方針は「両実装のフィールドの和集合」。このテストは統合後の単一実装が
 * その和集合を満たし、かつ元の各挙動を保持していることを検証する。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  searchAnime,
  searchAnimeBySeason,
  getBroadcastInfo,
  getOfficialSiteUrl,
  getAnimeDetail,
  type AniListMedia,
} from '../../app/lib/api/anilist';

// --- fetch モックのユーティリティ ------------------------------------------

/** parseJsonResponse は response.text() を使うため text/json 両対応の Response を返す */
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

// --- getBroadcastInfo -------------------------------------------------------

describe('getBroadcastInfo', () => {
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
    expect(getBroadcastInfo(input)).toEqual(expected);
  });
});

// --- getOfficialSiteUrl -----------------------------------------------------

describe('getOfficialSiteUrl', () => {
  const base = { title: { native: null, romaji: null }, coverImage: null } as AniListMedia;

  it('type === INFO のリンクを優先', () => {
    const media = {
      ...base,
      externalLinks: [
        { site: 'Twitter', url: 'https://t', type: 'SOCIAL' },
        { site: 'x', url: 'https://info', type: 'INFO' },
      ],
    } as AniListMedia;
    expect(getOfficialSiteUrl(media)).toBe('https://info');
  });

  it('site === "Official Site" でも拾う', () => {
    const media = {
      ...base,
      externalLinks: [{ site: 'Official Site', url: 'https://official' }],
    } as AniListMedia;
    expect(getOfficialSiteUrl(media)).toBe('https://official');
  });

  it('該当リンクが無ければ siteUrl にフォールバック', () => {
    const media = { ...base, externalLinks: [], siteUrl: 'https://anilist' } as AniListMedia;
    expect(getOfficialSiteUrl(media)).toBe('https://anilist');
  });

  it('何も無ければ null', () => {
    expect(getOfficialSiteUrl(base)).toBeNull();
  });
});

// --- searchAnime ------------------------------------------------------------

describe('searchAnime', () => {
  it('成功時に media 配列を返す', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [{ id: 1 }] } } }));
    await expect(searchAnime('鬼滅')).resolves.toEqual([{ id: 1 }]);
  });

  it('API エラー時は空配列 (握りつぶし)', async () => {
    fetchMock.mockResolvedValue(makeResponse({ errors: [{ message: 'boom' }] }));
    await expect(searchAnime('x')).resolves.toEqual([]);
  });

  it('空文字クエリは通信せず即 [] (新実装由来のショートサーキット)', async () => {
    await expect(searchAnime('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('和集合: externalLinks.type を取得する (旧実装由来)', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [] } } }));
    await searchAnime('x');
    expect(externalLinksBlock(lastQuery(fetchMock))).toContain('type');
  });
});

// --- searchAnimeBySeason ----------------------------------------------------

describe('searchAnimeBySeason', () => {
  const ok = {
    data: {
      Page: { media: [{ id: 1 }], pageInfo: { total: 1, currentPage: 1, hasNextPage: false } },
    },
  };

  it('media と pageInfo を返す', async () => {
    fetchMock.mockResolvedValue(makeResponse(ok));
    await expect(searchAnimeBySeason('SPRING', 2025)).resolves.toEqual({
      media: [{ id: 1 }],
      pageInfo: { total: 1, currentPage: 1, hasNextPage: false },
    });
  });

  it('和集合: 継続判定用の status/startDate/endDate を取得する (新実装由来)', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Page: { media: [], pageInfo: {} } } }));
    await searchAnimeBySeason('SPRING', 2025);
    const q = lastQuery(fetchMock);
    expect(q).toContain('status');
    expect(q).toContain('startDate');
    expect(q).toContain('endDate');
  });
});

// --- getAnimeDetail ---------------------------------------------------------

describe('getAnimeDetail', () => {
  it('Media を返す', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Media: { id: 42 } } }));
    await expect(getAnimeDetail(42)).resolves.toEqual({ id: 42 });
  });

  it('見つからない (Media: null) 場合は null', async () => {
    fetchMock.mockResolvedValue(makeResponse({ data: { Media: null } }));
    await expect(getAnimeDetail(999)).resolves.toBeNull();
  });

  it('API エラー時は null', async () => {
    fetchMock.mockResolvedValue(makeResponse({ errors: [{ message: 'boom' }] }));
    await expect(getAnimeDetail(1)).resolves.toBeNull();
  });
});
