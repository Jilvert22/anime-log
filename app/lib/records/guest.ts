import type { Season } from '../../types';

export const RECORDS_CHANGED_EVENT = 'animelog-records-changed';

/** 既存データを勝手に整形・削除せず、読めない場合は元の文字列を保持する。 */
export function readGuestSeasons(): Season[] {
  const value: unknown = JSON.parse(localStorage.getItem('animeSeasons') ?? '[]');
  if (
    !Array.isArray(value) ||
    value.some(
      (season) =>
        !season ||
        typeof season.name !== 'string' ||
        !Array.isArray(season.animes) ||
        season.animes.some(
          (anime: unknown) =>
            !anime ||
            typeof anime !== 'object' ||
            !('title' in anime) ||
            typeof anime.title !== 'string' ||
            !('id' in anime) ||
            (typeof anime.id !== 'string' && typeof anime.id !== 'number')
        )
    )
  )
    throw new Error('端末の視聴記録を読み取れません。保存データは変更していません。');
  return value;
}
