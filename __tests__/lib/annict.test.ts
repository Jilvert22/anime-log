import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AniListMedia } from '../../app/lib/api/anilist';
import {
  mergeWithAnnictData,
  searchAnnictBySeason,
  searchAnnictByTitle,
} from '../../app/lib/api/annict';

const upstream = 'https://api.annict.com/graphql';
const workTitle = '合成アニメ';
const startedAt = '2026-11-20T21:30:00';
const programs = [
  { startedAt, channel: { name: '架空テレビ', annictId: 12 } },
  { startedAt, channel: { name: 'ABEMA' } },
];
const sampleWork = {
  title: workTitle,
  programs: { nodes: programs },
  annictId: 42,
  image: { url: 'https://example.invalid/image' },
  casts: { nodes: [] },
};
const result = (nodes: unknown[] = [sampleWork]) =>
  Response.json({
    data: { searchWorks: { nodes, pageInfo: { endCursor: 'cursor' } } },
    extensions: { upstreamDetail: 'internal' },
  });

const titleSearch = { kind: 'title', term: workTitle, first: 1 };

// 固定化前のクライアントが送信していたリクエスト。
const legacyTitleSearch = {
  query: `
    query SearchWorks($titles: [String!]!, $first: Int) {
      searchWorks(titles: $titles, first: $first) {
        nodes {
          annictId
          title
          titleKana
          media
          officialSiteUrl
          twitterHashtag
          programs {
            nodes {
              startedAt
              channel {
                name
              }
            }
          }
          casts {
            nodes {
              character {
                name
              }
              person {
                name
              }
            }
          }
        }
      }
    }
  `,
  variables: { titles: [workTitle], first: 20 },
};
const legacySeasonSearch = {
  query: `
    query SearchWorks($season: [String!], $first: Int) {
      searchWorks(seasons: $season, first: $first) {
        nodes {
          annictId
          title
          titleKana
          media
          officialSiteUrl
          twitterHashtag
          programs {
            nodes {
              startedAt
              channel {
                name
              }
            }
          }
          casts {
            nodes {
              character {
                name
              }
              person {
                name
              }
            }
          }
        }
      }
    }
  `,
  variables: { season: ['2026-fall'], first: 100 },
};

