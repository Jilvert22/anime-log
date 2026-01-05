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
};

export async function searchAnime(query: string) {
  const graphqlQuery = {
    query: `
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
    `,
    variables: { search: query }
  };

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('AniList API エラー:', data.errors);
      return [];
    }
    
    return data.data?.Page?.media as AniListMedia[] || [];
  } catch (error) {
    console.error('アニメ検索に失敗しました:', error);
    return [];
  }
}

// クール検索関数
export async function searchAnimeBySeason(
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER',
  seasonYear: number,
  page: number = 1,
  perPage: number = 50
) {
  const graphqlQuery = {
    query: `
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
    `,
    variables: { 
      season,
      seasonYear,
      page,
      perPage
    }
  };

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('AniList API エラー:', data.errors);
      return {
        media: [],
        pageInfo: {
          total: 0,
          currentPage: page,
          hasNextPage: false
        }
      };
    }
    
    return {
      media: data.data?.Page?.media as AniListMedia[] || [],
      pageInfo: data.data?.Page?.pageInfo as {
        total: number;
        currentPage: number;
        hasNextPage: boolean;
      } || {
        total: 0,
        currentPage: page,
        hasNextPage: false
      }
    };
  } catch (error) {
    console.error('シーズン検索に失敗しました:', error);
    return {
      media: [],
      pageInfo: {
        total: 0,
        currentPage: page,
        hasNextPage: false
      }
    };
  }
}

// クール検索関数（全件取得）
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
    console.error('シーズン検索（全件取得）に失敗しました:', error);
    // エラーが発生しても、取得できた分は返す
  }

  return allMedia;
}

// 放送情報を取得（曜日と時間を返す）
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

// アニメの詳細情報を取得（AniList IDから）
export async function getAnimeDetail(anilistId: number): Promise<AniListMedia | null> {
  const graphqlQuery = {
    query: `
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
    `,
    variables: { id: anilistId }
  };

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('AniList API エラー:', data.errors);
      return null;
    }
    
    return data.data?.Media as AniListMedia | null;
  } catch (error) {
    console.error('アニメ詳細情報の取得に失敗しました:', error);
    return null;
  }
}
