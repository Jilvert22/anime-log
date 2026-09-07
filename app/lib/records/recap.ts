import type { Anime, Season } from '../../types';
import { parseSeasonName } from '../../utils/helpers';

export function recapYears(seasons: Season[]): number[] {
  return [
    ...new Set(
      seasons.flatMap((season) => {
        const parsed = parseSeasonName(season.name);
        return parsed ? [parsed.year] : [];
      })
    ),
  ].sort((a, b) => b - a);
}

/** クールによる分類。視聴日時を表すデータではない。 */
export function buildRecap(seasons: Season[], year: number) {
  const unique = new Map<string, Anime>();
  for (const season of seasons) {
    if (parseSeasonName(season.name)?.year !== year) continue;
    for (const anime of season.animes) {
      const key =
        anime.anilistId && anime.anilistId > 0
          ? `anilist:${anime.anilistId}`
          : `${typeof anime.id}:${anime.id}`;
      const existing = unique.get(key);
      if (!existing || anime.rating > existing.rating) unique.set(key, anime);
    }
  }
  const animes = [...unique.values()];
  const rated = animes.filter((anime) => anime.rating > 0);
  const favorites = rated
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title, 'ja'))
    .slice(0, 3);
  return {
    year,
    count: animes.length,
    average: rated.length
      ? rated.reduce((sum, anime) => sum + anime.rating, 0) / rated.length
      : null,
    favorites,
  };
}