function request(body: string) {
  return new Request('https://example.invalid/api/annict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('ANNICT_TOKEN', 'synthetic-annict-token');
  vi.spyOn(Date, 'now').mockReturnValue(1_000);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function mockUpstream(response: () => Promise<Response> = async () => result()) {
  const { POST } = await import('../../app/api/annict/route');
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/annict') return POST(request(String(init?.body)));
    if (url === upstream) return response();
    throw new Error('Unexpected request in Annict test');
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, post: (body: unknown) => POST(request(JSON.stringify(body))), POST };
}

describe('Annict 作品検索', () => {
  it.each([
    {
      kind: 'title',
      term: workTitle,
      first: 20,
      run: () => searchAnnictByTitle('  ' + workTitle + '  ', 20),
      operation: 'SearchByTitle',
      filter: 'titles',
    },
    {
      kind: 'season',
      term: '2026-fall',
      first: 100,
      run: () => searchAnnictBySeason('2026-fall', 100),
      operation: 'SearchBySeason',
      filter: 'seasons',
    },
  ])('$kind の固定検索から放送と配信情報を表示用データへ統合する', async (example) => {
    const { fetchMock } = await mockUpstream();
    const works = await example.run();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/annict',
      expect.objectContaining({
        body: JSON.stringify({
          kind: example.kind,
          term: example.kind === 'title' ? '  ' + workTitle + '  ' : example.term,
          first: example.first,
        }),
      })
    );
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(upstream);
    const { query, variables } = JSON.parse(String(init?.body));
    expect(query).toContain('query ' + example.operation);
    expect(query).toContain('searchWorks(' + example.filter + ': $terms, first: $first)');
    expect(query).toContain('programs(first: 100)');
    expect(query).not.toMatch(/image|casts|annictId|pageInfo|viewer/);
    expect(variables).toEqual({ terms: [example.term], first: example.first });

    expect(works).toEqual([
      {
        title: workTitle,
        programs: {
          nodes: [
            { startedAt, channel: { name: '架空テレビ' } },
            { startedAt, channel: { name: 'ABEMA' } },
          ],
        },
      },
    ]);
    const media = { id: 99, title: { native: workTitle } } as AniListMedia;
    expect(await mergeWithAnnictData([media], works)).toMatchObject([
      {
        id: 99,
        broadcastTime: '金 21:30',
        broadcastChannels: ['架空テレビ'],
        streamingServices: ['ABEMA'],
      },
    ]);
  });

  it('上流が件数上限を超えた場合も応答を制限する', async () => {
    const { post } = await mockUpstream(async () =>
      result([{ ...sampleWork, programs: { nodes: Array(101).fill(programs[0]) } }, sampleWork])
    );
    const response = await post(titleSearch);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const { works } = await response.json();
    expect(works).toHaveLength(1);
    expect(works[0].programs.nodes).toHaveLength(100);
  });

  it.each([
    [legacyTitleSearch, 'title', workTitle, 20],
    [legacySeasonSearch, 'season', '2026-fall', 100],
  ] as const)('既知の旧形式を固定検索へ変換する (%#)', async (legacy, kind, term, first) => {
    const { fetchMock, post } = await mockUpstream();
    const modernResponse = await post({ kind, term, first });
    const legacyResponse = await post(legacy);
    expect(legacyResponse.status).toBe(200);
    expect(legacyResponse.headers.get('Cache-Control')).toBe('no-store');

    const { works } = await modernResponse.json();
    expect(works).toHaveLength(1);
    expect(await legacyResponse.json()).toEqual({ data: { searchWorks: { nodes: works } } });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = fetchMock.mock.calls[1][1]?.body;
    expect(body).toBe(fetchMock.mock.calls[0][1]?.body);
    const sent = JSON.parse(String(body));
    expect(sent.query).not.toBe(legacy.query);
    expect(sent.query).not.toMatch(/annictId|casts|media|twitterHashtag/);
    expect(sent.variables).toEqual({ terms: [term], first });
  });

  it('旧形式で操作や変数を変更したリクエストを上流へ送らない', async () => {
    const { fetchMock, post } = await mockUpstream();
    const { query } = legacyTitleSearch;
    const bodies = [
      { ...legacyTitleSearch, query: query.trim() },
      { ...legacyTitleSearch, query: query + ' query Extra { __typename }' },
      { ...legacyTitleSearch, query: query.replace('titleKana', 'malAnimeId') },
      { ...legacyTitleSearch, operationName: 'SearchWorks' },
      { ...legacyTitleSearch, variables: null },
      { ...legacyTitleSearch, variables: { titles: workTitle, first: 20 } },
      { ...legacyTitleSearch, variables: { titles: [workTitle, '別の作品'], first: 20 } },
      { ...legacyTitleSearch, variables: { titles: [], first: 20 } },
      { ...legacyTitleSearch, variables: { titles: ['長'.repeat(201)], first: 20 } },
      { ...legacyTitleSearch, variables: { titles: [workTitle], first: 21 } },
      { ...legacyTitleSearch, variables: { titles: [workTitle], first: 20, after: 'cursor' } },
      { ...legacySeasonSearch, variables: { season: ['2026-FALL'], first: 100 } },
      { ...legacySeasonSearch, variables: { season: ['2026-fall'], first: 101 } },
      { ...legacySeasonSearch, variables: { seasons: ['2026-fall'], first: 100 } },
    ];
    for (const body of bodies) {
      const response = await post(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'invalid_search' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('未知の操作、入力範囲外、不正なJSONを上流へ送らない', async () => {
    const { fetchMock, post, POST } = await mockUpstream();
    const bodies = [
      null,
      { query: 'query SearchWorks { searchWorks { nodes { title } } }', variables: {} },
      { ...titleSearch, query: 'query Extra { __typename }' },
      { ...titleSearch, kind: 'other' },
      { ...titleSearch, term: ['合成アニメ'] },
      { ...titleSearch, term: '　 ' },
      { ...titleSearch, term: '長'.repeat(201) },
      { ...titleSearch, first: 0 },
      { ...titleSearch, first: 1.5 },
      { ...titleSearch, first: '1' },
      { ...titleSearch, first: 21 },
      { kind: 'season', term: '2026-FALL', first: 100 },
      { kind: 'season', term: '2026-fall', first: 101 },
    ];
    for (const body of bodies) {
      const response = await post(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'invalid_search' });
    }
    expect((await POST(request('{'))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { header: '17', seconds: 17 },
    { header: 'invalid upstream detail', seconds: 60 },
    { header: null, seconds: 60 },
  ])('429 の Retry-After ($header) に従って待機する', async ({ header, seconds }) => {
    const headers = new Headers();
    if (header !== null) headers.set('Retry-After', header);
    const { fetchMock, post } = await mockUpstream(
      vi
        .fn<() => Promise<Response>>()
        .mockResolvedValueOnce(
          Response.json({ errors: ['internal detail'] }, { status: 429, headers })
        )
        .mockResolvedValueOnce(result())
    );

    const response = await post(titleSearch);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe(String(seconds));
    expect(await response.json()).toEqual({ error: 'rate_limited' });

    vi.mocked(Date.now).mockReturnValue(2_000);
    const waiting = await post(legacySeasonSearch);
    expect(waiting.status).toBe(429);
    expect(waiting.headers.get('Retry-After')).toBe(String(seconds - 1));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.mocked(Date.now).mockReturnValue(1_000 + seconds * 1_000);
    expect((await post(legacySeasonSearch)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    () => Response.json({ secret: 'upstream detail' }, { status: 403 }),
    () => Response.json({ errors: [{ message: 'upstream detail' }] }),
    () => new Response('upstream detail'),
  ])('HTTP・GraphQL・JSONエラーの詳細を隠す', async (response) => {
    const { post } = await mockUpstream(async () => response());
    const failure = await post(titleSearch);
    expect(failure.status).toBe(502);
    expect(await failure.json()).toEqual({ error: 'search_unavailable' });
  });

  it('アダプターは 429 を再試行せず待機時間後に検索を再開できる', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { fetchMock } = await mockUpstream(
      vi
        .fn<() => Promise<Response>>()
        .mockResolvedValueOnce(
          new Response(null, { status: 429, headers: { 'Retry-After': '12' } })
        )
        .mockResolvedValueOnce(result())
    );
    const { searchAnnictByTitle, searchAnnictBySeason } = await import('../../app/lib/api/annict');

    await expect(searchAnnictByTitle(workTitle)).rejects.toThrow('しばらくしてから');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.mocked(Date.now).mockReturnValue(12_000);
    await expect(searchAnnictBySeason('2026-fall')).rejects.toThrow('しばらくしてから');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.mocked(Date.now).mockReturnValue(13_000);
    await expect(searchAnnictByTitle(workTitle)).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
