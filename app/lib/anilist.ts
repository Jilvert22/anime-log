const ANILIST_API = 'https://graphql.anilist.co';

export type AniListMedia = {
  id: number;
  title: {
    native: string | null;
    romaji: string | null;
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
  }[];
  format?: string;
  episodes?: number | null;
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
            }
          }
        }
      }
    `,
    variables: { search: query }
  };

  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphqlQuery)
  });

  const data = await response.json();
  return data.data.Page.media as AniListMedia[];
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

  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphqlQuery)
  });

  const data = await response.json();
  return {
    media: data.data.Page.media as AniListMedia[],
    pageInfo: data.data.Page.pageInfo as {
      total: number;
      currentPage: number;
      hasNextPage: boolean;
    }
  };
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

  while (hasNextPage) {
    const result = await searchAnimeBySeason(season, seasonYear, currentPage, perPage);
    allMedia.push(...result.media);
    hasNextPage = result.pageInfo.hasNextPage;
    currentPage++;
    
    // 無限ループ防止（最大100ページ）
    if (currentPage > 100) break;
  }

  return allMedia;
}
