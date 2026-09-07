import type { Anime, Season } from '../../types';
import type { WatchlistItem } from '../storage/types';
import { validateBundle, type RecordBundle } from './importValidation';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row)
      .filter((key) => row[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(row[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
export async function fingerprint(value: unknown): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function prepareBundle(input: RecordBundle): Promise<RecordBundle> {
  const bundle = validateBundle(input);
  return {
    seasons: await Promise.all(
      bundle.seasons.map(async (season) => ({
        ...season,
        animes: await Promise.all(
          season.animes.map(async (anime) => ({
            ...anime,
            importKey:
              anime.importKey ?? (await fingerprint({ kind: 'anime', season: season.name, anime })),
          }))
        ),
      }))
    ),
    watchlist: await Promise.all(
      bundle.watchlist.map(async (item) => ({
        ...item,
        import_key: item.import_key ?? (await fingerprint({ kind: 'watchlist', item })),
      }))
    ),
  };
}
const animeKey = (anime: Anime) =>
  anime.anilistId ? `anilist:${anime.anilistId}` : `manual:${anime.importKey}`;
const watchKey = (item: WatchlistItem) =>
  item.anilist_id > 0 ? `anilist:${item.anilist_id}` : `manual:${item.import_key}`;

export function planImport(source: RecordBundle, destination: RecordBundle) {
  const animeKeys = new Set(destination.seasons.flatMap((season) => season.animes.map(animeKey)));
  const watchKeys = new Set(destination.watchlist.map(watchKey));
  let skipped = 0;
  const seasons: Season[] = source.seasons
    .map((season) => ({
      ...season,
      animes: season.animes.filter((anime) => {
        const key = animeKey(anime);
        if (animeKeys.has(key)) {
          skipped++;
          return false;
        }
        animeKeys.add(key);
        return true;
      }),
    }))
    .filter((season) => season.animes.length);
  const watchlist = source.watchlist.filter((item) => {
    const key = watchKey(item);
    if (watchKeys.has(key)) {
      skipped++;
      return false;
    }
    watchKeys.add(key);
    return true;
  });
  return {
    additions: { seasons, watchlist },
    skipped,
    animeCount: seasons.reduce((sum, season) => sum + season.animes.length, 0),
    watchlistCount: watchlist.length,
  };
}

/** 元データを上書きせず、新しいローカルIDを割り振る。手動作品にも再実行用のキーを残す。 */
export function mergeGuestRecords(
  destination: RecordBundle,
  additions: RecordBundle
): RecordBundle {
  let nextId = destination.seasons.reduce(
    (max, season) =>
      season.animes.reduce(
        (n, anime) => (typeof anime.id === 'number' ? Math.max(n, anime.id) : n),
        max
      ),
    1000000
  );
  const seasons = destination.seasons.map((season) => ({ ...season, animes: [...season.animes] }));
  for (const season of additions.seasons) {
    let target = seasons.find((row) => row.name === season.name);
    if (!target) {
      target = { name: season.name, animes: [] };
      seasons.push(target);
    }
    for (const anime of season.animes) {
      nextId++;
      if (!Number.isSafeInteger(nextId)) throw new Error('端末の作品IDを割り当てられませんでした');
      target.animes.push({ ...anime, id: nextId });
    }
  }
  return {
    seasons,
    watchlist: [
      ...destination.watchlist,
      ...additions.watchlist.map((item) => ({ ...item, id: crypto.randomUUID() })),
    ],
  };
}
