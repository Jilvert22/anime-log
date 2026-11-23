import { NextResponse } from 'next/server';

import type { AnnictProgram, AnnictSearchRequest, AnnictWork } from '../../lib/api/annict';

const ANNICT_API = 'https://api.annict.com/graphql';
const MAX_TITLE_LENGTH = 200;
const MAX_PROGRAMS = 100;
const DEFAULT_RETRY_AFTER = 60;
const SEASON_FORMAT = /^[1-9][0-9]{3}-(winter|spring|summer|fall)$/;

const WORK_FIELDS = `
  nodes {
    title
    programs(first: ${MAX_PROGRAMS}) {
      nodes { startedAt channel { name } }
    }
  }
`;

const SEARCHES = {
  title: {
    maxResults: 20,
    query: `query SearchByTitle($terms: [String!]!, $first: Int!) {
      searchWorks(titles: $terms, first: $first) { ${WORK_FIELDS} }
    }`,
  },
  season: {
    maxResults: 100,
    query: `query SearchBySeason($terms: [String!]!, $first: Int!) {
      searchWorks(seasons: $terms, first: $first) { ${WORK_FIELDS} }
    }`,
  },
};

// 公開済み Web/PWA の JS が生成する文字列と完全一致させる。
const legacyQuery = (declaration: string, filter: string) => `
    query SearchWorks(${declaration}, $first: Int) {
      searchWorks(${filter}, first: $first) {
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
  `;
const LEGACY_TITLE_QUERY = legacyQuery('$titles: [String!]!', 'titles: $titles');
const LEGACY_SEASON_QUERY = legacyQuery('$season: [String!]', 'seasons: $season');

let blockedUntil = 0;

function isRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

function parseSearch(input: unknown): AnnictSearchRequest | null {
  if (!isRecord(input)) return null;
  if (Object.keys(input).some((key) => !['kind', 'term', 'first'].includes(key))) return null;
  return validateSearch(input.kind, input.term, input.first);
}

function parseLegacySearch(input: Record<string, unknown>): AnnictSearchRequest | null {
  if (Object.keys(input).some((key) => key !== 'query' && key !== 'variables')) return null;
  const { query, variables } = input;
  if (!isRecord(variables)) return null;
  if (query !== LEGACY_TITLE_QUERY && query !== LEGACY_SEASON_QUERY) return null;

  const kind = query === LEGACY_TITLE_QUERY ? 'title' : 'season';
  const filter = kind === 'title' ? 'titles' : 'season';
  if (Object.keys(variables).some((key) => key !== filter && key !== 'first')) return null;
  const terms = variables[filter];
  if (!Array.isArray(terms) || terms.length !== 1) return null;

  return validateSearch(kind, terms[0], variables.first);
}

function validateSearch(kind: unknown, term: unknown, first: unknown): AnnictSearchRequest | null {
  if (kind !== 'title' && kind !== 'season') return null;
  if (
    typeof first !== 'number' ||
    !Number.isInteger(first) ||
    first < 1 ||
    first > SEARCHES[kind].maxResults ||
    typeof term !== 'string'
  ) {
    return null;
  }

  if (kind === 'season') {
    return SEASON_FORMAT.test(term) && term === term.trim() ? { kind, term, first } : null;
  }

  const title = term.trim();
  return title && term.length <= MAX_TITLE_LENGTH ? { kind, term: title, first } : null;
}

function rateLimited(seconds: number) {
  return NextResponse.json(
    { error: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(seconds), 'Cache-Control': 'no-store' } }
  );
}

function unavailable(status = 502) {
  return NextResponse.json({ error: 'search_unavailable' }, { status });
}

function retryAfterSeconds(value: string | null): number {
  const seconds = Number(value);
  if (value && /^\d+$/.test(value) && Number.isSafeInteger(seconds) && seconds <= 86_400) {
    return seconds;
  }
  return DEFAULT_RETRY_AFTER;
}

type AnnictResponse = {
  data?: { searchWorks?: { nodes?: (AnnictWork | null)[] } };
  errors?: unknown[];
};

function projectWork(work: AnnictWork | null): AnnictWork[] {
  if (typeof work?.title !== 'string' || !work.title.trim()) return [];

  const programs: AnnictProgram[] = [];
  const nodes = work.programs?.nodes;
  if (Array.isArray(nodes)) {
    for (const program of nodes.slice(0, MAX_PROGRAMS)) {
      if (
        typeof program?.channel?.name === 'string' &&
        program.channel.name.trim() &&
        typeof program.startedAt === 'string' &&
        Number.isFinite(Date.parse(program.startedAt))
      ) {
        programs.push({ startedAt: program.startedAt, channel: { name: program.channel.name } });
      }
    }
  }
  return [{ title: work.title, programs: { nodes: programs } }];
}

export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  const legacy = isRecord(input) && 'query' in input;
  const search = legacy ? parseLegacySearch(input) : parseSearch(input);
  if (!search) return NextResponse.json({ error: 'invalid_search' }, { status: 400 });

  const secondsRemaining = Math.ceil((blockedUntil - Date.now()) / 1000);
  if (secondsRemaining > 0) return rateLimited(secondsRemaining);

  const token = process.env.ANNICT_TOKEN;
  if (!token) return unavailable(503);

  try {
    const response = await fetch(ANNICT_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: SEARCHES[search.kind].query,
        variables: { terms: [search.term], first: search.first },
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 429) {
      const seconds = retryAfterSeconds(response.headers.get('Retry-After'));
      blockedUntil = Math.max(blockedUntil, Date.now() + seconds * 1000);
      return rateLimited(Math.max(seconds, Math.ceil((blockedUntil - Date.now()) / 1000)));
    }
    if (!response.ok) return unavailable();

    const result: AnnictResponse = await response.json();
    const nodes = result?.data?.searchWorks?.nodes;
    if (result?.errors?.length || !Array.isArray(nodes)) return unavailable();

    const works = nodes.slice(0, search.first).flatMap(projectWork);
    const body = legacy ? { data: { searchWorks: { nodes: works } } } : { works };
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return unavailable();
  }
}
