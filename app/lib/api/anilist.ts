/**
 * AniList API関連
 * GraphQL APIのラッパー関数（旧 app/lib/anilist.ts を統合した単一の実装）
 */

import { fetchWithRetry, parseJsonResponse, checkResponseStatus } from './client';
import { NetworkError, logError, normalizeError } from './errors';

const ANILIST_API = 'https://graphql.anilist.co';

export type AniListMedia = {
  id: number;
  title: {
    native: string | null;
    romaji: string | null;
    english?: string | null;
  };
  coverImage: {
    medium: string | null;
    large: string | null;
  } | null;
  seasonYear: number | null;
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | null;
  genres: string[];
  studios: {
    nodes: {
      name: string;
    }[];
  } | null;
  externalLinks?: {
    site: string;
    url: string;
    type?: string;
  }[];
  siteUrl?: string;
  format?: string;
  episodes?: number | null;
  airingSchedule?: {
    nodes: {
      airingAt: number;
      timeUntilAiring: number;
      episode: number;
    }[];
  } | null;
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  description?: string | null;
  tags?: {
    name: string;
  }[];
  duration?: number | null;
  source?: string | null;
  trailer?: {
    id: string | null;
    site: string | null;
  } | null;
  averageScore?: number | null;
  synonyms?: string[];
  // 連続2クール判定用フィールド
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | null;
  startDate?: { year: number | null; month: number | null; day?: number | null } | null;
  endDate?: { year: number | null; month: number | null; day?: number | null } | null;
};

/**
 * AniList GraphQL APIにリクエストを送信
 */
async function queryAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  try {
    const response = await fetchWithRetry(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    checkResponseStatus(response);

    const data = await parseJsonResponse<{ data?: T; errors?: Array<{ message: string }> }>(
      response
    );

    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map((e) => e.message).join(', ');
      throw new NetworkError(`AniList API エラー: ${errorMessages}`);
    }

    if (!data.data) {
      throw new NetworkError('AniList API からデータが返されませんでした');
    }

    return data.data;
  } catch (error) {
    logError(error, 'queryAniList');
    throw normalizeError(error);
  }
}

/**
 * アニメを検索
 */
