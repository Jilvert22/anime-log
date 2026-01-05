/**
 * AniList API関連
 * GraphQL APIのラッパー関数
 */

import { fetchWithRetry, parseJsonResponse, checkResponseStatus } from './client';
import { NetworkError, logError, normalizeError } from './errors';
import type { AniListMedia } from '../anilist';

const ANILIST_API = 'https://graphql.anilist.co';

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

    const data = await parseJsonResponse<{ data?: T; errors?: Array<{ message: string }> }>(response);

    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map(e => e.message).join(', ');
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
            }
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

    const data = await queryAniList<{ Page: { media: AniListMedia[] } }>(
      graphqlQuery,
      { search: query }
    );

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

// 既存のanilist.tsから型を再エクスポート
export type { AniListMedia } from '../anilist';

