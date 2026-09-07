import type { RecordBundle } from './importValidation';
import { validateBundle } from './importValidation';
import { readGuestSeasons, RECORDS_CHANGED_EVENT } from './guest';
import { LocalStorageService } from '../storage/localStorageService';
import { recordsToJson } from './export';

export const BEFORE_IMPORT_KEY = 'animelog-before-import';
export type GuestSnapshot = {
  bundle: RecordBundle;
  seasonsRaw: string | null;
  watchlistRaw: string | null;
};

export async function readGuestSnapshot(): Promise<GuestSnapshot> {
  const seasonsRaw = localStorage.getItem('animeSeasons');
  const watchlistRaw = localStorage.getItem('anime_watchlist');
  const seasons = readGuestSeasons();
  const watchlist = await new LocalStorageService().getWatchlist();
  if (
    seasonsRaw !== localStorage.getItem('animeSeasons') ||
    watchlistRaw !== localStorage.getItem('anime_watchlist')
  )
    throw new Error('端末の記録が更新されました。もう一度確認してください。');
  validateBundle({ seasons, watchlist });
  return { bundle: { seasons, watchlist }, seasonsRaw, watchlistRaw };
}

export function saveGuestImport(snapshot: GuestSnapshot, merged: RecordBundle): void {
  if (
    snapshot.seasonsRaw !== localStorage.getItem('animeSeasons') ||
    snapshot.watchlistRaw !== localStorage.getItem('anime_watchlist')
  )
    throw new Error('確認後に端末の記録が更新されました。内容をもう一度確認してください。');
  // 先に復旧用ファイルを確保する。ここで容量不足なら元データは一切変更しない。
  // オリジナルの配列を使い、対象外のローカル拡張フィールドも控えに残す。
  localStorage.setItem(
    BEFORE_IMPORT_KEY,
    recordsToJson(
      JSON.parse(snapshot.seasonsRaw ?? '[]'),
      JSON.parse(snapshot.watchlistRaw ?? '[]')
    )
  );
  try {
    localStorage.setItem('animeSeasons', JSON.stringify(merged.seasons));
    localStorage.setItem('anime_watchlist', JSON.stringify(merged.watchlist));
  } catch {
    try {
      for (const [key, value] of [
        ['animeSeasons', snapshot.seasonsRaw],
        ['anime_watchlist', snapshot.watchlistRaw],
      ] as const) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    } catch {
      throw new Error('復元を完了できませんでした。「復元前の記録」を書き出して保管してください。');
    }
    throw new Error('保存できなかったため元の記録に戻しました。空き容量をご確認ください。');
  } finally {
    window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT));
  }
}