export async function searchAnime(query: string): Promise<AniListMedia[]> {
  try {
    if (!query || !query.trim()) {
      return [];
    }

    const graphqlQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: ANIME) {
            id
            title {
              native
              romaji
            }
            coverImage {
              medium
              large
            }
            seasonYear
            season
            genres
            studios {
              nodes {
                name
              }
            }
            externalLinks {
              site
              url
              type
            }
            siteUrl
            airingSchedule(notYetAired: true, perPage: 1) {
              nodes {
                airingAt
                timeUntilAiring
                episode
              }
            }
            nextAiringEpisode {
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
      }
    `;

    const data = await queryAniList<{ Page: { media: AniListMedia[] } }>(graphqlQuery, {
      search: query,
    });

    return data.Page?.media || [];
  } catch (error) {
    logError(error, 'searchAnime');
    // エラーが発生しても空配列を返す（既存の動作を維持）
    return [];
  }
}

/**
 * クール検索関数
 */
export async function searchAnimeBySeason(
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER',
  seasonYear: number,
  page: number = 1,
  perPage: number = 50
): Promise<{
  media: AniListMedia[];
  pageInfo: {
    total: number;
    currentPage: number;
    hasNextPage: boolean;
  };
}> {
  try {
    const graphqlQuery = `
      query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            hasNextPage
          }
          media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              native
              romaji
            }
            coverImage {
              medium
              large
            }
            seasonYear
            season
            genres
            format
            episodes
            status
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            studios {
              nodes {
                name
              }
            }
            externalLinks {
              site
              url
              type
            }
            siteUrl
            averageScore
            airingSchedule(notYetAired: true, perPage: 1) {
              nodes {
                airingAt
                timeUntilAiring
                episode
              }
            }
            nextAiringEpisode {
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
      }
    `;

    const data = await queryAniList<{
      Page: {
        media: AniListMedia[];
        pageInfo: {
          total: number;
          currentPage: number;
          hasNextPage: boolean;
        };
      };
    }>(graphqlQuery, {
      season,
      seasonYear,
      page,
      perPage,
    });

    return {
      media: data.Page?.media || [],
      pageInfo: data.Page?.pageInfo || {
        total: 0,
        currentPage: page,
        hasNextPage: false,
      },
    };
  } catch (error) {
    logError(error, 'searchAnimeBySeason');
    // エラーが発生しても空の結果を返す（既存の動作を維持）
    return {
      media: [],
      pageInfo: {
        total: 0,
        currentPage: page,
        hasNextPage: false,
      },
    };
  }
}

/**
 * クール検索関数（全件取得）
 */
export async function searchAnimeBySeasonAll(
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER',
  seasonYear: number,
  perPage: number = 50
): Promise<AniListMedia[]> {
  const allMedia: AniListMedia[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const result = await searchAnimeBySeason(season, seasonYear, currentPage, perPage);
      allMedia.push(...result.media);
      hasNextPage = result.pageInfo.hasNextPage;
      currentPage++;

      // 無限ループ防止（最大100ページ）
      if (currentPage > 100) break;
    }
  } catch (error) {
    logError(error, 'searchAnimeBySeasonAll');
    // エラーが発生しても、取得できた分は返す
  }

  return allMedia;
}

/**
 * 放送情報を取得（曜日と時間を返す）
 */
export function getBroadcastInfo(anime: AniListMedia): { day: number | null; time: string | null } {
  // nextAiringEpisodeまたはairingScheduleから取得
  let airingAt: number | null = null;

  if (anime.nextAiringEpisode?.airingAt) {
    airingAt = anime.nextAiringEpisode.airingAt;
  } else if (anime.airingSchedule?.nodes && anime.airingSchedule.nodes.length > 0) {
    airingAt = anime.airingSchedule.nodes[0].airingAt;
  }

  if (!airingAt) {
    return { day: null, time: null };
  }

  // Unixタイムスタンプ（秒）をミリ秒に変換
  const date = new Date(airingAt * 1000);

  // 日本時間に変換（UTC+9）
  // UTC時間から+9時間を計算
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcDay = date.getUTCDay();

  // 日本時間（JST = UTC+9）を計算
  let jstHours = utcHours + 9;
  let jstDay = utcDay;

  // 24時を超えた場合の処理
  if (jstHours >= 24) {
    jstHours -= 24;
    jstDay = (jstDay + 1) % 7;
  }

  // 時間（HH:mm形式、24:00は00:00として扱う）
  const hours = String(jstHours).padStart(2, '0');
  const minutes = String(utcMinutes).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return { day: jstDay, time };
}

/**
 * 公式サイトURLを取得
 * externalLinksから公式サイトを探す
 */
export function getOfficialSiteUrl(media: AniListMedia): string | null {
  // externalLinksから公式サイトを探す
  const officialLink = media.externalLinks?.find(
    (link) => link.type === 'INFO' || link.site === 'Official Site'
  );
  return officialLink?.url || media.siteUrl || null;
}

/**
 * アニメの詳細情報を取得（AniList IDから）
 */
export async function getAnimeDetail(anilistId: number): Promise<AniListMedia | null> {
  const graphqlQuery = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          native
          romaji
          english
        }
        coverImage {
          medium
          large
        }
        description
        genres
        tags {
          name
        }
        episodes
        duration
        source
        studios {
          nodes {
            name
          }
        }
        trailer {
          id
          site
        }
        averageScore
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
        externalLinks {
          url
          site
          type
        }
        siteUrl
        seasonYear
        season
      }
    }
  `;

  try {
    const data = await queryAniList<{ Media: AniListMedia | null }>(graphqlQuery, {
      id: anilistId,
    });
    return data.Media ?? null;
  } catch (error) {
    logError(error, 'getAnimeDetail');
    return null;
  }
}

/**
 * 複数IDの作品を一括取得 (連続2クール判定用に最小フィールドのみ取得)
 * AniListのid_in は1ページ最大50件のため、自動でバッチ分割する
 */
export async function fetchAnimeStatusByIds(ids: number[]): Promise<Map<number, AniListMedia>> {
  const result = new Map<number, AniListMedia>();
  if (ids.length === 0) return result;

  const BATCH = 50;
  const graphqlQuery = `
    query ($ids: [Int], $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(id_in: $ids, type: ANIME) {
          id
          seasonYear
          season
          episodes
          status
          startDate { year month day }
          endDate { year month day }
        }
      }
    }
  `;

  try {
    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH);
      const data = await queryAniList<{ Page: { media: AniListMedia[] } }>(graphqlQuery, {
        ids: slice,
        perPage: slice.length,
      });
      for (const m of data.Page?.media || []) {
        result.set(m.id, m);
      }
    }
  } catch (error) {
    logError(error, 'fetchAnimeStatusByIds');
    // エラー時は取得できた分だけ返す
  }
  return result;
}
