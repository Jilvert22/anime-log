import type { Anime, Season, Song } from '../../types';
import type { WatchlistItem } from '../storage/types';
import { validateProgress } from '../watchlist/progress';

export type RecordBundle = { seasons: Season[]; watchlist: WatchlistItem[] };
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_RECORDS = 5000;
const invalid = (): never => {
  throw new Error('記録の形式または値が正しくありません。ファイルは変更していません。');
};
function obj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 2000): string {
  if (typeof value !== 'string' || value.length > max) return invalid();
  return value;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    return invalid();
  return value;
}
function boolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : invalid();
}
function list(value: unknown, max = MAX_IMPORT_RECORDS): unknown[] {
  if (!Array.isArray(value) || value.length > max) return invalid();
  return value;
}
function strings(value: unknown): string[] | undefined {
  return value == null ? undefined : list(value, 200).map((item) => text(item, 500));
}
function optionalText(value: unknown, max?: number): string | undefined {
  return value == null ? undefined : text(value, max);
}
function image(value: unknown): string {
  if (value == null || value === '') return '';
  const source = text(value, 4000);
  if (source.startsWith('/') && !source.startsWith('//') && !source.includes('\\')) return source;
  try {
    const url = new URL(source);
    if (url.protocol === 'https:' && !url.username && !url.password) return source;
  } catch {
    /* 下のエラーへ */
  }
  return invalid();
}
function importKey(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)) return value;
  return invalid();
}
function song(value: unknown): Song {
  const row = obj(value);
  return {
    title: text(row.title),
    artist: text(row.artist),
    rating: integer(row.rating, 0, 5),
    isFavorite: boolean(row.isFavorite),
  };
}
function anime(value: unknown): Anime {
  const row = obj(value);
  const id =
    typeof row.id === 'number' ? integer(row.id, 0, Number.MAX_SAFE_INTEGER) : text(row.id, 100);
  const songs = row.songs == null ? null : obj(row.songs);
  const title = text(row.title, 1000);
  if (!title.trim()) return invalid();
  return {
    id,
    importKey: importKey(row.importKey),
    anilistId: row.anilistId == null ? undefined : integer(row.anilistId, 1, 2147483647),
    title,
    image: image(row.image),
    rating: integer(row.rating, 0, 5),
    watched: boolean(row.watched),
    rewatchCount: row.rewatchCount == null ? undefined : integer(row.rewatchCount, 0, 100000),
    tags: strings(row.tags),
    seriesName: optionalText(row.seriesName),
    studios: strings(row.studios),
    songs: songs
      ? {
          op: songs.op == null ? undefined : song(songs.op),
          ed: songs.ed == null ? undefined : song(songs.ed),
        }
      : undefined,
    quotes:
      row.quotes == null
        ? undefined
        : list(row.quotes, 1000).map((value) => {
            const quote = obj(value);
            return { text: text(quote.text, 500), character: optionalText(quote.character, 100) };
          }),
    streamingSites: strings(row.streamingSites),
    streamingUpdatedAt: optionalText(row.streamingUpdatedAt),
    // 公開レビューは別テーブルのため、公開者情報ごと復元しない。
  };
}
function watchlist(value: unknown): WatchlistItem {
  const row = obj(value);
  const progress = {
    watched_episodes: row.watched_episodes == null ? 0 : integer(row.watched_episodes, 0, 100000),
    total_episodes: row.total_episodes == null ? null : integer(row.total_episodes, 1, 100000),
  };
  validateProgress(progress);
  const season = row.season ?? null;
  if (season !== null && !['WINTER', 'SPRING', 'SUMMER', 'FALL'].includes(String(season)))
    return invalid();
  const status = row.status ?? null;
  if (status !== null && !['planned', 'watching', 'completed'].includes(String(status)))
    return invalid();
  const title = text(row.title, 1000);
  if (!title.trim()) return invalid();
  const anilistId = integer(row.anilist_id, -1, 2147483647);
  if (anilistId === 0) return invalid();
  const createdAt = text(row.created_at, 100);
  if (!Number.isFinite(Date.parse(createdAt))) return invalid();
  return {
    id: text(row.id, 100),
    import_key: importKey(row.import_key),
    anilist_id: anilistId,
    title,
    image: image(row.image) || null,
    memo: optionalText(row.memo, 1000) ?? null,
    created_at: createdAt,
    status: status as WatchlistItem['status'],
    season: season as WatchlistItem['season'],
    season_year: row.season_year == null ? null : integer(row.season_year, 1900, 2200),
    broadcast_day: row.broadcast_day == null ? null : integer(row.broadcast_day, 0, 6),
    broadcast_time: optionalText(row.broadcast_time, 20) ?? null,
    streaming_sites: strings(row.streaming_sites),
    streaming_updated_at: optionalText(row.streaming_updated_at),
    ...progress,
  };
}

export function validateBundle(value: unknown): RecordBundle {
  const input = obj(value);
  const seasons = list(input.seasons, 2000).map((value) => {
    const row = obj(value);
    const name = text(row.name, 100);
    if (!name.trim()) return invalid();
    return { name, animes: list(row.animes).map(anime) };
  });
  const rows = list(input.watchlist).map(watchlist);
  if (
    seasons.reduce((sum, season) => sum + season.animes.length, rows.length) > MAX_IMPORT_RECORDS
  ) {
    throw new Error('一度に読み込める記録は5000件までです');
  }
  return { seasons, watchlist: rows };
}

export function parseRecordFile(source: string): RecordBundle {
  if (new TextEncoder().encode(source).length > MAX_IMPORT_BYTES)
    throw new Error('ファイルは5MB以下にしてください');
  let input: Record<string, unknown>;
  try {
    input = obj(JSON.parse(source.replace(/^\uFEFF/, '')));
  } catch {
    throw new Error('アニメログのJSONファイルを選んでください');
  }
  if (input.format !== 'animelog-records' || input.version !== 1)
    throw new Error('この形式・バージョンのファイルには対応していません');
  return validateBundle(input);
}
